package com.signify.modules.payment.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.signify.modules.payment.dto.request.CreatePaymentRequest;
import com.signify.modules.payment.dto.response.PaymentResponse;
import com.signify.modules.payment.model.Payment;
import com.signify.modules.payment.repository.PaymentRepository;
import com.signify.modules.subscription.model.ServicePackage;
import com.signify.modules.subscription.repository.ServicePackageRepository;
import com.signify.modules.subscription.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.payos.PayOS;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;
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
    private final SubscriptionService subscriptionService;

    @Value("${payos.return-url}")
    private String returnUrl;

    @Value("${payos.cancel-url}")
    private String cancelUrl;

    @Transactional
    public PaymentResponse createPaymentLink(CreatePaymentRequest request, String userId) {
        ServicePackage servicePackage = servicePackageRepository.findById(request.getPackageId())
                .orElseThrow(() -> new RuntimeException("Package not found"));

        // Generate unique orderCode (must be less than 9007199254740991)
        Long orderCode = generateOrderCode();

        // Create Payment record
        Payment payment = Payment.builder()
                .userId(userId)
                .subscriptionId(servicePackage.getId())
                .amount(servicePackage.getPrice())
                .orderCode(orderCode)
                .status("PENDING")
                .paymentMethod("PAYOS")
                .build();
        paymentRepository.save(payment);

        try {
            long price = servicePackage.getPrice().longValue();
            PaymentLinkItem item = PaymentLinkItem.builder()
                    .name(servicePackage.getName())
                    .quantity(1)
                    .price(price)
                    .build();

            CreatePaymentLinkRequest paymentLinkRequest = CreatePaymentLinkRequest.builder()
                    .orderCode(orderCode)
                    .amount(price)
                    .description("Signify " + servicePackage.getName())
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
                    .description(data.getDescription())
                    .build();
        } catch (Exception e) {
            log.error("Error creating PayOS payment link: ", e);
            throw new RuntimeException("Could not create payment link: " + e.getMessage());
        }
    }

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
                    if ("00".equals(code) || "PAID".equalsIgnoreCase(code) || "SUCCESS".equalsIgnoreCase(code)) {
                        payment.setStatus("PAID");
                        payment.setTransactionCode(reference);
                        payment.setPaidAt(LocalDateTime.now());
                        paymentRepository.save(payment);
                        
                        // Create subscription for the user
                        subscriptionService.createSubscription(payment.getUserId(), payment.getSubscriptionId());
                        log.info("Subscription created for user {} and package {}", payment.getUserId(), payment.getSubscriptionId());
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

    public Map<String, Object> checkStatus(Long orderCode) {
        Optional<Payment> payment = paymentRepository.findByOrderCode(orderCode);
        if (payment.isPresent()) {
            return Map.of("status", payment.get().getStatus().toLowerCase()); // paid, cancelled, pending
        }
        return Map.of("status", "not_found");
    }

    private Long generateOrderCode() {
        // Simple generation based on timestamp + random to ensure uniqueness and fit in Long
        long timestamp = new Date().getTime();
        long random = new Random().nextInt(1000);
        String code = String.valueOf(timestamp).substring(4) + random;
        return Long.parseLong(code);
    }
}
