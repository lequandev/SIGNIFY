package com.signify.modules.payment.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
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

    private final PayOS payOS;
    private final PaymentRepository paymentRepository;
    private final ServicePackageRepository servicePackageRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionService subscriptionService;
    private final SchoolService schoolService;

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
                .subscriptionId(servicePackage.getId())
                .organizationName(organizationName)
                .amount(amount)
                .orderCode(orderCode)
                .status("PENDING")
                .paymentMethod("PAYOS")
                .build();
        paymentRepository.save(payment);

        try {
            long price = Long.parseLong(priceClean);
            
            PaymentLinkItem item = PaymentLinkItem.builder()
                    .name(servicePackage.getName())
                    .quantity(1)
                    .price(price)
                    .build();

            String paymentDescription = "SIGNIFY" + orderCode;

            CreatePaymentLinkRequest paymentLinkRequest = CreatePaymentLinkRequest.builder()
                    .orderCode(orderCode)
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
                    .orderCode(orderCode)
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
                        provisionSchoolIfNeeded(payment, null);
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
            provisionSchoolIfNeeded(payment, null);
            return;
        }

        payment.setStatus("PAID");
        payment.setTransactionCode(reference);
        payment.setPaidAt(LocalDateTime.now());
        paymentRepository.save(payment);

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
