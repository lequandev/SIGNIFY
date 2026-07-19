package com.signify.modules.business.service;

import com.signify.modules.auth.service.EmailService;
import com.signify.modules.business.dto.response.BusinessEntitlementContext;
import com.signify.modules.business.dto.response.BusinessInvitationResponse;
import com.signify.modules.business.dto.response.BusinessMemberResponse;
import com.signify.modules.business.dto.response.BusinessOverviewResponse;
import com.signify.modules.business.model.BusinessInvitation;
import com.signify.modules.business.model.BusinessMembership;
import com.signify.modules.business.model.BusinessOrganization;
import com.signify.modules.business.repository.BusinessInvitationRepository;
import com.signify.modules.business.repository.BusinessMembershipRepository;
import com.signify.modules.business.repository.BusinessOrganizationRepository;
import com.signify.modules.subscription.model.ServicePackage;
import com.signify.modules.subscription.model.Subscription;
import com.signify.modules.subscription.repository.ServicePackageRepository;
import com.signify.modules.subscription.repository.SubscriptionRepository;
import com.signify.modules.user.model.User;
import com.signify.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BusinessService {

    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_INACTIVE = "INACTIVE";
    public static final String ROLE_BUSINESS_ADMIN = "BUSINESS_ADMIN";
    public static final String ROLE_MEMBER = "MEMBER";

    private static final String INVITATION_PENDING = "PENDING";
    private static final String INVITATION_ACCEPTED = "ACCEPTED";
    private static final String INVITATION_EXPIRED = "EXPIRED";
    private static final int INVITATION_EXPIRES_DAYS = 7;
    private static final int DEFAULT_MAX_ACCOUNTS = 20;
    private static final String BUSINESS_NOT_FOUND = "BUSINESS_NOT_FOUND";
    private static final String BUSINESS_FORBIDDEN = "BUSINESS_FORBIDDEN";

    private final BusinessOrganizationRepository organizationRepository;
    private final BusinessMembershipRepository membershipRepository;
    private final BusinessInvitationRepository invitationRepository;
    private final UserRepository userRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final ServicePackageRepository servicePackageRepository;
    private final EmailService emailService;

    @Value("${FRONTEND_URL:http://localhost:5173}")
    private String frontendUrl;

    public BusinessOverviewResponse getMyBusiness(String userId) {
        BusinessContext context = resolveBusinessContext(userId)
                .orElseThrow(() -> new RuntimeException(BUSINESS_NOT_FOUND));
        return toOverviewResponse(context);
    }

    public List<BusinessMemberResponse> getMembers(String userId) {
        BusinessContext context = resolveManagedBusinessContext(userId);
        return membershipRepository.findByOrganizationId(context.organization.getId())
                .stream()
                .sorted(Comparator.comparing(BusinessMembership::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(this::toMemberResponse)
                .toList();
    }

    @Transactional
    public BusinessInvitationResponse addMember(String adminUserId, String email) {
        BusinessContext context = resolveManagedBusinessContext(adminUserId);
        String normalizedEmail = normalizeEmail(email);
        LocalDateTime now = LocalDateTime.now();

        userRepository.findByEmail(normalizedEmail)
                .flatMap(user -> membershipRepository.findByOrganizationIdAndUserId(context.organization.getId(), user.getId()))
                .ifPresent(existing -> {
                    throw new RuntimeException("Thành viên này đã thuộc doanh nghiệp.");
                });

        Optional<BusinessInvitation> existingPending = invitationRepository
                .findFirstByOrganizationIdAndEmailAndStatusOrderByCreatedAtDesc(context.organization.getId(), normalizedEmail, INVITATION_PENDING);
        boolean isResendingActiveInvite = existingPending
                .map(invitation -> invitation.getExpiresAt() != null && invitation.getExpiresAt().isAfter(now))
                .orElse(false);

        long memberCount = membershipRepository.countByOrganizationId(context.organization.getId());
        long pendingInvitationCount = invitationRepository.countByOrganizationIdAndStatusAndExpiresAtAfter(
                context.organization.getId(), INVITATION_PENDING, now);
        int maxAccounts = resolveMaxAccounts(context.servicePackage);
        if (!isResendingActiveInvite && memberCount + pendingInvitationCount >= maxAccounts) {
            throw new RuntimeException("Doanh nghiệp đã đạt giới hạn " + maxAccounts + " tài khoản.");
        }

        BusinessInvitation invitation = existingPending.orElseGet(BusinessInvitation::new);
        invitation.setOrganizationId(context.organization.getId());
        invitation.setEmail(normalizedEmail);
        invitation.setInvitedByUserId(adminUserId);
        invitation.setToken(generateInvitationToken());
        invitation.setRole(ROLE_MEMBER);
        invitation.setStatus(INVITATION_PENDING);
        invitation.setExpiresAt(now.plusDays(INVITATION_EXPIRES_DAYS));
        invitation.setAcceptedAt(null);
        if (invitation.getCreatedAt() == null) {
            invitation.setCreatedAt(now);
        }
        invitation.setUpdatedAt(now);

        BusinessInvitation savedInvitation = invitationRepository.save(invitation);
        sendInvitationEmail(context.organization, adminUserId, savedInvitation);
        return toInvitationResponse(savedInvitation);
    }

    @Transactional
    public BusinessMemberResponse acceptInvitation(String userId, String token) {
        BusinessInvitation invitation = invitationRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Lời mời không hợp lệ."));
        LocalDateTime now = LocalDateTime.now();

        if (!INVITATION_PENDING.equals(invitation.getStatus())) {
            throw new RuntimeException("Lời mời này không còn hiệu lực.");
        }
        if (invitation.getExpiresAt() == null || invitation.getExpiresAt().isBefore(now)) {
            invitation.setStatus(INVITATION_EXPIRED);
            invitation.setUpdatedAt(now);
            invitationRepository.save(invitation);
            throw new RuntimeException("Lời mời đã hết hạn.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng."));
        if (!invitation.getEmail().equals(normalizeEmail(user.getEmail()))) {
            throw new RuntimeException("Vui lòng đăng nhập bằng email " + invitation.getEmail() + " để nhận lời mời.");
        }

        BusinessOrganization organization = organizationRepository.findByIdAndStatus(invitation.getOrganizationId(), STATUS_ACTIVE)
                .orElseThrow(() -> new RuntimeException("Doanh nghiệp không còn hoạt động."));
        ServicePackage servicePackage = resolveActiveBusinessPackage(organization);

        Optional<BusinessMembership> existingMembership = membershipRepository.findByOrganizationIdAndUserId(organization.getId(), userId);
        if (existingMembership.isPresent()) {
            BusinessMembership membership = existingMembership.get();
            if (!STATUS_ACTIVE.equals(membership.getStatus())) {
                membership.setStatus(STATUS_ACTIVE);
                membership.setUpdatedAt(now);
                membership = membershipRepository.save(membership);
            }
            markInvitationAccepted(invitation, now);
            return toMemberResponse(membership);
        }

        long memberCount = membershipRepository.countByOrganizationId(organization.getId());
        int maxAccounts = resolveMaxAccounts(servicePackage);
        if (memberCount >= maxAccounts) {
            throw new RuntimeException("Doanh nghiệp đã đạt giới hạn " + maxAccounts + " tài khoản.");
        }

        BusinessMembership membership = BusinessMembership.builder()
                .organizationId(organization.getId())
                .userId(userId)
                .role(invitation.getRole() != null ? invitation.getRole() : ROLE_MEMBER)
                .status(STATUS_ACTIVE)
                .createdAt(now)
                .updatedAt(now)
                .build();

        BusinessMembership savedMembership = membershipRepository.save(membership);
        markInvitationAccepted(invitation, now);
        return toMemberResponse(savedMembership);
    }

    @Transactional
    public BusinessMemberResponse updateMemberStatus(String adminUserId, String memberId, String status) {
        BusinessContext context = resolveManagedBusinessContext(adminUserId);
        String normalizedStatus = normalizeStatus(status);

        BusinessMembership membership = membershipRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thành viên."));
        ensureMembershipBelongsToOrganization(membership, context.organization.getId());
        ensureNotOwnerMembership(membership, context.organization);

        membership.setStatus(normalizedStatus);
        membership.setUpdatedAt(LocalDateTime.now());
        return toMemberResponse(membershipRepository.save(membership));
    }

    @Transactional
    public void deleteMember(String adminUserId, String memberId) {
        BusinessContext context = resolveManagedBusinessContext(adminUserId);
        BusinessMembership membership = membershipRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thành viên."));
        ensureMembershipBelongsToOrganization(membership, context.organization.getId());
        ensureNotOwnerMembership(membership, context.organization);
        membershipRepository.delete(membership);
    }

    public Optional<BusinessEntitlementContext> getActiveBusinessEntitlement(String userId) {
        return resolveBusinessContext(userId)
                .map(context -> BusinessEntitlementContext.builder()
                        .organization(context.organization)
                        .membership(context.membership)
                        .subscription(context.subscription)
                        .servicePackage(context.servicePackage)
                        .build());
    }

    @Transactional
    public BusinessOrganization provisionBusinessForSubscription(String userId,
                                                                 Subscription subscription,
                                                                 ServicePackage servicePackage,
                                                                 String organizationName) {
        if (subscription == null || subscription.getId() == null) {
            throw new RuntimeException("Subscription not found");
        }
        if (servicePackage == null || !"business".equals(servicePackage.getPlanType())) {
            return null;
        }

        Optional<BusinessOrganization> existingOrganization = organizationRepository.findBySubscriptionId(subscription.getId());
        if (existingOrganization.isPresent()) {
            ensureOwnerMembership(existingOrganization.get(), userId);
            return existingOrganization.get();
        }

        LocalDateTime now = LocalDateTime.now();
        BusinessOrganization organization = BusinessOrganization.builder()
                .name(resolveOrganizationName(organizationName))
                .ownerUserId(userId)
                .subscriptionId(subscription.getId())
                .status(STATUS_ACTIVE)
                .createdAt(now)
                .updatedAt(now)
                .build();

        organization = organizationRepository.save(organization);
        ensureOwnerMembership(organization, userId);
        return organization;
    }

    private Optional<BusinessContext> resolveBusinessContext(String userId) {
        List<BusinessMembership> memberships = membershipRepository.findByUserIdAndStatus(userId, STATUS_ACTIVE);
        for (BusinessMembership membership : memberships) {
            Optional<BusinessContext> context = buildValidContext(membership);
            if (context.isPresent()) {
                return context;
            }
        }
        return Optional.empty();
    }

    private Optional<BusinessContext> buildValidContext(BusinessMembership membership) {
        Optional<BusinessOrganization> organizationOpt = organizationRepository.findByIdAndStatus(membership.getOrganizationId(), STATUS_ACTIVE);
        if (organizationOpt.isEmpty()) return Optional.empty();

        BusinessOrganization organization = organizationOpt.get();
        Optional<Subscription> subscriptionOpt = subscriptionRepository.findById(organization.getSubscriptionId());
        if (subscriptionOpt.isEmpty()) return Optional.empty();

        Subscription subscription = subscriptionOpt.get();
        if (!STATUS_ACTIVE.equals(subscription.getStatus())) return Optional.empty();
        if (subscription.getEndDate() != null && subscription.getEndDate().isBefore(LocalDateTime.now())) {
            subscription.setStatus("EXPIRED");
            subscriptionRepository.save(subscription);
            return Optional.empty();
        }

        Optional<ServicePackage> packageOpt = servicePackageRepository.findById(subscription.getPackageId());
        if (packageOpt.isEmpty() || !"business".equals(packageOpt.get().getPlanType())) return Optional.empty();

        return Optional.of(new BusinessContext(organization, membership, subscription, packageOpt.get()));
    }

    private BusinessContext resolveManagedBusinessContext(String userId) {
        BusinessContext context = resolveBusinessContext(userId)
                .orElseThrow(() -> new RuntimeException(BUSINESS_NOT_FOUND));
        if (!ROLE_BUSINESS_ADMIN.equals(context.membership.getRole())) {
            throw new RuntimeException(BUSINESS_FORBIDDEN);
        }
        return context;
    }

    private BusinessOverviewResponse toOverviewResponse(BusinessContext context) {
        long memberCount = membershipRepository.countByOrganizationId(context.organization.getId());
        return BusinessOverviewResponse.builder()
                .organizationId(context.organization.getId())
                .organizationName(context.organization.getName())
                .role(context.membership.getRole())
                .status(context.organization.getStatus())
                .subscriptionId(context.subscription.getId())
                .packageName(context.servicePackage.getName())
                .planType(context.servicePackage.getPlanType())
                .expiresAt(context.subscription.getEndDate())
                .memberCount(memberCount)
                .maxAccounts(resolveMaxAccounts(context.servicePackage))
                .canManageMembers(ROLE_BUSINESS_ADMIN.equals(context.membership.getRole()))
                .build();
    }

    private BusinessMemberResponse toMemberResponse(BusinessMembership membership) {
        User user = userRepository.findById(membership.getUserId()).orElse(null);
        return BusinessMemberResponse.builder()
                .id(membership.getId())
                .userId(membership.getUserId())
                .fullName(user != null ? user.getFullName() : "Người dùng Signify")
                .email(user != null ? user.getEmail() : "")
                .avatarUrl(user != null ? user.getAvatarUrl() : null)
                .userStatus(user != null ? user.getStatus() : null)
                .role(membership.getRole())
                .status(membership.getStatus())
                .createdAt(membership.getCreatedAt())
                .updatedAt(membership.getUpdatedAt())
                .build();
    }

    private BusinessInvitationResponse toInvitationResponse(BusinessInvitation invitation) {
        return BusinessInvitationResponse.builder()
                .id(invitation.getId())
                .email(invitation.getEmail())
                .role(invitation.getRole())
                .status(invitation.getStatus())
                .expiresAt(invitation.getExpiresAt())
                .createdAt(invitation.getCreatedAt())
                .updatedAt(invitation.getUpdatedAt())
                .build();
    }

    private void ensureOwnerMembership(BusinessOrganization organization, String userId) {
        membershipRepository.findByOrganizationIdAndUserId(organization.getId(), userId)
                .orElseGet(() -> membershipRepository.save(BusinessMembership.builder()
                        .organizationId(organization.getId())
                        .userId(userId)
                        .role(ROLE_BUSINESS_ADMIN)
                        .status(STATUS_ACTIVE)
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build()));
    }

    private void ensureMembershipBelongsToOrganization(BusinessMembership membership, String organizationId) {
        if (!organizationId.equals(membership.getOrganizationId())) {
            throw new RuntimeException("Thành viên không thuộc doanh nghiệp này.");
        }
    }

    private void ensureNotOwnerMembership(BusinessMembership membership, BusinessOrganization organization) {
        if (organization.getOwnerUserId().equals(membership.getUserId()) || ROLE_BUSINESS_ADMIN.equals(membership.getRole())) {
            throw new RuntimeException("Không thể thay đổi tài khoản admin doanh nghiệp trong MVP này.");
        }
    }

    private ServicePackage resolveActiveBusinessPackage(BusinessOrganization organization) {
        Subscription subscription = subscriptionRepository.findById(organization.getSubscriptionId())
                .orElseThrow(() -> new RuntimeException("Gói doanh nghiệp không còn hoạt động."));
        if (!STATUS_ACTIVE.equals(subscription.getStatus())) {
            throw new RuntimeException("Gói doanh nghiệp không còn hoạt động.");
        }
        if (subscription.getEndDate() != null && subscription.getEndDate().isBefore(LocalDateTime.now())) {
            subscription.setStatus("EXPIRED");
            subscriptionRepository.save(subscription);
            throw new RuntimeException("Gói doanh nghiệp đã hết hạn.");
        }

        ServicePackage servicePackage = servicePackageRepository.findById(subscription.getPackageId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy gói doanh nghiệp."));
        if (!"business".equals(servicePackage.getPlanType())) {
            throw new RuntimeException("Gói hiện tại không phải gói doanh nghiệp.");
        }
        return servicePackage;
    }

    private void sendInvitationEmail(BusinessOrganization organization, String adminUserId, BusinessInvitation invitation) {
        User admin = userRepository.findById(adminUserId).orElse(null);
        String adminName = admin != null && admin.getFullName() != null ? admin.getFullName() : "Business Admin";
        String inviteUrl = frontendUrl + "/accept-invite/" + invitation.getToken();
        String organizationName = escapeHtml(organization.getName());
        String emailContent = "<div style=\"font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;\">" +
                "<h2 style=\"color: #4F46E5;\">Bạn được mời tham gia " + organizationName + " trên Signify</h2>" +
                "<p>" + escapeHtml(adminName) + " đã mời bạn tham gia workspace doanh nghiệp <strong>" + organizationName + "</strong>.</p>" +
                "<p>Nhấn nút bên dưới, sau đó đăng nhập bằng email <strong>" + escapeHtml(invitation.getEmail()) + "</strong> để nhận lời mời. Nếu chưa có tài khoản, hãy đăng ký Signify bằng email này.</p>" +
                "<a href=\"" + inviteUrl + "\" style=\"display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;\">Nhận lời mời</a>" +
                "<p style=\"margin-top: 20px; color: #666; font-size: 14px;\">Lời mời có hiệu lực trong " + INVITATION_EXPIRES_DAYS + " ngày. Nếu nút không hoạt động, hãy sao chép liên kết này vào trình duyệt:<br/>" + inviteUrl + "</p>" +
                "</div>";

        emailService.sendHtmlEmail(invitation.getEmail(), "Lời mời tham gia " + organization.getName() + " trên Signify", emailContent);
    }

    private void markInvitationAccepted(BusinessInvitation invitation, LocalDateTime acceptedAt) {
        invitation.setStatus(INVITATION_ACCEPTED);
        invitation.setAcceptedAt(acceptedAt);
        invitation.setUpdatedAt(acceptedAt);
        invitationRepository.save(invitation);
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private String generateInvitationToken() {
        return UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", "");
    }

    private String normalizeStatus(String status) {
        String normalized = status == null ? "" : status.trim().toUpperCase();
        if (!STATUS_ACTIVE.equals(normalized) && !STATUS_INACTIVE.equals(normalized)) {
            throw new RuntimeException("Trạng thái thành viên không hợp lệ.");
        }
        return normalized;
    }

    private int resolveMaxAccounts(ServicePackage servicePackage) {
        return servicePackage != null && servicePackage.getMaxAccounts() != null
                ? servicePackage.getMaxAccounts()
                : DEFAULT_MAX_ACCOUNTS;
    }

    private String resolveOrganizationName(String organizationName) {
        String name = organizationName == null ? "" : organizationName.trim();
        return name.isEmpty() ? "Business Organization" : name;
    }

    private String escapeHtml(String value) {
        if (value == null) return "";
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private record BusinessContext(
            BusinessOrganization organization,
            BusinessMembership membership,
            Subscription subscription,
            ServicePackage servicePackage
    ) {}

    public static boolean isBusinessNotFound(RuntimeException e) {
        return BUSINESS_NOT_FOUND.equals(e.getMessage());
    }

    public static boolean isBusinessForbidden(RuntimeException e) {
        return BUSINESS_FORBIDDEN.equals(e.getMessage());
    }
}
