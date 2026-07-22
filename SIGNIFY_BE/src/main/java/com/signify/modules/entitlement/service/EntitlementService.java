package com.signify.modules.entitlement.service;

import com.signify.modules.school.dto.response.SchoolEntitlementContext;
import com.signify.modules.school.service.SchoolService;
import com.signify.modules.entitlement.dto.EntitlementResponse;
import com.signify.modules.entitlement.model.DailyUsage;
import com.signify.modules.entitlement.repository.DailyUsageRepository;
import com.signify.modules.subscription.model.ServicePackage;
import com.signify.modules.subscription.model.Subscription;
import com.signify.modules.subscription.repository.ServicePackageRepository;
import com.signify.modules.subscription.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class EntitlementService {

    private static final int FREE_DAILY_LIMIT_MINUTES = 20;

    private final SubscriptionService subscriptionService;
    private final ServicePackageRepository servicePackageRepository;
    private final DailyUsageRepository dailyUsageRepository;
    private final SchoolService schoolService;

    public EntitlementResponse getEntitlement(String userId) {
        DailyUsage todayUsage = getTodayUsage(userId);
        int usedMinutes = secondsToRoundedMinutes(todayUsage.getUsedSeconds());

        Optional<SchoolEntitlementContext> schoolContext = schoolService.getActiveSchoolEntitlement(userId);
        if (schoolContext.isPresent()) {
            SchoolEntitlementContext context = schoolContext.get();
            return EntitlementResponse.builder()
                    .plan("SCHOOL_" + context.getMembership().getRole())
                    .planType("education")
                    .packageName(context.getServicePackage().getName())
                    .fullFeatures(true)
                    .unlimited(true)
                    .dailyUsageLimitMinutes(null)
                    .usedMinutesToday(usedMinutes)
                    .remainingMinutesToday(null)
                    .expiresAt(context.getSubscription().getEndDate())
                    .organizationName(context.getSchool().getName())
                    .build();
        }

        Optional<Subscription> subscriptionOpt = subscriptionService.getCurrentSubscription(userId);
        if (subscriptionOpt.isPresent()) {
            Subscription subscription = subscriptionOpt.get();
            ServicePackage servicePackage = servicePackageRepository.findById(subscription.getPackageId()).orElse(null);
            String planType = servicePackage != null ? servicePackage.getPlanType() : null;

            if (!SchoolService.isSchoolPlan(planType)) {
                String packageName = servicePackage != null ? servicePackage.getName() : "Gói đang hoạt động";
                Boolean fullFeatures = servicePackage == null || servicePackage.getFullFeatures() == null || servicePackage.getFullFeatures();

                return EntitlementResponse.builder()
                        .plan("PERSONAL_PAID")
                        .planType(planType)
                        .packageName(packageName)
                        .fullFeatures(fullFeatures)
                        .unlimited(true)
                        .dailyUsageLimitMinutes(null)
                        .usedMinutesToday(usedMinutes)
                        .remainingMinutesToday(null)
                        .expiresAt(subscription.getEndDate())
                        .organizationName(null)
                        .build();
            }
        }

        int remaining = Math.max(0, FREE_DAILY_LIMIT_MINUTES - usedMinutes);
        return EntitlementResponse.builder()
                .plan("FREE")
                .planType("free")
                .packageName("Miễn phí")
                .fullFeatures(false)
                .unlimited(false)
                .dailyUsageLimitMinutes(FREE_DAILY_LIMIT_MINUTES)
                .usedMinutesToday(usedMinutes)
                .remainingMinutesToday(remaining)
                .expiresAt(null)
                .organizationName(null)
                .build();
    }

    public EntitlementResponse recordUsage(String userId, long usedSeconds) {
        DailyUsage usage = getTodayUsage(userId);
        usage.setUsedSeconds((usage.getUsedSeconds() == null ? 0L : usage.getUsedSeconds()) + usedSeconds);
        usage.setUpdatedAt(LocalDateTime.now());
        dailyUsageRepository.save(usage);
        return getEntitlement(userId);
    }

    public boolean canUseFeature(String userId) {
        EntitlementResponse entitlement = getEntitlement(userId);
        return Boolean.TRUE.equals(entitlement.getUnlimited())
                || entitlement.getRemainingMinutesToday() == null
                || entitlement.getRemainingMinutesToday() > 0;
    }

    private DailyUsage getTodayUsage(String userId) {
        LocalDate today = LocalDate.now();
        return dailyUsageRepository.findByUserIdAndUsageDate(userId, today)
                .orElseGet(() -> DailyUsage.builder()
                        .userId(userId)
                        .usageDate(today)
                        .usedSeconds(0L)
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build());
    }

    private int secondsToRoundedMinutes(Long seconds) {
        long safeSeconds = seconds == null ? 0L : seconds;
        return (int) Math.ceil(safeSeconds / 60.0);
    }
}
