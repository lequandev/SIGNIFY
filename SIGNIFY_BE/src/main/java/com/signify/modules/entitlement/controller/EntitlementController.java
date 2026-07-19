package com.signify.modules.entitlement.controller;

import com.signify.modules.entitlement.dto.EntitlementResponse;
import com.signify.modules.entitlement.dto.RecordUsageRequest;
import com.signify.modules.entitlement.service.EntitlementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/entitlements")
@RequiredArgsConstructor
public class EntitlementController {

    private final EntitlementService entitlementService;

    @GetMapping("/me")
    public ResponseEntity<?> getMyEntitlement() {
        String userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        return ResponseEntity.ok(entitlementService.getEntitlement(userId));
    }

    @PostMapping("/usage")
    public ResponseEntity<?> recordUsage(@Valid @RequestBody RecordUsageRequest request) {
        String userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        EntitlementResponse response = entitlementService.recordUsage(userId, request.getUsedSeconds());
        return ResponseEntity.ok(response);
    }

    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return auth.getName();
        }
        return null;
    }
}
