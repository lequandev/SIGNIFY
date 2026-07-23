package com.signify.modules.entitlement.service;

import com.signify.modules.entitlement.dto.AiUsageSummaryResponse;
import com.signify.modules.entitlement.dto.AiVideoAuthorizationRequest;
import com.signify.modules.entitlement.dto.AiVideoAuthorizationResponse;
import com.signify.modules.entitlement.dto.SchoolDailyAiLimitRequest;
import com.signify.modules.entitlement.exception.AiUsageException;
import com.signify.modules.entitlement.model.AiVideoProcessing;
import com.signify.modules.entitlement.model.SchoolAiUsage;
import com.signify.modules.entitlement.model.SchoolMemberDailyAiUsage;
import com.signify.modules.entitlement.model.SchoolVideoEntitlement;
import com.signify.modules.entitlement.repository.AiVideoProcessingRepository;
import com.signify.modules.entitlement.repository.SchoolAiUsageRepository;
import com.signify.modules.entitlement.repository.SchoolMemberDailyAiUsageRepository;
import com.signify.modules.entitlement.repository.SchoolVideoEntitlementRepository;
import com.signify.modules.school.service.SchoolService;
import com.signify.modules.user.model.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class SchoolAiUsageService {

    public static final String SCHOOL_MONTHLY_SCOPE = "SCHOOL_MONTHLY";
    public static final String PERSONAL_SCOPE = "PERSONAL";
    public static final String MONTHLY_LIMIT_REACHED = "SCHOOL_AI_MONTHLY_LIMIT_REACHED";
    public static final String DAILY_LIMIT_REACHED = "SCHOOL_AI_DAILY_LIMIT_REACHED";
    public static final String AUTHORIZATION_REQUIRED = "AI_USAGE_AUTHORIZATION_REQUIRED";
    public static final String VIDEO_NOT_ACTIVATED = "SCHOOL_VIDEO_NOT_ACTIVATED";
    public static final String VIDEO_PROCESSING_IN_PROGRESS = "AI_VIDEO_PROCESSING_IN_PROGRESS";
    public static final String TOP_UP_NOT_AVAILABLE = "AI_USAGE_TOP_UP_NOT_AVAILABLE";
    private static final String PROCESSING_VERSION = "v1";
    private static final String FIXED_DEMO_PROCESSING_VERSION = "fixed-demo-v1";
    private static final Set<String> FIXED_DEMO_VIDEO_IDS = Set.of(
            "9yGEEb0CRl4",
            "J7b0jxVB1TE",
            "VG8apSF2018");
    private static final String STATUS_PROCESSING = "PROCESSING";
    private static final String STATUS_COMPLETED = "COMPLETED";
    private static final String STATUS_FAILED = "FAILED";
    private static final String ENTITLEMENT_PENDING = "PENDING";
    private static final String ENTITLEMENT_ACTIVE = "ACTIVE";
    private static final int DEFAULT_MONTHLY_AI_MINUTES = 10000;
    private static final long PROCESSING_TIMEOUT_MINUTES = 30;
    private static final ZoneId AI_USAGE_ZONE = ZoneId.of("Asia/Bangkok");

    private final SchoolAiUsageRepository usageRepository;
    private final SchoolMemberDailyAiUsageRepository memberDailyUsageRepository;
    private final AiVideoProcessingRepository processingRepository;
    private final SchoolVideoEntitlementRepository videoEntitlementRepository;
    private final SchoolService schoolService;

    public synchronized AiVideoAuthorizationResponse authorizeVideo(
            String userId, AiVideoAuthorizationRequest request) {
        SchoolService.SchoolContext context = schoolService.resolveSchoolContext(userId).orElse(null);
        if (context == null) {
            return AiVideoAuthorizationResponse.builder()
                    .allowed(true)
                    .scope(PERSONAL_SCOPE)
                    .chargeSeconds(0)
                    .build();
        }

        String videoId = normalizeVideoId(request.getVideoId());
        long durationSeconds = requireDuration(request.getDurationSeconds());
        if (FIXED_DEMO_VIDEO_IDS.contains(videoId)) {
            return authorizeFixedDemoVideo(context, userId, request, videoId, durationSeconds);
        }

        String processingKey = PROCESSING_VERSION + ":" + videoId;
        LocalDateTime now = LocalDateTime.now();
        AiVideoProcessing existing = processingRepository.findByProcessingKey(processingKey).orElse(null);
        SchoolVideoEntitlement schoolEntitlement = videoEntitlementRepository
                .findBySchoolIdAndProcessingKey(context.school().getId(), processingKey)
                .orElse(null);

        if (existing != null && STATUS_COMPLETED.equals(existing.getStatus())
                && isActive(schoolEntitlement)) {
            return authorizationResponse(context, existing, true, false, 0);
        }

        requireVideoActivationRole(context);

        if (existing != null && STATUS_COMPLETED.equals(existing.getStatus())) {
            long chargedSeconds = requireDuration(existing.getDurationSeconds());
            activateCachedVideoForSchool(context, userId, existing, chargedSeconds, schoolEntitlement);
            return authorizationResponse(context, existing, true, false, chargedSeconds);
        }
        if (existing != null && STATUS_PROCESSING.equals(existing.getStatus())) {
            if (existing.getExpiresAt() != null && existing.getExpiresAt().isBefore(now)) {
                failProcessingInternal(existing, now);
            } else {
                if (!context.school().getId().equals(existing.getChargedSchoolId())) {
                    throw new AiUsageException(VIDEO_PROCESSING_IN_PROGRESS,
                            "Video đang được một trường khác xử lý. Vui lòng thử lại sau ít phút.", null);
                }
                return authorizationResponse(context, existing, false,
                        userId.equals(existing.getRequestedBy()), 0);
            }
        }

        SchoolMemberDailyAiUsage memberDailyUsage = reserveMemberDaily(context, userId, durationSeconds);
        SchoolAiUsage usage;
        try {
            usage = reserve(context, durationSeconds);
        } catch (RuntimeException exception) {
            releaseMemberDailyReservation(memberDailyUsage == null ? null : memberDailyUsage.getId(), durationSeconds);
            throw exception;
        }
        AiVideoProcessing processing;
        if (existing != null && STATUS_FAILED.equals(existing.getStatus())) {
            processing = existing;
            applyProcessingReservation(processing, context, usage, memberDailyUsage,
                    userId, request, videoId, durationSeconds, now);
        } else {
            processing = AiVideoProcessing.builder()
                    .processingKey(processingKey)
                    .videoId(videoId)
                    .processingVersion(PROCESSING_VERSION)
                    .build();
            applyProcessingReservation(processing, context, usage, memberDailyUsage,
                    userId, request, videoId, durationSeconds, now);
        }

        try {
            processing = processingRepository.save(processing);
        } catch (DuplicateKeyException exception) {
            releaseReservation(usage.getId(), durationSeconds);
            releaseMemberDailyReservation(
                    memberDailyUsage == null ? null : memberDailyUsage.getId(), durationSeconds);
            AiVideoProcessing concurrent = processingRepository.findByProcessingKey(processingKey)
                    .orElseThrow(() -> exception);
            if (STATUS_COMPLETED.equals(concurrent.getStatus())) {
                long chargedSeconds = requireDuration(concurrent.getDurationSeconds());
                activateCachedVideoForSchool(context, userId, concurrent, chargedSeconds, null);
                return authorizationResponse(context, concurrent, true, false, chargedSeconds);
            }
            if (!context.school().getId().equals(concurrent.getChargedSchoolId())) {
                throw new AiUsageException(VIDEO_PROCESSING_IN_PROGRESS,
                        "Video đang được một trường khác xử lý. Vui lòng thử lại sau ít phút.", null);
            }
            return authorizationResponse(context, concurrent, false, false, 0);
        }
        return authorizationResponse(context, processing, false, true, durationSeconds);
    }

    private AiVideoAuthorizationResponse authorizeFixedDemoVideo(
            SchoolService.SchoolContext context,
            String userId,
            AiVideoAuthorizationRequest request,
            String videoId,
            long durationSeconds) {
        String processingKey = FIXED_DEMO_PROCESSING_VERSION + ":" + videoId;
        AiVideoProcessing processing = processingRepository.findByProcessingKey(processingKey).orElse(null);
        SchoolVideoEntitlement schoolEntitlement = videoEntitlementRepository
                .findBySchoolIdAndProcessingKey(context.school().getId(), processingKey)
                .orElse(null);

        if (processing != null && STATUS_COMPLETED.equals(processing.getStatus())
                && isActive(schoolEntitlement)) {
            return authorizationResponse(context, processing, true, false, 0);
        }

        if (processing == null) {
            LocalDateTime now = LocalDateTime.now();
            processing = AiVideoProcessing.builder()
                    .processingKey(processingKey)
                    .videoId(videoId)
                    .processingVersion(FIXED_DEMO_PROCESSING_VERSION)
                    .videoTitle(trimToNull(request.getVideoTitle()))
                    .videoUrl(trimToNull(request.getVideoUrl()))
                    .channelName(trimToNull(request.getChannelName()))
                    .durationSeconds(durationSeconds)
                    .requestedBy(userId)
                    .reservedSeconds(0L)
                    .status(STATUS_COMPLETED)
                    .usageCommitted(true)
                    .memberDailyUsageCommitted(true)
                    .completedAt(now)
                    .createdAt(now)
                    .updatedAt(now)
                    .build();
            try {
                processing = processingRepository.save(processing);
            } catch (DuplicateKeyException exception) {
                processing = processingRepository.findByProcessingKey(processingKey)
                        .orElseThrow(() -> exception);
            }
        }

        if (!STATUS_COMPLETED.equals(processing.getStatus())) {
            throw new AiUsageException(VIDEO_PROCESSING_IN_PROGRESS,
                    "Video demo đang được chuẩn bị. Vui lòng thử lại sau ít phút.", null);
        }

        long chargedSeconds = requireDuration(processing.getDurationSeconds());
        activateCachedVideoForSchool(
                context, userId, processing, chargedSeconds, schoolEntitlement);
        return authorizationResponse(context, processing, true, false, chargedSeconds);
    }

    public synchronized AiUsageSummaryResponse completeProcessing(String userId, String processingId) {
        AiVideoProcessing processing = requireOwnedProcessing(userId, processingId);
        if (STATUS_COMPLETED.equals(processing.getStatus())) {
            ensureEntitlementForCompletedProcessing(processing);
            return currentSummaryForMember(userId);
        }
        if (!STATUS_PROCESSING.equals(processing.getStatus())) {
            throw new AiUsageException(AUTHORIZATION_REQUIRED,
                    "Phiên xử lý AI không còn hoạt động.", null);
        }

        if (!Boolean.TRUE.equals(processing.getUsageCommitted())) {
            commitReservation(processing.getUsageId(), safe(processing.getReservedSeconds()));
            processing.setUsageCommitted(true);
            processing.setUpdatedAt(LocalDateTime.now());
            processingRepository.save(processing);
        }
        if (processing.getMemberDailyUsageId() != null
                && !Boolean.TRUE.equals(processing.getMemberDailyUsageCommitted())) {
            commitMemberDailyReservation(
                    processing.getMemberDailyUsageId(), safe(processing.getReservedSeconds()));
            processing.setMemberDailyUsageCommitted(true);
            processing.setUpdatedAt(LocalDateTime.now());
            processingRepository.save(processing);
        }

        LocalDateTime now = LocalDateTime.now();
        processing.setStatus(STATUS_COMPLETED);
        processing.setCompletedAt(now);
        processing.setExpiresAt(null);
        processing.setUpdatedAt(now);
        processingRepository.save(processing);
        ensureEntitlementForCompletedProcessing(processing);
        return currentSummaryForMember(userId);
    }

    public synchronized AiUsageSummaryResponse failProcessing(String userId, String processingId) {
        AiVideoProcessing processing = requireOwnedProcessing(userId, processingId);
        if (STATUS_PROCESSING.equals(processing.getStatus())) {
            failProcessingInternal(processing, LocalDateTime.now());
        }
        return currentSummaryForMember(userId);
    }

    public boolean validateSchoolProcessing(String userId, String videoId, String processingId) {
        SchoolService.SchoolContext context = schoolService.resolveSchoolContext(userId).orElse(null);
        if (context == null) return false;
        if (processingId == null || processingId.isBlank()) {
            throw new AiUsageException(AUTHORIZATION_REQUIRED,
                    "Video mới cần được kiểm tra AI Usage trước khi xử lý.", null);
        }
        AiVideoProcessing processing = processingRepository.findById(processingId)
                .orElseThrow(() -> new AiUsageException(AUTHORIZATION_REQUIRED,
                        "Không tìm thấy phiên xử lý AI của video.", null));
        if (!normalizeVideoId(videoId).equals(processing.getVideoId())
                || (!STATUS_PROCESSING.equals(processing.getStatus())
                && !STATUS_COMPLETED.equals(processing.getStatus()))) {
            throw new AiUsageException(AUTHORIZATION_REQUIRED,
                    "Phiên xử lý AI không hợp lệ cho video này.", null);
        }
        if (STATUS_PROCESSING.equals(processing.getStatus())
                && processing.getExpiresAt() != null
                && processing.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new AiUsageException(AUTHORIZATION_REQUIRED,
                    "Phiên xử lý AI đã hết hạn.", null);
        }
        if (STATUS_PROCESSING.equals(processing.getStatus())) {
            if (Role.STUDENT.equals(context.membership().getRole())
                    || !context.school().getId().equals(processing.getChargedSchoolId())) {
                throw new AiUsageException(VIDEO_NOT_ACTIVATED,
                        "Video này chưa được nhà trường cấp phép sử dụng. Vui lòng liên hệ giáo viên hoặc quản trị trường.",
                        null);
            }
        } else {
            SchoolVideoEntitlement entitlement = videoEntitlementRepository
                    .findBySchoolIdAndProcessingKey(
                            context.school().getId(), processing.getProcessingKey())
                    .orElse(null);
            if (!isActive(entitlement)) {
                throw new AiUsageException(VIDEO_NOT_ACTIVATED,
                        "Video này chưa được nhà trường cấp phép sử dụng. Vui lòng liên hệ giáo viên hoặc quản trị trường.",
                        null);
            }
        }
        return true;
    }

    public AiUsageSummaryResponse getDashboard(String adminUserId) {
        SchoolService.SchoolContext context = schoolService.resolveManagedSchoolContext(adminUserId);
        return buildSummary(getOrCreateUsage(context), context, true);
    }

    public AiUsageSummaryResponse requireTopUpEligibility(String adminUserId) {
        SchoolService.SchoolContext context = schoolService.resolveManagedSchoolContext(adminUserId);
        SchoolAiUsage usage = getOrCreateUsage(context);
        AiUsageSummaryResponse summary = buildSummary(usage, context, false);
        if (summary.getRemainingSeconds() > 0) {
            throw new AiUsageException(TOP_UP_NOT_AVAILABLE,
                    "Chỉ có thể mua thêm phút AI khi tổ chức đã dùng hết quota của chu kỳ hiện tại.",
                    summary);
        }
        return summary;
    }

    public synchronized AiUsageSummaryResponse applyPurchasedTopUp(
            String adminUserId, long orderCode, int minutes) {
        if (orderCode <= 0 || minutes <= 0) {
            throw new IllegalArgumentException("Thông tin gói mua thêm không hợp lệ.");
        }
        SchoolService.SchoolContext context = schoolService.resolveManagedSchoolContext(adminUserId);
        if (usageRepository.existsByAppliedTopUpOrderCodesContaining(orderCode)) {
            return buildSummary(getOrCreateUsage(context), context, false);
        }
        for (int attempt = 0; attempt < 5; attempt++) {
            SchoolAiUsage usage = getOrCreateUsage(context);
            List<Long> appliedOrderCodes = usage.getAppliedTopUpOrderCodes() == null
                    ? new ArrayList<>()
                    : new ArrayList<>(usage.getAppliedTopUpOrderCodes());
            if (appliedOrderCodes.contains(orderCode)) {
                return buildSummary(usage, context, false);
            }

            appliedOrderCodes.add(orderCode);
            usage.setAppliedTopUpOrderCodes(appliedOrderCodes);
            usage.setAdditionalSeconds(safe(usage.getAdditionalSeconds()) + (long) minutes * 60);
            usage.setUpdatedAt(LocalDateTime.now());
            try {
                return buildSummary(usageRepository.save(usage), context, false);
            } catch (OptimisticLockingFailureException ignored) {
                // Reload before retrying so one paid order can only be applied once.
            } catch (DuplicateKeyException exception) {
                if (usageRepository.existsByAppliedTopUpOrderCodesContaining(orderCode)) {
                    return buildSummary(getOrCreateUsage(context), context, false);
                }
                throw exception;
            }
        }
        throw new IllegalStateException("Không thể cộng phút AI mua thêm; vui lòng thử lại.");
    }

    public AiUsageSummaryResponse updateDailyLimits(
            String adminUserId, SchoolDailyAiLimitRequest request) {
        SchoolService.SchoolContext context = schoolService.updateDailyAiLimits(
                adminUserId,
                request.getTeacherDailyAiMinutes(),
                request.getStudentDailyAiMinutes());
        return buildSummary(getOrCreateUsage(context), context, true);
    }

    public AiUsageSummaryResponse currentSummaryForMember(String userId) {
        SchoolService.SchoolContext context = schoolService.resolveSchoolContext(userId)
                .orElseThrow(() -> new AiUsageException("SCHOOL_NOT_FOUND",
                        "Tài khoản chưa thuộc trường học đang hoạt động.", null));
        return buildSummary(getOrCreateUsage(context), context, false);
    }

    public AiUsageSummaryResponse.MemberDailyUsage currentDailyUsageForMember(String userId) {
        SchoolService.SchoolContext context = schoolService.resolveSchoolContext(userId)
                .orElseThrow(() -> new AiUsageException("SCHOOL_NOT_FOUND",
                        "Tài khoản chưa thuộc tổ chức đang hoạt động.", null));
        String role = context.membership().getRole();
        if (!Role.TEACHER.equals(role) && !Role.STUDENT.equals(role)) {
            throw new IllegalArgumentException("Quota theo ngày chỉ áp dụng cho giáo viên và học sinh.");
        }

        long limit = (long) resolveDailyLimitMinutes(context, role) * 60;
        SchoolMemberDailyAiUsage record = memberDailyUsageRepository
                .findBySchoolIdAndUserIdAndUsageDate(
                        context.school().getId(), userId, LocalDate.now(AI_USAGE_ZONE))
                .orElse(null);
        long used = record == null ? 0 : safe(record.getUsedSeconds());
        long reserved = record == null ? 0 : safe(record.getReservedSeconds());

        return AiUsageSummaryResponse.MemberDailyUsage.builder()
                .userId(userId)
                .role(role)
                .limitSeconds(limit)
                .usedSeconds(used)
                .reservedSeconds(reserved)
                .remainingSeconds(limit == 0 ? 0 : Math.max(0, limit - used - reserved))
                .processedVideoCount(record == null ? 0 : safe(record.getProcessedVideoCount()))
                .build();
    }

    public LocalDateTime nextDailyQuotaResetAt() {
        return LocalDate.now(AI_USAGE_ZONE).plusDays(1).atStartOfDay();
    }

    public boolean hasRemainingSchoolQuota(String userId) {
        SchoolService.SchoolContext context = schoolService.resolveSchoolContext(userId).orElse(null);
        if (context == null) return true;
        SchoolAiUsage usage = getOrCreateUsage(context);
        return totalLimit(usage) > safe(usage.getUsedSeconds()) + safe(usage.getReservedSeconds());
    }

    @Scheduled(fixedDelay = 60000)
    public synchronized void releaseExpiredReservations() {
        LocalDateTime now = LocalDateTime.now();
        processingRepository.findByStatusAndExpiresAtBefore(STATUS_PROCESSING, now)
                .forEach(processing -> failProcessingInternal(processing, now));
    }

    private void requireVideoActivationRole(SchoolService.SchoolContext context) {
        String role = context.membership().getRole();
        if (Role.TEACHER.equals(role) || Role.SCHOOL_ADMIN.equals(role)) return;
        throw new AiUsageException(VIDEO_NOT_ACTIVATED,
                "Video này chưa được nhà trường cấp phép sử dụng. Vui lòng liên hệ giáo viên hoặc quản trị trường.",
                null);
    }

    private boolean isActive(SchoolVideoEntitlement entitlement) {
        return entitlement != null && ENTITLEMENT_ACTIVE.equals(entitlement.getStatus());
    }

    private SchoolVideoEntitlement activateCachedVideoForSchool(
            SchoolService.SchoolContext context,
            String userId,
            AiVideoProcessing processing,
            long durationSeconds,
            SchoolVideoEntitlement entitlement) {
        if (isActive(entitlement)) return entitlement;

        if (entitlement == null) {
            SchoolMemberDailyAiUsage memberDailyUsage = reserveMemberDaily(context, userId, durationSeconds);
            SchoolAiUsage usage;
            try {
                usage = reserve(context, durationSeconds);
            } catch (RuntimeException exception) {
                releaseMemberDailyReservation(
                        memberDailyUsage == null ? null : memberDailyUsage.getId(), durationSeconds);
                throw exception;
            }

            LocalDateTime now = LocalDateTime.now();
            SchoolVideoEntitlement pending = SchoolVideoEntitlement.builder()
                    .schoolId(context.school().getId())
                    .videoId(processing.getVideoId())
                    .processingKey(processing.getProcessingKey())
                    .processingId(processing.getId())
                    .videoTitle(processing.getVideoTitle())
                    .videoUrl(processing.getVideoUrl())
                    .channelName(processing.getChannelName())
                    .durationSeconds(durationSeconds)
                    .activatedBy(userId)
                    .usageId(usage.getId())
                    .memberDailyUsageId(memberDailyUsage == null ? null : memberDailyUsage.getId())
                    .chargedSeconds(durationSeconds)
                    .status(ENTITLEMENT_PENDING)
                    .usageCommitted(false)
                    .memberDailyUsageCommitted(memberDailyUsage == null)
                    .createdAt(now)
                    .updatedAt(now)
                    .build();
            try {
                entitlement = videoEntitlementRepository.save(pending);
            } catch (DuplicateKeyException exception) {
                releaseReservation(usage.getId(), durationSeconds);
                releaseMemberDailyReservation(
                        memberDailyUsage == null ? null : memberDailyUsage.getId(), durationSeconds);
                entitlement = videoEntitlementRepository
                        .findBySchoolIdAndProcessingKey(
                                context.school().getId(), processing.getProcessingKey())
                        .orElseThrow(() -> exception);
            } catch (RuntimeException exception) {
                releaseReservation(usage.getId(), durationSeconds);
                releaseMemberDailyReservation(
                        memberDailyUsage == null ? null : memberDailyUsage.getId(), durationSeconds);
                throw exception;
            }
        }

        return finalizeVideoEntitlement(entitlement);
    }

    private SchoolVideoEntitlement finalizeVideoEntitlement(SchoolVideoEntitlement entitlement) {
        long chargedSeconds = safe(entitlement.getChargedSeconds());
        if (!Boolean.TRUE.equals(entitlement.getUsageCommitted())) {
            commitReservation(entitlement.getUsageId(), chargedSeconds);
            entitlement.setUsageCommitted(true);
            entitlement.setUpdatedAt(LocalDateTime.now());
            entitlement = videoEntitlementRepository.save(entitlement);
        }
        if (entitlement.getMemberDailyUsageId() != null
                && !Boolean.TRUE.equals(entitlement.getMemberDailyUsageCommitted())) {
            commitMemberDailyReservation(entitlement.getMemberDailyUsageId(), chargedSeconds);
            entitlement.setMemberDailyUsageCommitted(true);
            entitlement.setUpdatedAt(LocalDateTime.now());
            entitlement = videoEntitlementRepository.save(entitlement);
        }
        entitlement.setStatus(ENTITLEMENT_ACTIVE);
        if (entitlement.getActivatedAt() == null) entitlement.setActivatedAt(LocalDateTime.now());
        entitlement.setUpdatedAt(LocalDateTime.now());
        return videoEntitlementRepository.save(entitlement);
    }

    private void ensureEntitlementForCompletedProcessing(AiVideoProcessing processing) {
        if (processing.getChargedSchoolId() == null || processing.getProcessingKey() == null) return;
        SchoolVideoEntitlement existing = videoEntitlementRepository
                .findBySchoolIdAndProcessingKey(
                        processing.getChargedSchoolId(), processing.getProcessingKey())
                .orElse(null);
        if (isActive(existing)) return;
        if (existing != null) {
            finalizeVideoEntitlement(existing);
            return;
        }

        LocalDateTime activatedAt = processing.getCompletedAt() != null
                ? processing.getCompletedAt() : LocalDateTime.now();
        SchoolVideoEntitlement entitlement = SchoolVideoEntitlement.builder()
                .schoolId(processing.getChargedSchoolId())
                .videoId(processing.getVideoId())
                .processingKey(processing.getProcessingKey())
                .processingId(processing.getId())
                .videoTitle(processing.getVideoTitle())
                .videoUrl(processing.getVideoUrl())
                .channelName(processing.getChannelName())
                .durationSeconds(processing.getDurationSeconds())
                .activatedBy(processing.getRequestedBy())
                .usageId(processing.getUsageId())
                .memberDailyUsageId(processing.getMemberDailyUsageId())
                .chargedSeconds(processing.getReservedSeconds())
                .status(ENTITLEMENT_ACTIVE)
                .usageCommitted(Boolean.TRUE.equals(processing.getUsageCommitted()))
                .memberDailyUsageCommitted(processing.getMemberDailyUsageId() == null
                        || Boolean.TRUE.equals(processing.getMemberDailyUsageCommitted()))
                .activatedAt(activatedAt)
                .createdAt(activatedAt)
                .updatedAt(activatedAt)
                .build();
        try {
            videoEntitlementRepository.save(entitlement);
        } catch (DuplicateKeyException ignored) {
            // A concurrent completion created the same school entitlement first.
        }
    }

    private SchoolAiUsage reserve(SchoolService.SchoolContext context, long seconds) {
        for (int attempt = 0; attempt < 5; attempt++) {
            SchoolAiUsage usage = getOrCreateUsage(context);
            long consumed = safe(usage.getUsedSeconds()) + safe(usage.getReservedSeconds());
            if (consumed + seconds > totalLimit(usage)) {
                throw new AiUsageException(MONTHLY_LIMIT_REACHED,
                        "Tổ chức đã dùng hết AI Usage tháng này. Hãy mua thêm phút AI hoặc chờ quota được cấp lại.",
                        buildSummary(usage, context, false));
            }
            usage.setReservedSeconds(safe(usage.getReservedSeconds()) + seconds);
            usage.setUpdatedAt(LocalDateTime.now());
            try {
                return usageRepository.save(usage);
            } catch (OptimisticLockingFailureException ignored) {
                // Reload the latest totals before retrying the quota check.
            }
        }
        throw new IllegalStateException("AI usage changed too frequently; please retry");
    }

    private void releaseReservation(String usageId, long seconds) {
        if (usageId == null || seconds <= 0) return;
        for (int attempt = 0; attempt < 5; attempt++) {
            SchoolAiUsage usage = usageRepository.findById(usageId).orElse(null);
            if (usage == null) return;
            usage.setReservedSeconds(Math.max(0, safe(usage.getReservedSeconds()) - seconds));
            usage.setUpdatedAt(LocalDateTime.now());
            try {
                usageRepository.save(usage);
                return;
            } catch (OptimisticLockingFailureException ignored) {
                // Retry against the latest version.
            }
        }
        throw new IllegalStateException("Could not release AI usage reservation");
    }

    private SchoolMemberDailyAiUsage reserveMemberDaily(
            SchoolService.SchoolContext context, String userId, long seconds) {
        String role = context.membership().getRole();
        if (!Role.TEACHER.equals(role) && !Role.STUDENT.equals(role)) return null;

        LocalDate today = LocalDate.now(AI_USAGE_ZONE);
        long limitSeconds = (long) resolveDailyLimitMinutes(context, role) * 60;
        for (int attempt = 0; attempt < 5; attempt++) {
            SchoolMemberDailyAiUsage daily = memberDailyUsageRepository
                    .findBySchoolIdAndUserIdAndUsageDate(context.school().getId(), userId, today)
                    .orElse(null);
            if (daily == null) {
                LocalDateTime now = LocalDateTime.now(AI_USAGE_ZONE);
                daily = SchoolMemberDailyAiUsage.builder()
                        .schoolId(context.school().getId())
                        .userId(userId)
                        .role(role)
                        .usageDate(today)
                        .limitSeconds(limitSeconds)
                        .usedSeconds(0L)
                        .reservedSeconds(0L)
                        .processedVideoCount(0L)
                        .createdAt(now)
                        .updatedAt(now)
                        .build();
                try {
                    daily = memberDailyUsageRepository.save(daily);
                } catch (DuplicateKeyException ignored) {
                    continue;
                }
            }

            long consumed = safe(daily.getUsedSeconds()) + safe(daily.getReservedSeconds());
            if (limitSeconds > 0 && consumed + seconds > limitSeconds) {
                String roleName = Role.TEACHER.equals(role) ? "giáo viên" : "học sinh";
                throw new AiUsageException(DAILY_LIMIT_REACHED,
                        "Bạn đã đạt giới hạn AI Usage mỗi ngày dành cho " + roleName
                                + ". Video mới có thể xử lý sau 00:00 hoặc khi nhà trường tăng quota.",
                        buildSummary(getOrCreateUsage(context), context, false));
            }
            daily.setRole(role);
            daily.setLimitSeconds(limitSeconds);
            daily.setReservedSeconds(safe(daily.getReservedSeconds()) + seconds);
            daily.setUpdatedAt(LocalDateTime.now(AI_USAGE_ZONE));
            try {
                return memberDailyUsageRepository.save(daily);
            } catch (OptimisticLockingFailureException ignored) {
                // Reload the latest member totals before retrying.
            }
        }
        throw new IllegalStateException("Daily AI usage changed too frequently; please retry");
    }

    private void releaseMemberDailyReservation(String dailyUsageId, long seconds) {
        if (dailyUsageId == null || seconds <= 0) return;
        for (int attempt = 0; attempt < 5; attempt++) {
            SchoolMemberDailyAiUsage daily = memberDailyUsageRepository.findById(dailyUsageId).orElse(null);
            if (daily == null) return;
            daily.setReservedSeconds(Math.max(0, safe(daily.getReservedSeconds()) - seconds));
            daily.setUpdatedAt(LocalDateTime.now(AI_USAGE_ZONE));
            try {
                memberDailyUsageRepository.save(daily);
                return;
            } catch (OptimisticLockingFailureException ignored) {
                // Retry against the latest version.
            }
        }
        throw new IllegalStateException("Could not release daily AI usage reservation");
    }

    private void commitMemberDailyReservation(String dailyUsageId, long seconds) {
        if (dailyUsageId == null || seconds <= 0) return;
        for (int attempt = 0; attempt < 5; attempt++) {
            SchoolMemberDailyAiUsage daily = memberDailyUsageRepository.findById(dailyUsageId)
                    .orElseThrow(() -> new IllegalStateException("Daily AI usage not found"));
            daily.setReservedSeconds(Math.max(0, safe(daily.getReservedSeconds()) - seconds));
            daily.setUsedSeconds(safe(daily.getUsedSeconds()) + seconds);
            daily.setProcessedVideoCount(safe(daily.getProcessedVideoCount()) + 1);
            daily.setUpdatedAt(LocalDateTime.now(AI_USAGE_ZONE));
            try {
                memberDailyUsageRepository.save(daily);
                return;
            } catch (OptimisticLockingFailureException ignored) {
                // Retry against the latest version.
            }
        }
        throw new IllegalStateException("Could not commit daily AI usage reservation");
    }

    private void commitReservation(String usageId, long seconds) {
        if (usageId == null || seconds <= 0) return;
        for (int attempt = 0; attempt < 5; attempt++) {
            SchoolAiUsage usage = usageRepository.findById(usageId)
                    .orElseThrow(() -> new IllegalStateException("AI usage period not found"));
            usage.setReservedSeconds(Math.max(0, safe(usage.getReservedSeconds()) - seconds));
            usage.setUsedSeconds(safe(usage.getUsedSeconds()) + seconds);
            usage.setProcessedVideoCount(safe(usage.getProcessedVideoCount()) + 1);
            usage.setUpdatedAt(LocalDateTime.now());
            try {
                usageRepository.save(usage);
                return;
            } catch (OptimisticLockingFailureException ignored) {
                // Retry against the latest version.
            }
        }
        throw new IllegalStateException("Could not commit AI usage reservation");
    }

    private SchoolAiUsage getOrCreateUsage(SchoolService.SchoolContext context) {
        Period period = resolvePeriod(context);
        SchoolAiUsage usage = usageRepository
                .findBySchoolIdAndPeriodStart(context.school().getId(), period.start())
                .orElse(null);
        long packageLimit = resolveMonthlyLimitSeconds(context);
        if (usage != null) {
            if (packageLimit != safe(usage.getLimitSeconds())) {
                usage.setLimitSeconds(packageLimit);
                usage.setPackageId(context.servicePackage().getId());
                usage.setUpdatedAt(LocalDateTime.now());
                usage = usageRepository.save(usage);
            }
            return usage;
        }

        LocalDateTime now = LocalDateTime.now();
        SchoolAiUsage created = SchoolAiUsage.builder()
                .schoolId(context.school().getId())
                .subscriptionId(context.subscription().getId())
                .packageId(context.servicePackage().getId())
                .periodStart(period.start())
                .periodEnd(period.end())
                .limitSeconds(packageLimit)
                .additionalSeconds(0L)
                .usedSeconds(0L)
                .reservedSeconds(0L)
                .processedVideoCount(0L)
                .createdAt(now)
                .updatedAt(now)
                .build();
        try {
            return usageRepository.save(created);
        } catch (DuplicateKeyException exception) {
            return usageRepository.findBySchoolIdAndPeriodStart(context.school().getId(), period.start())
                    .orElseThrow(() -> exception);
        }
    }

    private AiVideoProcessing requireOwnedProcessing(String userId, String processingId) {
        AiVideoProcessing processing = processingRepository.findById(processingId)
                .orElseThrow(() -> new AiUsageException(AUTHORIZATION_REQUIRED,
                        "Không tìm thấy phiên xử lý AI.", null));
        if (!userId.equals(processing.getRequestedBy())) {
            throw new AiUsageException("SCHOOL_FORBIDDEN",
                    "Bạn không có quyền cập nhật phiên xử lý AI này.", null);
        }
        return processing;
    }

    private void failProcessingInternal(AiVideoProcessing processing, LocalDateTime now) {
        if (!STATUS_PROCESSING.equals(processing.getStatus())) return;
        releaseReservation(processing.getUsageId(), safe(processing.getReservedSeconds()));
        releaseMemberDailyReservation(
                processing.getMemberDailyUsageId(), safe(processing.getReservedSeconds()));
        processing.setStatus(STATUS_FAILED);
        processing.setFailedAt(now);
        processing.setExpiresAt(null);
        processing.setUpdatedAt(now);
        processingRepository.save(processing);
    }

    private void applyProcessingReservation(
            AiVideoProcessing processing,
            SchoolService.SchoolContext context,
            SchoolAiUsage usage,
            SchoolMemberDailyAiUsage memberDailyUsage,
            String userId,
            AiVideoAuthorizationRequest request,
            String videoId,
            long durationSeconds,
            LocalDateTime now) {
        processing.setVideoId(videoId);
        processing.setProcessingVersion(PROCESSING_VERSION);
        processing.setVideoTitle(trimToNull(request.getVideoTitle()));
        processing.setVideoUrl(trimToNull(request.getVideoUrl()));
        processing.setChannelName(trimToNull(request.getChannelName()));
        processing.setDurationSeconds(durationSeconds);
        processing.setChargedSchoolId(context.school().getId());
        processing.setRequestedBy(userId);
        processing.setUsageId(usage.getId());
        processing.setMemberDailyUsageId(memberDailyUsage == null ? null : memberDailyUsage.getId());
        processing.setReservedSeconds(durationSeconds);
        processing.setStatus(STATUS_PROCESSING);
        processing.setUsageCommitted(false);
        processing.setMemberDailyUsageCommitted(false);
        processing.setExpiresAt(now.plusMinutes(PROCESSING_TIMEOUT_MINUTES));
        processing.setCompletedAt(null);
        processing.setFailedAt(null);
        processing.setUpdatedAt(now);
        if (processing.getCreatedAt() == null) processing.setCreatedAt(now);
    }

    private AiVideoAuthorizationResponse authorizationResponse(
            SchoolService.SchoolContext context,
            AiVideoProcessing processing,
            boolean cached,
            boolean ownsProcessing,
            long chargeSeconds) {
        return AiVideoAuthorizationResponse.builder()
                .allowed(true)
                .scope(SCHOOL_MONTHLY_SCOPE)
                .processingId(processing.getId())
                .cached(cached)
                .ownsProcessing(ownsProcessing)
                .chargeSeconds(chargeSeconds)
                .usage(buildSummary(getOrCreateUsage(context), context, false))
                .build();
    }

    private AiUsageSummaryResponse buildSummary(
            SchoolAiUsage usage, SchoolService.SchoolContext context, boolean includeDetails) {
        long limit = totalLimit(usage);
        long used = safe(usage.getUsedSeconds());
        long reserved = safe(usage.getReservedSeconds());
        long remaining = Math.max(0, limit - used - reserved);
        List<AiUsageSummaryResponse.DailyUsagePoint> daily = List.of();
        List<AiUsageSummaryResponse.MemberDailyUsage> todayMemberUsage = List.of();
        List<AiUsageSummaryResponse.RecentVideoUsage> recent = List.of();
        if (includeDetails) {
            List<SchoolVideoEntitlement> records = videoEntitlementRepository
                    .findBySchoolIdAndStatusAndActivatedAtBetweenOrderByActivatedAtDesc(
                            context.school().getId(), ENTITLEMENT_ACTIVE,
                            usage.getPeriodStart(), usage.getPeriodEnd());
            daily = buildDailyUsage(usage, records);
            todayMemberUsage = buildTodayMemberUsage(context);
            recent = records.stream().limit(20).map(record -> AiUsageSummaryResponse.RecentVideoUsage.builder()
                    .processingId(record.getProcessingId())
                    .videoId(record.getVideoId())
                    .videoTitle(record.getVideoTitle())
                    .channelName(record.getChannelName())
                    .requestedBy(record.getActivatedBy())
                    .durationSeconds(safe(record.getDurationSeconds()))
                    .completedAt(record.getActivatedAt())
                    .build()).toList();
        }
        return AiUsageSummaryResponse.builder()
                .schoolId(context.school().getId())
                .packageName(context.servicePackage().getName())
                .periodStart(usage.getPeriodStart())
                .periodEnd(usage.getPeriodEnd())
                .limitSeconds(safe(usage.getLimitSeconds()))
                .additionalSeconds(safe(usage.getAdditionalSeconds()))
                .usedSeconds(used)
                .reservedSeconds(reserved)
                .remainingSeconds(remaining)
                .processedVideoCount(safe(usage.getProcessedVideoCount()))
                .usagePercent(limit == 0 ? 100 : Math.min(100, Math.round((used + reserved) * 1000.0 / limit) / 10.0))
                .teacherDailyLimitMinutes(resolveDailyLimitMinutes(context, Role.TEACHER))
                .studentDailyLimitMinutes(resolveDailyLimitMinutes(context, Role.STUDENT))
                .dailyQuotaResetsAt(LocalDate.now(AI_USAGE_ZONE).plusDays(1).atStartOfDay())
                .dailyUsage(daily)
                .todayMemberUsage(todayMemberUsage)
                .recentVideos(recent)
                .build();
    }

    private List<AiUsageSummaryResponse.MemberDailyUsage> buildTodayMemberUsage(
            SchoolService.SchoolContext context) {
        return memberDailyUsageRepository
                .findBySchoolIdAndUsageDateOrderByUsedSecondsDesc(
                        context.school().getId(), LocalDate.now(AI_USAGE_ZONE))
                .stream()
                .filter(record -> Role.TEACHER.equals(record.getRole()) || Role.STUDENT.equals(record.getRole()))
                .map(record -> {
                    long limit = (long) resolveDailyLimitMinutes(context, record.getRole()) * 60;
                    long used = safe(record.getUsedSeconds());
                    long reserved = safe(record.getReservedSeconds());
                    return AiUsageSummaryResponse.MemberDailyUsage.builder()
                            .userId(record.getUserId())
                            .role(record.getRole())
                            .limitSeconds(limit)
                            .usedSeconds(used)
                            .reservedSeconds(reserved)
                            .remainingSeconds(limit == 0 ? 0 : Math.max(0, limit - used - reserved))
                            .processedVideoCount(safe(record.getProcessedVideoCount()))
                            .build();
                })
                .toList();
    }

    private List<AiUsageSummaryResponse.DailyUsagePoint> buildDailyUsage(
            SchoolAiUsage usage, List<SchoolVideoEntitlement> records) {
        Map<LocalDate, Long> totals = new LinkedHashMap<>();
        LocalDate start = usage.getPeriodStart().toLocalDate();
        LocalDate end = usage.getPeriodEnd().toLocalDate();
        for (LocalDate date = start; !date.isAfter(end); date = date.plusDays(1)) totals.put(date, 0L);
        for (SchoolVideoEntitlement record : records) {
            if (record.getActivatedAt() == null) continue;
            LocalDate date = record.getActivatedAt().toLocalDate();
            totals.computeIfPresent(date, (ignored, total) -> total + safe(record.getDurationSeconds()));
        }
        List<AiUsageSummaryResponse.DailyUsagePoint> result = new ArrayList<>();
        totals.forEach((date, seconds) -> result.add(AiUsageSummaryResponse.DailyUsagePoint.builder()
                .date(date)
                .usedSeconds(seconds)
                .build()));
        return result;
    }

    private Period resolvePeriod(SchoolService.SchoolContext context) {
        LocalDateTime subscriptionStart = context.subscription().getStartDate();
        LocalDateTime subscriptionEnd = context.subscription().getEndDate();
        LocalDateTime now = LocalDateTime.now();
        long elapsedDays = Math.max(0, Duration.between(subscriptionStart, now).toDays());
        long periodIndex = elapsedDays / 30;
        LocalDateTime start = subscriptionStart.plusDays(periodIndex * 30);
        LocalDateTime end = start.plusDays(30);
        if (subscriptionEnd != null && subscriptionEnd.isBefore(end)) end = subscriptionEnd;
        return new Period(start, end);
    }

    private long resolveMonthlyLimitSeconds(SchoolService.SchoolContext context) {
        Integer minutes = context.servicePackage().getMonthlyAiMinutes();
        return (long) (minutes != null && minutes > 0 ? minutes : DEFAULT_MONTHLY_AI_MINUTES) * 60;
    }

    private int resolveDailyLimitMinutes(SchoolService.SchoolContext context, String role) {
        Integer minutes = Role.TEACHER.equals(role)
                ? context.school().getTeacherDailyAiMinutes()
                : context.school().getStudentDailyAiMinutes();
        return minutes == null ? 0 : Math.max(0, minutes);
    }

    private long totalLimit(SchoolAiUsage usage) {
        return safe(usage.getLimitSeconds()) + safe(usage.getAdditionalSeconds());
    }

    private String normalizeVideoId(String videoId) {
        String value = videoId == null ? "" : videoId.trim();
        if (value.isEmpty() || value.length() > 200) {
            throw new AiUsageException("INVALID_VIDEO", "Mã video không hợp lệ.", null);
        }
        return value;
    }

    private long requireDuration(Long durationSeconds) {
        if (durationSeconds == null || durationSeconds <= 0 || durationSeconds > 43200) {
            throw new AiUsageException("INVALID_VIDEO_DURATION", "Không xác định được thời lượng video.", null);
        }
        return durationSeconds;
    }

    private long safe(Long value) {
        return value == null ? 0 : value;
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private record Period(LocalDateTime start, LocalDateTime end) {}
}
