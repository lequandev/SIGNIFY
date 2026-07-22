package com.signify.modules.entitlement.service;

import com.signify.modules.entitlement.dto.PersonalAiUsageSummaryResponse;
import com.signify.modules.entitlement.model.PersonalAiUsage;
import com.signify.modules.entitlement.repository.PersonalAiUsageRepository;
import com.signify.modules.school.service.SchoolService;
import com.signify.modules.subscription.model.ServicePackage;
import com.signify.modules.subscription.model.Subscription;
import com.signify.modules.subscription.repository.ServicePackageRepository;
import com.signify.modules.subscription.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PersonalAiUsageService {

    public static final String USER_MONTHLY_SCOPE = "USER_MONTHLY";
    public static final String TOP_UP_NOT_AVAILABLE = "PERSONAL_AI_USAGE_TOP_UP_NOT_AVAILABLE";
    public static final int DEFAULT_MONTHLY_AI_MINUTES = 800;

    private final PersonalAiUsageRepository usageRepository;
    private final SubscriptionService subscriptionService;
    private final ServicePackageRepository servicePackageRepository;

    public PersonalAiUsageSummaryResponse currentSummary(String userId) {
        PersonalContext context = resolveContext(userId);
        return buildSummary(getOrCreateUsage(context), context);
    }

    public boolean hasRemainingQuota(String userId) {
        PersonalContext context = resolveContext(userId);
        PersonalAiUsage usage = getOrCreateUsage(context);
        return totalLimit(usage) > safe(usage.getUsedSeconds());
    }

    public synchronized PersonalAiUsageSummaryResponse recordUsage(String userId, long usedSeconds) {
        if (usedSeconds <= 0) return currentSummary(userId);
        PersonalContext context = resolveContext(userId);
        for (int attempt = 0; attempt < 5; attempt++) {
            PersonalAiUsage usage = getOrCreateUsage(context);
            long totalLimit = totalLimit(usage);
            usage.setUsedSeconds(Math.min(totalLimit, safe(usage.getUsedSeconds()) + usedSeconds));
            usage.setUpdatedAt(LocalDateTime.now());
            try {
                return buildSummary(usageRepository.save(usage), context);
            } catch (OptimisticLockingFailureException ignored) {
                // Reload the current period and retry against its latest total.
            }
        }
        throw new IllegalStateException("Không thể cập nhật AI Usage cá nhân; vui lòng thử lại.");
    }

    public PersonalAiUsageSummaryResponse requireTopUpEligibility(String userId) {
        PersonalAiUsageSummaryResponse summary = currentSummary(userId);
        if (summary.getRemainingSeconds() > 0) {
            throw new IllegalStateException(
                    "Chỉ có thể mua thêm phút AI khi bạn đã dùng hết quota của chu kỳ hiện tại.");
        }
        return summary;
    }

    public synchronized PersonalAiUsageSummaryResponse applyPurchasedTopUp(
            String userId, long orderCode, int minutes) {
        if (orderCode <= 0 || minutes <= 0) {
            throw new IllegalArgumentException("Thông tin gói mua thêm không hợp lệ.");
        }
        PersonalContext context = resolveContext(userId);
        if (usageRepository.existsByAppliedTopUpOrderCodesContaining(orderCode)) {
            return buildSummary(getOrCreateUsage(context), context);
        }

        for (int attempt = 0; attempt < 5; attempt++) {
            PersonalAiUsage usage = getOrCreateUsage(context);
            List<Long> appliedOrderCodes = usage.getAppliedTopUpOrderCodes() == null
                    ? new ArrayList<>()
                    : new ArrayList<>(usage.getAppliedTopUpOrderCodes());
            if (appliedOrderCodes.contains(orderCode)) return buildSummary(usage, context);

            appliedOrderCodes.add(orderCode);
            usage.setAppliedTopUpOrderCodes(appliedOrderCodes);
            usage.setAdditionalSeconds(safe(usage.getAdditionalSeconds()) + (long) minutes * 60);
            usage.setUpdatedAt(LocalDateTime.now());
            try {
                return buildSummary(usageRepository.save(usage), context);
            } catch (OptimisticLockingFailureException ignored) {
                // Reload before retrying so one paid order can only be applied once.
            } catch (DuplicateKeyException exception) {
                if (usageRepository.existsByAppliedTopUpOrderCodesContaining(orderCode)) {
                    return buildSummary(getOrCreateUsage(context), context);
                }
                throw exception;
            }
        }
        throw new IllegalStateException("Không thể cộng phút AI mua thêm; vui lòng thử lại.");
    }

    private PersonalContext resolveContext(String userId) {
        Subscription subscription = subscriptionService.getCurrentSubscription(userId)
                .orElseThrow(() -> new IllegalStateException("Bạn chưa có gói cá nhân đang hoạt động."));
        ServicePackage servicePackage = servicePackageRepository.findById(subscription.getPackageId())
                .orElseThrow(() -> new IllegalStateException("Không tìm thấy gói cá nhân đang hoạt động."));
        if (SchoolService.isSchoolPlan(servicePackage.getPlanType())) {
            throw new IllegalStateException("Quota này chỉ áp dụng cho gói cá nhân.");
        }
        return new PersonalContext(userId, subscription, servicePackage);
    }

    private PersonalAiUsage getOrCreateUsage(PersonalContext context) {
        Period period = resolvePeriod(context.subscription());
        PersonalAiUsage usage = usageRepository
                .findByUserIdAndPeriodStart(context.userId(), period.start())
                .orElse(null);
        long packageLimit = resolveMonthlyLimitSeconds(context.servicePackage());
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
        PersonalAiUsage created = PersonalAiUsage.builder()
                .userId(context.userId())
                .subscriptionId(context.subscription().getId())
                .packageId(context.servicePackage().getId())
                .periodStart(period.start())
                .periodEnd(period.end())
                .limitSeconds(packageLimit)
                .additionalSeconds(0L)
                .usedSeconds(0L)
                .createdAt(now)
                .updatedAt(now)
                .build();
        try {
            return usageRepository.save(created);
        } catch (DuplicateKeyException exception) {
            return usageRepository.findByUserIdAndPeriodStart(context.userId(), period.start())
                    .orElseThrow(() -> exception);
        }
    }

    private Period resolvePeriod(Subscription subscription) {
        LocalDateTime startDate = subscription.getStartDate() != null
                ? subscription.getStartDate()
                : subscription.getCreatedAt();
        if (startDate == null) startDate = LocalDateTime.now();
        LocalDateTime now = LocalDateTime.now();
        long elapsedDays = Math.max(0, Duration.between(startDate, now).toDays());
        long periodIndex = elapsedDays / 30;
        LocalDateTime start = startDate.plusDays(periodIndex * 30);
        LocalDateTime end = start.plusDays(30);
        if (subscription.getEndDate() != null && subscription.getEndDate().isBefore(end)) {
            end = subscription.getEndDate();
        }
        return new Period(start, end);
    }

    private long resolveMonthlyLimitSeconds(ServicePackage servicePackage) {
        Integer minutes = servicePackage.getMonthlyAiMinutes();
        return (long) (minutes != null && minutes > 0 ? minutes : DEFAULT_MONTHLY_AI_MINUTES) * 60;
    }

    private PersonalAiUsageSummaryResponse buildSummary(
            PersonalAiUsage usage, PersonalContext context) {
        long limit = safe(usage.getLimitSeconds());
        long additional = safe(usage.getAdditionalSeconds());
        long used = safe(usage.getUsedSeconds());
        return PersonalAiUsageSummaryResponse.builder()
                .userId(context.userId())
                .packageName(context.servicePackage().getName())
                .periodStart(usage.getPeriodStart())
                .periodEnd(usage.getPeriodEnd())
                .limitSeconds(limit)
                .additionalSeconds(additional)
                .usedSeconds(used)
                .remainingSeconds(Math.max(0, limit + additional - used))
                .build();
    }

    private long totalLimit(PersonalAiUsage usage) {
        return safe(usage.getLimitSeconds()) + safe(usage.getAdditionalSeconds());
    }

    private long safe(Long value) {
        return value == null ? 0 : value;
    }

    private record PersonalContext(
            String userId, Subscription subscription, ServicePackage servicePackage) {}

    private record Period(LocalDateTime start, LocalDateTime end) {}
}
