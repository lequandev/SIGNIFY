package com.signify.modules.entitlement.service;

import com.signify.modules.entitlement.dto.AiUsageSummaryResponse;
import com.signify.modules.entitlement.dto.EntitlementResponse;
import com.signify.modules.entitlement.repository.DailyUsageRepository;
import com.signify.modules.school.dto.response.SchoolEntitlementContext;
import com.signify.modules.school.model.School;
import com.signify.modules.school.model.SchoolMembership;
import com.signify.modules.school.service.SchoolService;
import com.signify.modules.subscription.model.ServicePackage;
import com.signify.modules.subscription.model.Subscription;
import com.signify.modules.subscription.repository.ServicePackageRepository;
import com.signify.modules.subscription.service.SubscriptionService;
import com.signify.modules.user.model.Role;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EntitlementServiceTest {

    @Mock private SubscriptionService subscriptionService;
    @Mock private ServicePackageRepository servicePackageRepository;
    @Mock private DailyUsageRepository dailyUsageRepository;
    @Mock private SchoolService schoolService;
    @Mock private SchoolAiUsageService schoolAiUsageService;
    @Mock private PersonalAiUsageService personalAiUsageService;

    private EntitlementService service;
    private SchoolEntitlementContext context;
    private LocalDateTime resetAt;

    @BeforeEach
    void setUp() {
        service = new EntitlementService(
                subscriptionService, servicePackageRepository, dailyUsageRepository,
                schoolService, schoolAiUsageService, personalAiUsageService);
        resetAt = LocalDateTime.of(2026, 7, 24, 0, 0);
        context = SchoolEntitlementContext.builder()
                .school(School.builder().id("school-1").name("Signify Organization").build())
                .membership(SchoolMembership.builder()
                        .schoolId("school-1").userId("member-1").role(Role.TEACHER).status("ACTIVE").build())
                .subscription(Subscription.builder()
                        .id("subscription-1").endDate(LocalDateTime.of(2027, 1, 1, 0, 0)).build())
                .servicePackage(ServicePackage.builder()
                        .id("package-1").name("Gói Tổ chức").planType("education").build())
                .build();
        lenient().when(schoolService.getActiveSchoolEntitlement("member-1")).thenReturn(Optional.of(context));
    }

    @Test
    void teacherSeesPersonalDailyUsageInsteadOfOrganizationMonthlyUsage() {
        assertMemberDailyEntitlement(Role.TEACHER, 120, 35, 85);
    }

    @Test
    void studentSeesPersonalDailyUsageInsteadOfOrganizationMonthlyUsage() {
        assertMemberDailyEntitlement(Role.STUDENT, 60, 15, 45);
    }

    @Test
    void schoolAdminStillSeesOrganizationMonthlyUsage() {
        context.getMembership().setRole(Role.SCHOOL_ADMIN);
        AiUsageSummaryResponse monthly = AiUsageSummaryResponse.builder()
                .limitSeconds(600000L)
                .additionalSeconds(60000L)
                .usedSeconds(120000L)
                .reservedSeconds(0L)
                .remainingSeconds(540000L)
                .periodEnd(LocalDateTime.of(2026, 8, 21, 0, 0))
                .build();
        when(schoolAiUsageService.currentSummaryForMember("member-1")).thenReturn(monthly);

        EntitlementResponse result = service.getEntitlement("member-1");

        assertEquals("SCHOOL_MONTHLY", result.getUsageScope());
        assertFalse(result.getUnlimited());
        assertEquals(11000, result.getMonthlyAiLimitMinutes());
        assertEquals(2000, result.getUsedAiMinutesThisPeriod());
        assertEquals(9000, result.getRemainingAiMinutesThisPeriod());
        assertNull(result.getDailyUsageLimitMinutes());
        verify(schoolAiUsageService, never()).currentDailyUsageForMember("member-1");
    }

    @Test
    void paidPersonalPlanUsesMonthlyQuota() {
        LocalDateTime periodEnd = LocalDateTime.of(2026, 8, 21, 0, 0);
        Subscription subscription = Subscription.builder()
                .id("personal-subscription")
                .packageId("personal-package")
                .endDate(LocalDateTime.of(2027, 1, 1, 0, 0))
                .build();
        ServicePackage servicePackage = ServicePackage.builder()
                .id("personal-package")
                .name("Gói Cá nhân")
                .planType("individual")
                .monthlyAiMinutes(800)
                .fullFeatures(true)
                .build();
        when(subscriptionService.getCurrentSubscription("personal-1"))
                .thenReturn(Optional.of(subscription));
        when(servicePackageRepository.findById("personal-package"))
                .thenReturn(Optional.of(servicePackage));
        when(personalAiUsageService.currentSummary("personal-1"))
                .thenReturn(com.signify.modules.entitlement.dto.PersonalAiUsageSummaryResponse.builder()
                        .limitSeconds(48000L)
                        .additionalSeconds(0L)
                        .usedSeconds(7200L)
                        .remainingSeconds(40800L)
                        .periodEnd(periodEnd)
                        .build());

        EntitlementResponse result = service.getEntitlement("personal-1");

        assertEquals("USER_MONTHLY", result.getUsageScope());
        assertFalse(result.getUnlimited());
        assertEquals(800, result.getMonthlyAiLimitMinutes());
        assertEquals(120, result.getUsedAiMinutesThisPeriod());
        assertEquals(680, result.getRemainingAiMinutesThisPeriod());
        assertEquals(periodEnd, result.getAiUsagePeriodEndsAt());
        assertNull(result.getDailyUsageLimitMinutes());
    }

    private void assertMemberDailyEntitlement(String role, int limitMinutes, int usedMinutes, int remainingMinutes) {
        context.getMembership().setRole(role);
        AiUsageSummaryResponse.MemberDailyUsage daily = AiUsageSummaryResponse.MemberDailyUsage.builder()
                .userId("member-1")
                .role(role)
                .limitSeconds((long) limitMinutes * 60)
                .usedSeconds((long) usedMinutes * 60)
                .reservedSeconds(0L)
                .remainingSeconds((long) remainingMinutes * 60)
                .build();
        when(schoolAiUsageService.currentDailyUsageForMember("member-1")).thenReturn(daily);
        when(schoolAiUsageService.nextDailyQuotaResetAt()).thenReturn(resetAt);

        EntitlementResponse result = service.getEntitlement("member-1");

        assertEquals("USER_DAILY", result.getUsageScope());
        assertEquals(limitMinutes, result.getDailyUsageLimitMinutes());
        assertEquals(usedMinutes, result.getUsedMinutesToday());
        assertEquals(remainingMinutes, result.getRemainingMinutesToday());
        assertEquals(resetAt, result.getDailyUsageResetsAt());
        assertNull(result.getMonthlyAiLimitMinutes());
        assertTrue(result.getPlan().endsWith(role));
        verify(schoolAiUsageService, never()).currentSummaryForMember("member-1");
    }
}
