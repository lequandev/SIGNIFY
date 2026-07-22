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
import com.signify.modules.user.model.Role;
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
    private final SchoolAiUsageService schoolAiUsageService;
    private final PersonalAiUsageService personalAiUsageService;

    public EntitlementResponse getEntitlement(String userId) {
        Optional<SchoolEntitlementContext> schoolContext = schoolService.getActiveSchoolEntitlement(userId);
        if (schoolContext.isPresent()) {
            SchoolEntitlementContext context = schoolContext.get();
            String role = context.getMembership().getRole();
            if (Role.TEACHER.equals(role) || Role.STUDENT.equals(role)) {
                var dailyUsage = schoolAiUsageService.currentDailyUsageForMember(userId);
                int dailyLimit = secondsToRoundedMinutes(dailyUsage.getLimitSeconds());
                int usedToday = secondsToRoundedMinutes(
                        dailyUsage.getUsedSeconds() + dailyUsage.getReservedSeconds());
                Integer remainingToday = dailyLimit == 0 ? null : Math.max(0, dailyLimit - usedToday);
                return EntitlementResponse.builder()
                        .plan("SCHOOL_" + role)
                        .planType("education")
                        .packageName(context.getServicePackage().getName())
                        .fullFeatures(true)
                        .unlimited(dailyLimit == 0)
                        .usageScope("USER_DAILY")
                        .dailyUsageLimitMinutes(dailyLimit)
                        .usedMinutesToday(usedToday)
                        .remainingMinutesToday(remainingToday)
                        .dailyUsageResetsAt(schoolAiUsageService.nextDailyQuotaResetAt())
                        .expiresAt(context.getSubscription().getEndDate())
                        .organizationName(context.getSchool().getName())
                        .build();
            }

            var aiUsage = schoolAiUsageService.currentSummaryForMember(userId);
            return EntitlementResponse.builder()
                    .plan("SCHOOL_" + role)
                    .planType("education")
                    .packageName(context.getServicePackage().getName())
                    .fullFeatures(true)
                    .unlimited(false)
                    .usageScope(SchoolAiUsageService.SCHOOL_MONTHLY_SCOPE)
                    .dailyUsageLimitMinutes(null)
                    .usedMinutesToday(null)
                    .remainingMinutesToday(null)
                    .monthlyAiLimitMinutes(secondsToRoundedMinutes(aiUsage.getLimitSeconds() + aiUsage.getAdditionalSeconds()))
                    .usedAiMinutesThisPeriod(secondsToRoundedMinutes(aiUsage.getUsedSeconds() + aiUsage.getReservedSeconds()))
                    .remainingAiMinutesThisPeriod(secondsToRoundedMinutes(aiUsage.getRemainingSeconds()))
                    .aiUsagePeriodEndsAt(aiUsage.getPeriodEnd())
                    .expiresAt(context.getSubscription().getEndDate())
                    .organizationName(context.getSchool().getName())
                    .build();
        }

        DailyUsage todayUsage = getTodayUsage(userId);
        int usedMinutes = secondsToRoundedMinutes(todayUsage.getUsedSeconds());

        Optional<Subscription> subscriptionOpt = subscriptionService.getCurrentSubscription(userId);
        if (subscriptionOpt.isPresent()) {
            Subscription subscription = subscriptionOpt.get();
            ServicePackage servicePackage = servicePackageRepository.findById(subscription.getPackageId()).orElse(null);
            String planType = servicePackage != null ? servicePackage.getPlanType() : null;

            if (!SchoolService.isSchoolPlan(planType)) {
                String packageName = servicePackage != null ? servicePackage.getName() : "Gói đang hoạt động";
                Boolean fullFeatures = servicePackage == null || servicePackage.getFullFeatures() == null || servicePackage.getFullFeatures();
                var aiUsage = personalAiUsageService.currentSummary(userId);
                int monthlyLimit = secondsToRoundedMinutes(
                        aiUsage.getLimitSeconds() + aiUsage.getAdditionalSeconds());
                int usedThisPeriod = secondsToRoundedMinutes(aiUsage.getUsedSeconds());

                return EntitlementResponse.builder()
                        .plan("PERSONAL_PAID")
                        .planType(planType)
                        .packageName(packageName)
                        .fullFeatures(fullFeatures)
                        .unlimited(false)
                        .usageScope(PersonalAiUsageService.USER_MONTHLY_SCOPE)
                        .dailyUsageLimitMinutes(null)
                        .usedMinutesToday(null)
                        .remainingMinutesToday(null)
                        .monthlyAiLimitMinutes(monthlyLimit)
                        .usedAiMinutesThisPeriod(usedThisPeriod)
                        .remainingAiMinutesThisPeriod(secondsToRoundedMinutes(aiUsage.getRemainingSeconds()))
                        .aiUsagePeriodEndsAt(aiUsage.getPeriodEnd())
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
                .usageScope("USER_DAILY")
                .dailyUsageLimitMinutes(FREE_DAILY_LIMIT_MINUTES)
                .usedMinutesToday(usedMinutes)
                .remainingMinutesToday(remaining)
                .dailyUsageResetsAt(LocalDate.now().plusDays(1).atStartOfDay())
                .expiresAt(null)
                .organizationName(null)
                .build();
    }

    public EntitlementResponse recordUsage(String userId, long usedSeconds) {
        if (schoolService.getActiveSchoolEntitlement(userId).isPresent()) {
            return getEntitlement(userId);
        }
        if (hasActivePersonalSubscription(userId)) {
            personalAiUsageService.recordUsage(userId, usedSeconds);
            return getEntitlement(userId);
        }
        DailyUsage usage = getTodayUsage(userId);
        usage.setUsedSeconds((usage.getUsedSeconds() == null ? 0L : usage.getUsedSeconds()) + usedSeconds);
        usage.setUpdatedAt(LocalDateTime.now());
        dailyUsageRepository.save(usage);
        return getEntitlement(userId);
    }

    public boolean canUseFeature(String userId) {
        if (schoolService.getActiveSchoolEntitlement(userId).isPresent()) {
            return schoolAiUsageService.hasRemainingSchoolQuota(userId);
        }
        if (hasActivePersonalSubscription(userId)) {
            return personalAiUsageService.hasRemainingQuota(userId);
        }
        EntitlementResponse entitlement = getEntitlement(userId);
        return Boolean.TRUE.equals(entitlement.getUnlimited())
                || entitlement.getRemainingMinutesToday() == null
                || entitlement.getRemainingMinutesToday() > 0;
    }

    public boolean canStartUsageSession(String userId) {
        return schoolService.getActiveSchoolEntitlement(userId).isPresent() || canUseFeature(userId);
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

    private boolean hasActivePersonalSubscription(String userId) {
        Optional<Subscription> subscription = subscriptionService.getCurrentSubscription(userId);
        if (subscription.isEmpty()) return false;
        ServicePackage servicePackage = servicePackageRepository
                .findById(subscription.get().getPackageId())
                .orElse(null);
        return servicePackage != null && !SchoolService.isSchoolPlan(servicePackage.getPlanType());
    }

    private int secondsToRoundedMinutes(Long seconds) {
        long safeSeconds = seconds == null ? 0 : Math.max(0, seconds);
        return (int) Math.ceil(safeSeconds / 60.0);
    }
}
