package com.signify.modules.payment.controller;

import com.fasterxml.jackson.databind.node.ObjectNode;
import com.signify.modules.payment.dto.request.CreatePaymentRequest;
import com.signify.modules.payment.dto.response.PaymentResponse;
import com.signify.modules.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/create-link")
    public ResponseEntity<?> createPaymentLink(@RequestBody CreatePaymentRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        try {
            String userId = authentication.getName();
            PaymentResponse response = paymentService.createPaymentLink(request, userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/webhook")
    public ResponseEntity<ObjectNode> handleWebhook(@RequestBody ObjectNode body) {
        ObjectNode response = paymentService.handleWebhook(body);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/check-status/{orderCode}")
    public ResponseEntity<Map<String, Object>> checkStatus(@PathVariable Long orderCode) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = (authentication != null && authentication.getName() != null) ? authentication.getName() : null;

        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        return ResponseEntity.ok(paymentService.checkStatus(orderCode, userId));
    }
}
