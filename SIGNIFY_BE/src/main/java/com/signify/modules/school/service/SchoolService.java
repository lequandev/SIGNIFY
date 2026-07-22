package com.signify.modules.school.service;

import com.signify.modules.auth.service.EmailService;
import com.signify.modules.assignment.repository.AssignmentProgressRepository;
import com.signify.modules.classroom.repository.ClassEnrollmentRepository;
import com.signify.modules.evaluation.repository.EvaluationRepository;
import com.signify.modules.school.dto.response.SchoolEntitlementContext;
import com.signify.modules.school.dto.response.SchoolMemberResponse;
import com.signify.modules.school.dto.response.SchoolOverviewResponse;
import com.signify.modules.school.dto.response.SchoolInvitationResponse;
import com.signify.modules.school.exception.SchoolConflictException;
import com.signify.modules.school.model.School;
import com.signify.modules.school.model.SchoolInvitation;
import com.signify.modules.school.model.SchoolMembership;
import com.signify.modules.school.repository.SchoolInvitationRepository;
import com.signify.modules.school.repository.SchoolMembershipRepository;
import com.signify.modules.school.repository.SchoolRepository;
import com.signify.modules.subscription.model.ServicePackage;
import com.signify.modules.subscription.model.Subscription;
import com.signify.modules.subscription.repository.ServicePackageRepository;
import com.signify.modules.subscription.repository.SubscriptionRepository;
import com.signify.modules.user.model.Role;
import com.signify.modules.user.model.User;
import com.signify.modules.user.repository.UserRepository;
import com.signify.modules.tracking.repository.HistoryRepository;
import com.signify.modules.tracking.repository.VideoWatchHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.Locale;
import java.util.UUID;

/**
 * Core service for the education "school" domain. Handles school context
 * and permissions adapted to school roles
 * (SCHOOL_ADMIN / TEACHER / STUDENT) and the {@code education} plan type.
 */
@Service
@RequiredArgsConstructor
public class SchoolService {

    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_INACTIVE = "INACTIVE";
    public static final String PLAN_TYPE_EDUCATION = "education";
    public static final String SCHOOL_NOT_FOUND = "SCHOOL_NOT_FOUND";
    public static final String SCHOOL_FORBIDDEN = "SCHOOL_FORBIDDEN";

    private final SchoolRepository schoolRepository;
    private final SchoolMembershipRepository membershipRepository;
    private final SchoolInvitationRepository invitationRepository;
    private final ClassEnrollmentRepository classEnrollmentRepository;
    private final AssignmentProgressRepository assignmentProgressRepository;
    private final EvaluationRepository evaluationRepository;
    private final HistoryRepository historyRepository;
    private final VideoWatchHistoryRepository videoWatchHistoryRepository;
    private final UserRepository userRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final ServicePackageRepository servicePackageRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    private static final String TEMP_PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

    @Value("${FRONTEND_URL:http://localhost:5173}")
    private String frontendUrl;

    public SchoolOverviewResponse getMySchool(String userId) {
        SchoolContext context = resolveSchoolContext(userId)
                .orElseThrow(() -> new RuntimeException(SCHOOL_NOT_FOUND));
        return toOverviewResponse(context);
    }

    @Transactional
    public SchoolOverviewResponse updateSchoolName(String adminUserId, String name) {
        SchoolContext context = resolveManagedSchoolContext(adminUserId);
        String normalizedName = name == null ? "" : name.trim();
        if (normalizedName.length() < 2 || normalizedName.length() > 120) {
            throw new RuntimeException("Tên trường phải có từ 2 đến 120 ký tự.");
        }
        context.school().setName(normalizedName);
        context.school().setUpdatedAt(LocalDateTime.now());
        schoolRepository.save(context.school());
        return toOverviewResponse(context);
    }

    @Transactional
    public SchoolContext updateDailyAiLimits(
            String adminUserId, int teacherDailyAiMinutes, int studentDailyAiMinutes) {
        SchoolContext context = resolveManagedSchoolContext(adminUserId);
        if (teacherDailyAiMinutes < 0 || teacherDailyAiMinutes > 1440
                || studentDailyAiMinutes < 0 || studentDailyAiMinutes > 1440) {
            throw new IllegalArgumentException("Giới hạn AI mỗi ngày phải từ 0 đến 1.440 phút.");
        }
        context.school().setTeacherDailyAiMinutes(teacherDailyAiMinutes);
        context.school().setStudentDailyAiMinutes(studentDailyAiMinutes);
        context.school().setUpdatedAt(LocalDateTime.now());
        schoolRepository.save(context.school());
        return context;
    }

    public Optional<SchoolEntitlementContext> getActiveSchoolEntitlement(String userId) {
        return resolveSchoolContext(userId)
                .map(context -> SchoolEntitlementContext.builder()
                        .school(context.school)
                        .membership(context.membership)
                        .subscription(context.subscription)
                        .servicePackage(context.servicePackage)
                        .build());
    }

    /**
     * Resolve the school membership for a user. Any user with exactly one active
     * membership resolves to that school; the first valid context wins otherwise.
     */
    public Optional<SchoolContext> resolveSchoolContext(String userId) {
        List<SchoolMembership> memberships = membershipRepository.findByUserIdAndStatus(userId, STATUS_ACTIVE);
        for (SchoolMembership membership : memberships) {
            Optional<SchoolContext> context = buildValidContext(membership);
            if (context.isPresent()) {
                return context;
            }
        }
        return Optional.empty();
    }

    private Optional<SchoolContext> buildValidContext(SchoolMembership membership) {
        Optional<School> schoolOpt = schoolRepository.findByIdAndStatus(membership.getSchoolId(), STATUS_ACTIVE);
        if (schoolOpt.isEmpty()) return Optional.empty();

        School school = schoolOpt.get();
        Optional<Subscription> subscriptionOpt = subscriptionRepository.findById(school.getSubscriptionId());
        if (subscriptionOpt.isEmpty()) return Optional.empty();

        Subscription subscription = subscriptionOpt.get();
        if (!STATUS_ACTIVE.equals(subscription.getStatus())) return Optional.empty();
        if (subscription.getEndDate() != null && subscription.getEndDate().isBefore(LocalDateTime.now())) {
            subscription.setStatus("EXPIRED");
            subscriptionRepository.save(subscription);
            return Optional.empty();
        }

        Optional<ServicePackage> packageOpt = servicePackageRepository.findById(subscription.getPackageId());
        if (packageOpt.isEmpty() || !isSchoolPlan(packageOpt.get().getPlanType())) {
            return Optional.empty();
        }

        return Optional.of(new SchoolContext(school, membership, subscription, packageOpt.get()));
    }

    /**
     * Resolve the school context and require SCHOOL_ADMIN role for management operations.
     */
    public SchoolContext resolveManagedSchoolContext(String userId) {
        SchoolContext context = resolveSchoolContext(userId)
                .orElseThrow(() -> new RuntimeException(SCHOOL_NOT_FOUND));
        if (!Role.SCHOOL_ADMIN.equals(context.membership.getRole())) {
            throw new RuntimeException(SCHOOL_FORBIDDEN);
        }
        return context;
    }


    /**
     * Provision a School when an education subscription is activated and make the
     * purchaser the SCHOOL_ADMIN. Idempotent per subscription. Also promotes the
     * owner user's role to SCHOOL_ADMIN if they were a plain user.
     */
    @Transactional
    public School provisionSchoolForSubscription(String userId,
                                                 Subscription subscription,
                                                 ServicePackage servicePackage,
                                                 String schoolName) {
        if (subscription == null || subscription.getId() == null) {
            throw new RuntimeException("Subscription not found");
        }
        if (servicePackage == null || !isSchoolPlan(servicePackage.getPlanType())) {
            return null;
        }

        Optional<School> existing = schoolRepository.findBySubscriptionId(subscription.getId());
        if (existing.isPresent()) {
            ensureOwnerMembership(existing.get(), userId);
            promoteOwnerRole(userId);
            return existing.get();
        }

        LocalDateTime now = LocalDateTime.now();
        School school = School.builder()
                .name(resolveSchoolName(schoolName))
                .ownerUserId(userId)
                .subscriptionId(subscription.getId())
                .status(STATUS_ACTIVE)
                .teacherDailyAiMinutes(0)
                .studentDailyAiMinutes(0)
                .createdAt(now)
                .updatedAt(now)
                .build();

        school = schoolRepository.save(school);
        ensureOwnerMembership(school, userId);
        promoteOwnerRole(userId);
        return school;
    }

    private void promoteOwnerRole(String userId) {
        userRepository.findById(userId).ifPresent(user -> {
            if (!Role.ADMIN.equals(user.getRole()) && !Role.SCHOOL_ADMIN.equals(user.getRole())) {
                user.setRole(Role.SCHOOL_ADMIN);
                userRepository.save(user);
            }
        });
    }


    public List<SchoolMemberResponse> getMembers(String adminUserId, String roleFilter) {
        SchoolContext context = resolveSchoolContext(adminUserId)
                .orElseThrow(() -> new RuntimeException(SCHOOL_NOT_FOUND));
        boolean schoolAdmin = Role.SCHOOL_ADMIN.equals(context.membership().getRole());
        boolean teacherStudentRead = Role.TEACHER.equals(context.membership().getRole())
                && roleFilter != null && Role.STUDENT.equalsIgnoreCase(roleFilter);
        if (!schoolAdmin && !teacherStudentRead) {
            throw new RuntimeException(SCHOOL_FORBIDDEN);
        }
        List<SchoolMembership> memberships = (roleFilter == null || roleFilter.isBlank())
                ? membershipRepository.findBySchoolId(context.school.getId())
                : membershipRepository.findBySchoolIdAndRole(context.school.getId(), normalizeRole(roleFilter));
        return memberships.stream()
                .sorted(Comparator.comparing(SchoolMembership::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(this::toMemberResponse)
                .toList();
    }

    public List<SchoolInvitationResponse> getPendingTeacherInvitations(String adminUserId) {
        SchoolContext context = resolveManagedSchoolContext(adminUserId);
        return invitationRepository.findBySchoolIdAndStatus(context.school().getId(), "PENDING")
                .stream()
                .sorted(Comparator.comparing(SchoolInvitation::getCreatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toInvitationResponse)
                .toList();
    }

    /** Send a teacher invitation. The account is created/linked only after acceptance. */
    @Transactional
    public SchoolInvitationResponse inviteTeacher(String adminUserId, String fullName, String email) {
        SchoolContext context = resolveManagedSchoolContext(adminUserId);
        String normalizedName = requireFullName(fullName);
        String normalizedEmail = requireEmail(email);
        Optional<User> existingUser = userRepository.findByEmailIgnoreCase(normalizedEmail);
        if (existingUser.isPresent()) {
            boolean alreadyInSchool = membershipRepository
                    .findBySchoolIdAndUserId(context.school().getId(), existingUser.get().getId()).isPresent();
            if (alreadyInSchool) {
                throw new SchoolConflictException("TEACHER_ALREADY_IN_SCHOOL", "Tài khoản này đã thuộc trường.");
            }
            if (Role.STUDENT.equals(existingUser.get().getRole())
                    || Role.SCHOOL_ADMIN.equals(existingUser.get().getRole())
                    || Role.ADMIN.equals(existingUser.get().getRole())) {
                throw new SchoolConflictException("ROLE_NOT_COMPATIBLE", "Tài khoản hiện tại không thể được mời làm giáo viên.");
            }
        }
        LocalDateTime now = LocalDateTime.now();
        SchoolInvitation invitation = invitationRepository
                .findBySchoolIdAndEmailAndStatus(context.school().getId(), normalizedEmail, "PENDING")
                .orElseGet(() -> SchoolInvitation.builder()
                        .schoolId(context.school().getId())
                        .email(normalizedEmail)
                        .role(Role.TEACHER)
                        .token(UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", ""))
                        .status("PENDING")
                        .createdAt(now)
                        .build());
        invitation.setInviterUserId(adminUserId);
        invitation.setFullName(normalizedName);
        invitation.setExpiresAt(now.plusDays(7));
        invitation = invitationRepository.save(invitation);
        String acceptUrl = frontendUrl.replaceAll("/+$", "") + "/school/invitations/" + invitation.getToken();
        emailService.sendHtmlEmail(normalizedEmail, "You are invited to teach on Signify",
                "<p>" + normalizedName + ", you have been invited to join a Signify school as a teacher.</p>"
                        + "<p><a href=\"" + acceptUrl + "\">Review and accept invitation</a></p>"
                        + "<p>If you do not have a Signify account, register first, then sign in and open this link again.</p>");
        return toInvitationResponse(invitation);
    }

    @Transactional
    public SchoolMemberResponse acceptTeacherInvitation(String userId, String token) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản."));
        SchoolInvitation invitation = resolveInvitationForUser(user, token)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lời mời."));
        if ("ACCEPTED".equals(invitation.getStatus()) && userId.equals(invitation.getAcceptedUserId())) {
            SchoolMembership membership = membershipRepository
                    .findBySchoolIdAndUserId(invitation.getSchoolId(), userId)
                    .orElseThrow(() -> new RuntimeException(SCHOOL_NOT_FOUND));
            return toMemberResponse(membership);
        }
        if (!"PENDING".equals(invitation.getStatus())) {
            throw new SchoolConflictException("INVITATION_NOT_PENDING", "Lời mời này đã được xử lý.");
        }
        if (invitation.getExpiresAt() != null && invitation.getExpiresAt().isBefore(LocalDateTime.now())) {
            invitation.setStatus("EXPIRED");
            invitationRepository.save(invitation);
            throw new SchoolConflictException("INVITATION_EXPIRED", "Lời mời đã hết hạn.");
        }
        if (user.getEmail() == null || !invitation.getEmail().equalsIgnoreCase(user.getEmail())) {
            throw new SchoolConflictException("INVITATION_EMAIL_MISMATCH", "Vui lòng đăng nhập bằng đúng email được mời.");
        }
        if (Role.STUDENT.equals(user.getRole()) || Role.SCHOOL_ADMIN.equals(user.getRole()) || Role.ADMIN.equals(user.getRole())) {
            throw new SchoolConflictException("ROLE_NOT_COMPATIBLE", "Tài khoản hiện tại không thể nhận lời mời giáo viên.");
        }
        SchoolMembership existing = membershipRepository.findBySchoolIdAndUserId(invitation.getSchoolId(), userId).orElse(null);
        if (existing != null) {
            throw new SchoolConflictException("TEACHER_ALREADY_IN_SCHOOL", "Tài khoản này đã thuộc trường.");
        }
        boolean otherSchool = membershipRepository.findByUserIdAndStatus(userId, STATUS_ACTIVE).stream()
                .anyMatch(membership -> !invitation.getSchoolId().equals(membership.getSchoolId()));
        if (otherSchool) {
            throw new SchoolConflictException("ACCOUNT_BELONGS_TO_ANOTHER_SCHOOL", "Tài khoản đang thuộc một trường khác.");
        }
        SchoolContext context = resolveSchoolContext(invitation.getInviterUserId())
                .orElseThrow(() -> new RuntimeException(SCHOOL_NOT_FOUND));
        SchoolMembership membership = addMembership(context, userId, Role.TEACHER);
        user.setRole(Role.TEACHER);
        user.setStatus(STATUS_ACTIVE);
        userRepository.save(user);
        invitation.setStatus("ACCEPTED");
        invitation.setAcceptedUserId(userId);
        invitation.setAcceptedAt(LocalDateTime.now());
        invitationRepository.save(invitation);
        return toMemberResponse(membership);
    }

    private SchoolInvitationResponse toInvitationResponse(SchoolInvitation invitation) {
        return SchoolInvitationResponse.builder()
                .id(invitation.getId()).email(invitation.getEmail()).fullName(invitation.getFullName())
                .role(invitation.getRole()).status(invitation.getStatus()).expiresAt(invitation.getExpiresAt()).build();
    }

    public SchoolInvitationResponse getTeacherInvitation(String userId, String token) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản."));
        SchoolInvitation invitation = resolveInvitationForUser(user, token)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lời mời."));
        return toInvitationResponse(invitation);
    }

    private Optional<SchoolInvitation> resolveInvitationForUser(User user, String token) {
        Optional<SchoolInvitation> tokenMatch = invitationRepository.findByToken(token);
        if (tokenMatch.isPresent()) return tokenMatch;
        if (user.getEmail() == null || user.getEmail().isBlank()) return Optional.empty();
        List<SchoolInvitation> emailMatches = invitationRepository
                .findByEmailIgnoreCaseAndStatus(user.getEmail(), "PENDING");
        return emailMatches.size() == 1 ? Optional.of(emailMatches.get(0)) : Optional.empty();
    }

    /** Create a student account directly from a teacher or school admin portal. */
    @Transactional
    public ProvisionedMember createStudent(String creatorUserId, String fullName, String preferredUsername) {
        SchoolContext context = resolveSchoolContext(creatorUserId)
                .orElseThrow(() -> new RuntimeException(SCHOOL_NOT_FOUND));
        String creatorRole = context.membership().getRole();
        if (!Role.TEACHER.equals(creatorRole) && !Role.SCHOOL_ADMIN.equals(creatorRole)) {
            throw new RuntimeException(SCHOOL_FORBIDDEN);
        }
        String normalizedName = requireFullName(fullName);
        String username = resolveStudentUsername(preferredUsername);
        String temporaryPassword = generateTemporaryPassword();
        User user = User.builder()
                .fullName(normalizedName)
                .username(username)
                .passwordHash(passwordEncoder.encode(temporaryPassword))
                .isVerified(true)
                .role(Role.STUDENT)
                .status(STATUS_ACTIVE)
                .mustChangePassword(true)
                .createdAt(LocalDateTime.now())
                .build();
        user = userRepository.save(user);
        SchoolMembership membership = addMembership(context, user.getId(), Role.STUDENT);
        return new ProvisionedMember(toMemberResponse(membership), username, temporaryPassword);
    }

    @Transactional
    public StudentCredentials resetStudentPassword(String actorUserId, String studentUserId) {
        SchoolContext context = resolveSchoolContext(actorUserId)
                .orElseThrow(() -> new RuntimeException(SCHOOL_NOT_FOUND));
        String actorRole = context.membership().getRole();
        if (!Role.TEACHER.equals(actorRole) && !Role.SCHOOL_ADMIN.equals(actorRole)) {
            throw new RuntimeException(SCHOOL_FORBIDDEN);
        }
        SchoolMembership membership = membershipRepository.findBySchoolIdAndUserId(context.school().getId(), studentUserId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy học sinh trong trường."));
        if (!Role.STUDENT.equals(membership.getRole())) {
            throw new RuntimeException("Tài khoản được chọn không phải học sinh.");
        }
        User student = userRepository.findById(studentUserId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản học sinh."));
        String temporaryPassword = generateTemporaryPassword();
        if (student.getUsername() == null || student.getUsername().isBlank()) {
            student.setUsername(resolveStudentUsername(null));
        }
        student.setPasswordHash(passwordEncoder.encode(temporaryPassword));
        student.setMustChangePassword(true);
        student.setStatus(STATUS_ACTIVE);
        userRepository.save(student);
        return new StudentCredentials(student.getUsername(), temporaryPassword);
    }

    private String requireFullName(String fullName) {
        String normalized = fullName == null ? "" : fullName.trim();
        if (normalized.isBlank()) throw new RuntimeException("Họ tên là bắt buộc.");
        return normalized;
    }

    private String requireEmail(String email) {
        String normalized = email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
        if (normalized.isBlank() || !normalized.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) {
            throw new RuntimeException("Email không hợp lệ.");
        }
        return normalized;
    }

    private String resolveStudentUsername(String preferredUsername) {
        if (preferredUsername != null && !preferredUsername.isBlank()) {
            String normalized = preferredUsername.trim().toUpperCase(Locale.ROOT);
            if (!normalized.matches("[A-Z0-9._-]{4,32}")) {
                throw new RuntimeException("Mã đăng nhập chỉ gồm chữ, số, dấu chấm, gạch ngang hoặc gạch dưới.");
            }
            if (userRepository.existsByUsernameIgnoreCase(normalized)) {
                throw new SchoolConflictException("USERNAME_ALREADY_EXISTS", "Mã đăng nhập này đã được sử dụng.");
            }
            return normalized;
        }
        SecureRandom random = new SecureRandom();
        for (int attempt = 0; attempt < 30; attempt++) {
            StringBuilder candidate = new StringBuilder("HS-");
            for (int i = 0; i < 8; i++) {
                candidate.append(TEMP_PASSWORD_CHARS.charAt(random.nextInt(TEMP_PASSWORD_CHARS.length())));
            }
            String username = candidate.toString().toUpperCase(Locale.ROOT);
            if (!userRepository.existsByUsernameIgnoreCase(username)) return username;
        }
        throw new RuntimeException("Không thể tạo mã đăng nhập duy nhất. Vui lòng thử lại.");
    }

    private String generateTemporaryPassword() {
        SecureRandom random = new SecureRandom();
        StringBuilder result = new StringBuilder(12);
        for (int i = 0; i < 12; i++) result.append(TEMP_PASSWORD_CHARS.charAt(random.nextInt(TEMP_PASSWORD_CHARS.length())));
        return result.toString();
    }

    @Transactional
    public SchoolMemberResponse updateMemberStatus(String adminUserId, String memberId, String status) {
        SchoolContext context = resolveManagedSchoolContext(adminUserId);
        String normalizedStatus = normalizeStatus(status);

        SchoolMembership membership = membershipRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thành viên."));
        ensureMembershipBelongsToSchool(membership, context.school.getId());
        ensureNotOwnerMembership(membership, context.school);

        membership.setStatus(normalizedStatus);
        membership.setUpdatedAt(LocalDateTime.now());
        SchoolMembership saved = membershipRepository.save(membership);

        // Keep the user account status in sync so login/lockout is enforced.
        userRepository.findById(membership.getUserId()).ifPresent(user -> {
            user.setStatus(normalizedStatus);
            userRepository.save(user);
        });
        return toMemberResponse(saved);
    }

    @Transactional
    public void deleteMember(String adminUserId, String memberId) {
        SchoolContext context = resolveManagedSchoolContext(adminUserId);
        SchoolMembership membership = membershipRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thành viên."));
        ensureMembershipBelongsToSchool(membership, context.school.getId());
        ensureNotOwnerMembership(membership, context.school);
        membershipRepository.delete(membership);
        if (Role.STUDENT.equals(membership.getRole())) {
            deleteStudentAccount(membership.getUserId());
        }
    }

    private void deleteStudentAccount(String studentUserId) {
        classEnrollmentRepository.deleteByStudentId(studentUserId);
        assignmentProgressRepository.deleteByStudentId(studentUserId);
        evaluationRepository.deleteByStudentId(studentUserId);
        historyRepository.deleteByUserId(studentUserId);
        videoWatchHistoryRepository.deleteByUserId(studentUserId);
        membershipRepository.deleteByUserId(studentUserId);
        userRepository.deleteById(studentUserId);
    }

    /**
     * Create a membership for an already-existing user in the given school.
     */
    @Transactional
    public SchoolMembership addMembership(SchoolContext context, String userId, String role) {
        Optional<SchoolMembership> existing = membershipRepository.findBySchoolIdAndUserId(context.school.getId(), userId);
        if (existing.isPresent()) {
            return existing.get();
        }
        LocalDateTime now = LocalDateTime.now();
        SchoolMembership membership = SchoolMembership.builder()
                .schoolId(context.school.getId())
                .userId(userId)
                .role(normalizeRole(role))
                .status(STATUS_ACTIVE)
                .createdAt(now)
                .updatedAt(now)
                .build();
        return membershipRepository.save(membership);
    }

    private SchoolOverviewResponse toOverviewResponse(SchoolContext context) {
        String schoolId = context.school.getId();
        long memberCount = membershipRepository.countBySchoolId(schoolId);
        long teacherCount = membershipRepository.countBySchoolIdAndRole(schoolId, Role.TEACHER);
        long studentCount = membershipRepository.countBySchoolIdAndRole(schoolId, Role.STUDENT);
        return SchoolOverviewResponse.builder()
                .schoolId(schoolId)
                .schoolName(context.school.getName())
                .role(context.membership.getRole())
                .status(context.school.getStatus())
                .subscriptionId(context.subscription.getId())
                .packageName(context.servicePackage.getName())
                .planType(context.servicePackage.getPlanType())
                .expiresAt(context.subscription.getEndDate())
                .memberCount(memberCount)
                .teacherCount(teacherCount)
                .studentCount(studentCount)
                .canManageMembers(Role.SCHOOL_ADMIN.equals(context.membership.getRole()))
                .build();
    }

    SchoolMemberResponse toMemberResponse(SchoolMembership membership) {
        User user = userRepository.findById(membership.getUserId()).orElse(null);
        return SchoolMemberResponse.builder()
                .id(membership.getId())
                .userId(membership.getUserId())
                .fullName(user != null ? user.getFullName() : "Người dùng Signify")
                .email(user != null ? user.getEmail() : "")
                .username(user != null ? user.getUsername() : null)
                .phoneNumber(user != null ? user.getPhoneNumber() : null)
                .address(user != null ? user.getAddress() : null)
                .avatarUrl(user != null ? user.getAvatarUrl() : null)
                .userStatus(user != null ? user.getStatus() : null)
                .role(membership.getRole())
                .status(membership.getStatus())
                .createdAt(membership.getCreatedAt())
                .updatedAt(membership.getUpdatedAt())
                .build();
    }


    private void ensureOwnerMembership(School school, String userId) {
        membershipRepository.findBySchoolIdAndUserId(school.getId(), userId)
                .orElseGet(() -> membershipRepository.save(SchoolMembership.builder()
                        .schoolId(school.getId())
                        .userId(userId)
                        .role(Role.SCHOOL_ADMIN)
                        .status(STATUS_ACTIVE)
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build()));
    }

    private void ensureMembershipBelongsToSchool(SchoolMembership membership, String schoolId) {
        if (!schoolId.equals(membership.getSchoolId())) {
            throw new RuntimeException("Thành viên không thuộc trường này.");
        }
    }

    private void ensureNotOwnerMembership(SchoolMembership membership, School school) {
        if (school.getOwnerUserId().equals(membership.getUserId()) || Role.SCHOOL_ADMIN.equals(membership.getRole())) {
            throw new RuntimeException("Không thể thay đổi tài khoản quản trị trường.");
        }
    }

    private String resolveSchoolName(String schoolName) {
        String name = schoolName == null ? "" : schoolName.trim();
        return name.isEmpty() ? "Trường học Signify" : name;
    }

    private String normalizeStatus(String status) {
        String normalized = status == null ? "" : status.trim().toUpperCase();
        if (!STATUS_ACTIVE.equals(normalized) && !STATUS_INACTIVE.equals(normalized)) {
            throw new RuntimeException("Trạng thái thành viên không hợp lệ.");
        }
        return normalized;
    }

    private String normalizeRole(String role) {
        String normalized = role == null ? "" : role.trim().toUpperCase();
        if (!Role.SCHOOL_ADMIN.equals(normalized)
                && !Role.TEACHER.equals(normalized)
                && !Role.STUDENT.equals(normalized)) {
            throw new RuntimeException("Vai trò không hợp lệ.");
        }
        return normalized;
    }

    /** True for education subscriptions. Legacy package values are migrated at startup. */
    public static boolean isSchoolPlan(String planType) {
        return PLAN_TYPE_EDUCATION.equals(planType);
    }

    /**
     * Resolved school context for a user. Public so sibling education modules
     * (classroom, assignment, evaluation) can enforce school isolation.
     */
    public record SchoolContext(
            School school,
            SchoolMembership membership,
            Subscription subscription,
            ServicePackage servicePackage
    ) {}

    public record ProvisionedMember(SchoolMemberResponse member, String loginId, String temporaryPassword) {}

    public record StudentCredentials(String loginId, String temporaryPassword) {}

    public static boolean isSchoolNotFound(RuntimeException e) {
        return SCHOOL_NOT_FOUND.equals(e.getMessage());
    }

    public static boolean isSchoolForbidden(RuntimeException e) {
        return SCHOOL_FORBIDDEN.equals(e.getMessage());
    }
}
