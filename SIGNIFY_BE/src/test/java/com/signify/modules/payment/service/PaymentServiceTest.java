package com.signify.modules.payment.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.signify.modules.entitlement.service.SchoolAiUsageService;
import com.signify.modules.entitlement.service.PersonalAiUsageService;
import com.signify.modules.payment.model.Payment;
import com.signify.modules.payment.repository.PaymentRepository;
import com.signify.modules.school.service.SchoolService;
import com.signify.modules.subscription.repository.ServicePackageRepository;
import com.signify.modules.subscription.repository.SubscriptionRepository;
import com.signify.modules.subscription.service.SubscriptionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.payos.PayOS;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock private PayOS payOS;
    @Mock private PaymentRepository paymentRepository;
    @Mock private ServicePackageRepository servicePackageRepository;
    @Mock private SubscriptionRepository subscriptionRepository;
    @Mock private SubscriptionService subscriptionService;
    @Mock private SchoolService schoolService;
    @Mock private SchoolAiUsageService schoolAiUsageService;
    @Mock private PersonalAiUsageService personalAiUsageService;

    private PaymentService service;

    @BeforeEach
    void setUp() {
        service = new PaymentService(
                payOS, paymentRepository, servicePackageRepository, subscriptionRepository,
                subscriptionService, schoolService, schoolAiUsageService, personalAiUsageService);
    }

    @Test
    void paidTopUpWebhookCreditsMinutesExactlyOnce() {
        Payment payment = Payment.builder()
                .id("payment-1")
                .userId("admin-1")
                .schoolId("school-1")
                .paymentType(PaymentService.PAYMENT_TYPE_AI_USAGE_TOP_UP)
                .topUpMinutes(1000)
                .amount(BigDecimal.valueOf(399000))
                .orderCode(123456L)
                .status("PENDING")
                .build();
        when(paymentRepository.findByOrderCode(123456L)).thenReturn(Optional.of(payment));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ObjectNode webhook = new ObjectMapper().createObjectNode();
        webhook.put("code", "00");
        webhook.putObject("data").put("orderCode", 123456L).put("reference", "PAYOS-REF");

        service.handleWebhook(webhook);
        service.handleWebhook(webhook);

        assertEquals("PAID", payment.getStatus());
        assertNotNull(payment.getFulfilledAt());
        verify(schoolAiUsageService, times(1))
                .applyPurchasedTopUp("admin-1", 123456L, 1000);
    }

    @Test
    void paidPersonalTopUpWebhookCreditsTwoHundredMinutesExactlyOnce() {
        Payment payment = Payment.builder()
                .id("payment-personal")
                .userId("personal-1")
                .paymentType(PaymentService.PAYMENT_TYPE_PERSONAL_AI_USAGE_TOP_UP)
                .topUpMinutes(200)
                .amount(BigDecimal.valueOf(29000))
                .orderCode(654321L)
                .status("PENDING")
                .build();
        when(paymentRepository.findByOrderCode(654321L)).thenReturn(Optional.of(payment));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ObjectNode webhook = new ObjectMapper().createObjectNode();
        webhook.put("code", "00");
        webhook.putObject("data").put("orderCode", 654321L).put("reference", "PAYOS-PERSONAL");

        service.handleWebhook(webhook);
        service.handleWebhook(webhook);

        assertEquals("PAID", payment.getStatus());
        assertNotNull(payment.getFulfilledAt());
        verify(personalAiUsageService, times(1))
                .applyPurchasedTopUp("personal-1", 654321L, 200);
    }
}
