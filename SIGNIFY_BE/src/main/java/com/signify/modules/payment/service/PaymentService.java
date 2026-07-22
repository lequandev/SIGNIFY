package com.signify.modules.payment.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.signify.modules.entitlement.dto.AiUsageSummaryResponse;
import com.signify.modules.entitlement.service.PersonalAiUsageService;
import com.signify.modules.entitlement.service.SchoolAiUsageService;
import com.signify.modules.school.service.SchoolService;
import com.signify.modules.payment.dto.request.CreatePaymentRequest;
import com.signify.modules.payment.dto.response.PaymentResponse;
import com.signify.modules.payment.model.Payment;
import com.signify.modules.payment.repository.PaymentRepository;
import com.signify.modules.subscription.model.ServicePackage;
import com.signify.modules.subscription.model.Subscription;
import com.signify.modules.subscription.repository.ServicePackageRepository;
import com.signify.modules.subscription.repository.SubscriptionRepository;
import com.signify.modules.subscription.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.payos.PayOS;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;
import vn.payos.model.v2.paymentRequests.PaymentLink;
import vn.payos.model.v2.paymentRequests.PaymentLinkItem;
import com.fasterxml.jackson.databind.JsonNode;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Date;
import java.util.Map;
import java.util.Optional;
import java.util.Random;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    public static final String PAYMENT_TYPE_SUBSCRIPTION = "SUBSCRIPTION";
    public static final String PAYMENT_TYPE_AI_USAGE_TOP_UP = "AI_USAGE_TOP_UP";
    public static final int AI_USAGE_TOP_UP_MINUTES = 1000;
    public static final long AI_USAGE_TOP_UP_PRICE = 399000L;
    public static final String PAYMENT_TYPE_PERSONAL_AI_USAGE_TOP_UP = "PERSONAL_AI_USAGE_TOP_UP";
    public static final int PERSONAL_AI_USAGE_TOP_UP_MINUTES = 200;
    public static final long PERSONAL_AI_USAGE_TOP_UP_PRICE = 29000L;

    private final PayOS payOS;
    private final PaymentRepository paymentRepository;
    private final ServicePackageRepository servicePackageRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionService subscriptionService;
    private final SchoolService schoolService;
    private final SchoolAiUsageService schoolAiUsageService;
    private final PersonalAiUsageService personalAiUsageService;

    @Value("${payos.return-url}")
    private String returnUrl;

    @Value("${payos.cancel-url}")
    private String cancelUrl;

    @Transactional
    public PaymentResponse createPaymentLink(CreatePaymentRequest request, String userId) {
        ServicePackage servicePackage = servicePackageRepository.findById(request.getPackageId())
                .orElseThrow(() -> new RuntimeException("Package not found"));

        if (servicePackage.getPrice() == null || servicePackage.getPrice().equalsIgnoreCase("Liên hệ") || servicePackage.getDurationDays() == null) {
            throw new RuntimeException("Gói này yêu cầu liên hệ trực tiếp. Vui lòng liên hệ bộ phận kinh doanh.");
        }

        // Convert String price (e.g., "49,000") to numeric format before creating payment record
        String priceClean = servicePackage.getPrice().replace(",", "").replace("đ", "").trim();
        BigDecimal amount = new BigDecimal(priceClean);

        // Generate unique orderCode (must be less than 9007199254740991)
        Long orderCode = generateOrderCode();

        // Create Payment record
        String organizationName = SchoolService.isSchoolPlan(servicePackage.getPlanType())
                ? resolveOrganizationName(request.getName(), servicePackage.getName())
                : null;
        Payment payment = Payment.builder()
                .userId(userId)
                .paymentType(PAYMENT_TYPE_SUBSCRIPTION)
                .subscriptionId(servicePackage.getId())
                .organizationName(organizationName)
                .amount(amount)
                .orderCode(orderCode)
                .status("PENDING")
                .paymentMethod("PAYOS")
                .build();
        paymentRepository.save(payment);

        return createPayOsPaymentLink(payment, servicePackage.getName(), amount.longValueExact());
    }

    @Transactional
    public PaymentResponse createAiUsageTopUpPaymentLink(String userId) {
        AiUsageSummaryResponse usage = schoolAiUsageService.requireTopUpEligibility(userId);
        Long orderCode = generateOrderCode();
        Payment payment = Payment.builder()
                .userId(userId)
                .paymentType(PAYMENT_TYPE_AI_USAGE_TOP_UP)
                .schoolId(usage.getSchoolId())
                .topUpMinutes(AI_USAGE_TOP_UP_MINUTES)
                .amount(BigDecimal.valueOf(AI_USAGE_TOP_UP_PRICE))
                .orderCode(orderCode)
                .status("PENDING")
                .paymentMethod("PAYOS")
                .build();
        paymentRepository.save(payment);

        return createPayOsPaymentLink(
                payment,
                "Mua thêm 1.000 phút AI",
                AI_USAGE_TOP_UP_PRICE);
    }

    @Transactional
    public PaymentResponse createPersonalAiUsageTopUpPaymentLink(String userId) {
        personalAiUsageService.requireTopUpEligibility(userId);
        Long orderCode = generateOrderCode();
        Payment payment = Payment.builder()
                .userId(userId)
                .paymentType(PAYMENT_TYPE_PERSONAL_AI_USAGE_TOP_UP)
                .topUpMinutes(PERSONAL_AI_USAGE_TOP_UP_MINUTES)
                .amount(BigDecimal.valueOf(PERSONAL_AI_USAGE_TOP_UP_PRICE))
                .orderCode(orderCode)
                .status("PENDING")
                .paymentMethod("PAYOS")
                .build();
        paymentRepository.save(payment);

        return createPayOsPaymentLink(
                payment,
                "Mua thêm 200 phút AI",
                PERSONAL_AI_USAGE_TOP_UP_PRICE);
    }

    private PaymentResponse createPayOsPaymentLink(Payment payment, String itemName, long price) {
        try {
            PaymentLinkItem item = PaymentLinkItem.builder()
                    .name(itemName)
                    .quantity(1)
                    .price(price)
                    .build();

            String paymentDescription = "SIGNIFY" + payment.getOrderCode();

            CreatePaymentLinkRequest paymentLinkRequest = CreatePaymentLinkRequest.builder()
                    .orderCode(payment.getOrderCode())
                    .amount(price)
                    .description(paymentDescription)
                    .returnUrl(returnUrl)
                    .cancelUrl(cancelUrl)
                    .items(Collections.singletonList(item))
                    .build();

            CreatePaymentLinkResponse data = payOS.paymentRequests().create(paymentLinkRequest);

            return PaymentResponse.builder()
                    .checkoutUrl(data.getCheckoutUrl())
                    .qrCode(data.getQrCode())
                    .orderCode(payment.getOrderCode())
                    .accountName(data.getAccountName())
                    .accountNumber(data.getAccountNumber())
                    .amount(data.getAmount().intValue())
                    .description(paymentDescription)
                    .build();
        } catch (Exception e) {
            log.error("Error creating PayOS payment link: ", e);
            throw new RuntimeException("Could not create payment link: " + e.getMessage());
        }
    }

    @Transactional
    public ObjectNode handleWebhook(ObjectNode body) {
        ObjectMapper mapper = new ObjectMapper();
        ObjectNode response = mapper.createObjectNode();
        try {
            // Manual extraction because of vn.payos.type resolution issues
            JsonNode dataNode = body.get("data");
            if (dataNode != null) {
                long orderCode = dataNode.get("orderCode").asLong();
                String code = body.get("code").asText();
                String reference = dataNode.get("reference") != null ? dataNode.get("reference").asText() : "";

                Optional<Payment> paymentOpt = paymentRepository.findByOrderCode(orderCode);
                if (paymentOpt.isPresent()) {
                    Payment payment = paymentOpt.get();

                    // Idempotency: check if already processed
                    if ("PAID".equals(payment.getStatus())) {
                        fulfillPaidPayment(payment);
                        log.info("Webhook already processed for orderCode={}", orderCode);
                        response.put("error", 0);
                        response.put("message", "Already processed");
                        return response;
                    }

                    if ("00".equals(code) || "PAID".equalsIgnoreCase(code) || "SUCCESS".equalsIgnoreCase(code)) {
                        activatePaidPayment(payment, reference);
                    } else {
                        payment.setStatus("CANCELLED");
                        paymentRepository.save(payment);
                    }
                }
            }
            
            response.put("error", 0);
            response.put("message", "Ok");
        } catch (Exception e) {
            log.error("Webhook processing failed", e);
            response.put("error", 1);
            response.put("message", "Webhook processing failed");
        }
        return response;
    }

    @Transactional
    public Map<String, Object> checkStatus(Long orderCode, String userId) {
        Optional<Payment> payment = paymentRepository.findByOrderCode(orderCode);
        if (payment.isPresent()) {
            Payment p = payment.get();

            // Check ownership
            if (!p.getUserId().equals(userId)) {
                return Map.of("error", "Forbidden");
            }

            if ("PENDING".equals(p.getStatus())) {
                syncPaymentStatusFromPayOS(p);
            }

            return Map.of("status", p.getStatus().toLowerCase()); // paid, cancelled, pending
        }
        return Map.of("status", "not_found");
    }

    private void syncPaymentStatusFromPayOS(Payment payment) {
        try {
            PaymentLink paymentLink = payOS.paymentRequests().get(payment.getOrderCode());
            if (paymentLink == null || paymentLink.getStatus() == null) {
                return;
            }

            String payOsStatus = paymentLink.getStatus().getValue();
            if ("PAID".equalsIgnoreCase(payOsStatus)) {
                String reference = paymentLink.getTransactions() != null && !paymentLink.getTransactions().isEmpty()
                        ? paymentLink.getTransactions().get(0).getReference()
                        : "PAYOS_STATUS_SYNC";
                activatePaidPayment(payment, reference);
            } else if ("CANCELLED".equalsIgnoreCase(payOsStatus) || "EXPIRED".equalsIgnoreCase(payOsStatus) || "FAILED".equalsIgnoreCase(payOsStatus)) {
                payment.setStatus(payOsStatus.toUpperCase());
                paymentRepository.save(payment);
            }
        } catch (Exception e) {
            log.warn("Could not sync PayOS status for orderCode={}: {}", payment.getOrderCode(), e.getMessage());
        }
    }

    private void activatePaidPayment(Payment payment, String reference) {
        if ("PAID".equals(payment.getStatus())) {
            fulfillPaidPayment(payment);
            return;
        }

        payment.setStatus("PAID");
        payment.setTransactionCode(reference);
        payment.setPaidAt(LocalDateTime.now());
        paymentRepository.save(payment);

        fulfillPaidPayment(payment);
    }

    private void fulfillPaidPayment(Payment payment) {
        if (PAYMENT_TYPE_PERSONAL_AI_USAGE_TOP_UP.equals(payment.getPaymentType())) {
            if (payment.getFulfilledAt() != null) return;
            int minutes = payment.getTopUpMinutes() != null && payment.getTopUpMinutes() > 0
                    ? payment.getTopUpMinutes()
                    : PERSONAL_AI_USAGE_TOP_UP_MINUTES;
            personalAiUsageService.applyPurchasedTopUp(
                    payment.getUserId(), payment.getOrderCode(), minutes);
            payment.setFulfilledAt(LocalDateTime.now());
            paymentRepository.save(payment);
            log.info("Added {} AI minutes for personal user {} from order {}",
                    minutes, payment.getUserId(), payment.getOrderCode());
            return;
        }

        if (PAYMENT_TYPE_AI_USAGE_TOP_UP.equals(payment.getPaymentType())) {
            if (payment.getFulfilledAt() != null) return;
            int minutes = payment.getTopUpMinutes() != null && payment.getTopUpMinutes() > 0
                    ? payment.getTopUpMinutes()
                    : AI_USAGE_TOP_UP_MINUTES;
            schoolAiUsageService.applyPurchasedTopUp(
                    payment.getUserId(), payment.getOrderCode(), minutes);
            payment.setFulfilledAt(LocalDateTime.now());
            paymentRepository.save(payment);
            log.info("Added {} AI minutes for school {} from order {}",
                    minutes, payment.getSchoolId(), payment.getOrderCode());
            return;
        }

        if (payment.getActivatedSubscriptionId() != null) {
            provisionSchoolIfNeeded(payment, null);
            return;
        }

        Subscription subscription = subscriptionService.createSubscription(
                payment.getUserId(), payment.getSubscriptionId(), payment.getOrganizationName());
        payment.setActivatedSubscriptionId(subscription.getId());
        paymentRepository.save(payment);
        provisionSchoolIfNeeded(payment, subscription);
        log.info("Subscription created for user {} and package {}", payment.getUserId(), payment.getSubscriptionId());
    }

    private Long generateOrderCode() {
        for (int attempt = 0; attempt < 20; attempt++) {
            long timestamp = new Date().getTime();
            long random = new Random().nextInt(100000);
            String code = String.valueOf(timestamp).substring(4) + String.format("%05d", random);
            Long orderCode = Long.parseLong(code);
            if (paymentRepository.findByOrderCode(orderCode).isEmpty()) {
                return orderCode;
            }
        }
        throw new RuntimeException("Could not generate unique order code");
    }

    private void provisionSchoolIfNeeded(Payment payment, Subscription subscription) {
        ServicePackage servicePackage = servicePackageRepository.findById(payment.getSubscriptionId()).orElse(null);
        if (servicePackage == null || !SchoolService.isSchoolPlan(servicePackage.getPlanType())) {
            return;
        }

        Subscription targetSubscription = subscription;
        if (targetSubscription == null && payment.getActivatedSubscriptionId() != null) {
            targetSubscription = subscriptionRepository.findById(payment.getActivatedSubscriptionId()).orElse(null);
        }
        if (targetSubscription == null) {
            targetSubscription = subscriptionService.getCurrentSubscription(payment.getUserId()).orElse(null);
        }
        if (targetSubscription == null) {
            return;
        }

        schoolService.provisionSchoolForSubscription(
                payment.getUserId(),
                targetSubscription,
                servicePackage,
                payment.getOrganizationName()
        );
    }

    private String resolveOrganizationName(String name, String fallbackName) {
        String trimmed = name == null ? "" : name.trim();
        if (!trimmed.isEmpty()) return trimmed;
        String fallback = fallbackName == null ? "" : fallbackName.trim();
        return fallback.isEmpty() ? "Signify School" : fallback;
    }
}
