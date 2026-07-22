package com.signify.modules.entitlement.controller;

import com.signify.modules.entitlement.dto.EntitlementResponse;
import com.signify.modules.entitlement.dto.HeartbeatUsageRequest;
import com.signify.modules.entitlement.dto.StartUsageSessionRequest;
import com.signify.modules.entitlement.dto.UsageSessionResponse;
import com.signify.modules.entitlement.service.UsageSessionService;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/usage-sessions")
@RequiredArgsConstructor
public class UsageSessionController {

    private final UsageSessionService usageSessionService;

    @PostMapping("/start")
    public ResponseEntity<?> startSession(@RequestBody StartUsageSessionRequest request) {
        String userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        try {
            UsageSessionResponse response = usageSessionService.startSession(userId, request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            if ("FREE_DAILY_LIMIT_REACHED".equals(e.getMessage())) {
                return ResponseEntity.status(403).body(Map.of(
                        "code", "FREE_DAILY_LIMIT_REACHED",
                        "message", "Bạn đã dùng hết 20 phút miễn phí hôm nay. Vui lòng nâng cấp gói để tiếp tục."
                ));
            }
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{sessionId}/heartbeat")
    public ResponseEntity<?> heartbeat(@PathVariable String sessionId,
                                       @Valid @RequestBody(required = false) HeartbeatUsageRequest request) {
        String userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        try {
            EntitlementResponse response = usageSessionService.heartbeat(userId, sessionId, request);
            if (Boolean.FALSE.equals(response.getUnlimited())
                    && response.getRemainingMinutesToday() != null
                    && response.getRemainingMinutesToday() <= 0) {
                return ResponseEntity.status(403).body(Map.of(
                        "code", "FREE_DAILY_LIMIT_REACHED",
                        "message", "Bạn đã dùng hết 20 phút miễn phí hôm nay. Vui lòng nâng cấp gói để tiếp tục.",
                        "entitlement", response
                ));
            }
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{sessionId}/end")
    public ResponseEntity<?> endSession(@PathVariable String sessionId,
                                        @Valid @RequestBody(required = false) HeartbeatUsageRequest request) {
        String userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        try {
            EntitlementResponse response = usageSessionService.endSession(userId, sessionId, request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return auth.getName();
        }
        return null;
    }
}
