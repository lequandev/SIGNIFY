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
    public ResponseEntity<PaymentResponse> createPaymentLink(@RequestBody CreatePaymentRequest request) {
        // Assume user ID is stored as the Principal name
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = (authentication != null && authentication.getName() != null) ? authentication.getName() : "anonymous";
        
        PaymentResponse response = paymentService.createPaymentLink(request, userId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/webhook")
    public ResponseEntity<ObjectNode> handleWebhook(@RequestBody ObjectNode body) {
        ObjectNode response = paymentService.handleWebhook(body);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/check-status/{orderCode}")
    public ResponseEntity<Map<String, Object>> checkStatus(@PathVariable Long orderCode) {
        return ResponseEntity.ok(paymentService.checkStatus(orderCode));
    }
}
