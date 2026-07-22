package com.signify.modules.entitlement.service;

import com.signify.modules.entitlement.model.PersonalAiUsage;
import com.signify.modules.entitlement.repository.PersonalAiUsageRepository;
import com.signify.modules.subscription.model.ServicePackage;
import com.signify.modules.subscription.model.Subscription;
import com.signify.modules.subscription.repository.ServicePackageRepository;
import com.signify.modules.subscription.service.SubscriptionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
class PersonalAiUsageServiceTest {

    @Mock private PersonalAiUsageRepository usageRepository;
    @Mock private SubscriptionService subscriptionService;
    @Mock private ServicePackageRepository servicePackageRepository;

    private PersonalAiUsageService service;
    private PersonalAiUsage usage;

    @BeforeEach
    void setUp() {
        service = new PersonalAiUsageService(
                usageRepository, subscriptionService, servicePackageRepository);
        LocalDateTime start = LocalDateTime.now().minusDays(5);
        Subscription subscription = Subscription.builder()
                .id("subscription-1")
                .userId("personal-1")
                .packageId("package-1")
                .startDate(start)
                .endDate(start.plusDays(180))
                .status("ACTIVE")
                .build();
        ServicePackage servicePackage = ServicePackage.builder()
                .id("package-1")
                .name("Gói Cá nhân")
                .planType("individual")
                .monthlyAiMinutes(800)
                .build();
        usage = PersonalAiUsage.builder()
                .id("usage-1")
                .userId("personal-1")
                .subscriptionId("subscription-1")
                .packageId("package-1")
                .periodStart(start)
                .periodEnd(start.plusDays(30))
                .limitSeconds(48000L)
                .additionalSeconds(0L)
                .usedSeconds(0L)
                .version(0L)
                .build();

        when(subscriptionService.getCurrentSubscription("personal-1"))
                .thenReturn(Optional.of(subscription));
        when(servicePackageRepository.findById("package-1"))
                .thenReturn(Optional.of(servicePackage));
        when(usageRepository.findByUserIdAndPeriodStart(eq("personal-1"), any(LocalDateTime.class)))
                .thenReturn(Optional.of(usage));
        lenient().when(usageRepository.save(any(PersonalAiUsage.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void personalPlanStartsEachPeriodWithEightHundredMinutes() {
        var summary = service.currentSummary("personal-1");

        assertEquals(48000L, summary.getLimitSeconds());
        assertEquals(48000L, summary.getRemainingSeconds());
    }

    @Test
    void topUpIsAvailableOnlyAfterQuotaIsExhaustedAndAppliedOnce() {
        assertThrows(IllegalStateException.class,
                () -> service.requireTopUpEligibility("personal-1"));

        service.recordUsage("personal-1", 48000L);
        service.requireTopUpEligibility("personal-1");
        service.applyPurchasedTopUp("personal-1", 987654L, 200);
        service.applyPurchasedTopUp("personal-1", 987654L, 200);

        assertEquals(12000L, usage.getAdditionalSeconds());
        assertEquals(1, usage.getAppliedTopUpOrderCodes().size());
        assertEquals(987654L, usage.getAppliedTopUpOrderCodes().get(0));
        verify(usageRepository, times(2)).save(usage);
    }
}
