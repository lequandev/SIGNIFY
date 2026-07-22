package com.signify.modules.entitlement.controller;

import com.signify.modules.entitlement.dto.AiVideoAuthorizationRequest;
import com.signify.modules.entitlement.dto.AiVideoAuthorizationResponse;
import com.signify.modules.entitlement.dto.SchoolDailyAiLimitRequest;
import com.signify.modules.entitlement.exception.AiUsageException;
import com.signify.modules.entitlement.service.EntitlementService;
import com.signify.modules.entitlement.service.SchoolAiUsageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/ai-usage")
@RequiredArgsConstructor
public class AiUsageController {

    private final SchoolAiUsageService schoolAiUsageService;
    private final EntitlementService entitlementService;

    @PostMapping("/videos/authorize")
    public ResponseEntity<?> authorizeVideo(@Valid @RequestBody AiVideoAuthorizationRequest request) {
        String userId = getCurrentUserId();
        if (userId == null) return unauthorized();
        try {
            AiVideoAuthorizationResponse response = schoolAiUsageService.authorizeVideo(userId, request);
            if (SchoolAiUsageService.PERSONAL_SCOPE.equals(response.getScope())
                    && !entitlementService.canUseFeature(userId)) {
                return ResponseEntity.status(403).body(Map.of(
                        "code", "FREE_DAILY_LIMIT_REACHED",
                        "message", "Bạn đã dùng hết 20 phút miễn phí hôm nay. Vui lòng nâng cấp gói để tiếp tục."
                ));
            }
            return ResponseEntity.ok(response);
        } catch (AiUsageException exception) {
            return aiUsageError(exception);
        }
    }

    @PostMapping("/processings/{processingId}/complete")
    public ResponseEntity<?> completeProcessing(@PathVariable String processingId) {
        String userId = getCurrentUserId();
        if (userId == null) return unauthorized();
        try {
            return ResponseEntity.ok(schoolAiUsageService.completeProcessing(userId, processingId));
        } catch (AiUsageException exception) {
            return aiUsageError(exception);
        }
    }

    @PostMapping("/processings/{processingId}/fail")
    public ResponseEntity<?> failProcessing(@PathVariable String processingId) {
        String userId = getCurrentUserId();
        if (userId == null) return unauthorized();
        try {
            return ResponseEntity.ok(schoolAiUsageService.failProcessing(userId, processingId));
        } catch (AiUsageException exception) {
            return aiUsageError(exception);
        }
    }

    @GetMapping("/school")
    public ResponseEntity<?> getSchoolUsage() {
        String userId = getCurrentUserId();
        if (userId == null) return unauthorized();
        try {
            return ResponseEntity.ok(schoolAiUsageService.getDashboard(userId));
        } catch (AiUsageException exception) {
            return aiUsageError(exception);
        } catch (RuntimeException exception) {
            return ResponseEntity.status(403).body(Map.of(
                    "code", exception.getMessage(),
                    "message", "Bạn không có quyền xem AI Usage của trường."
            ));
        }
    }

    @PutMapping("/school/daily-limits")
    public ResponseEntity<?> updateSchoolDailyLimits(
            @Valid @RequestBody SchoolDailyAiLimitRequest request) {
        String userId = getCurrentUserId();
        if (userId == null) return unauthorized();
        try {
            return ResponseEntity.ok(schoolAiUsageService.updateDailyLimits(userId, request));
        } catch (AiUsageException exception) {
            return aiUsageError(exception);
        } catch (RuntimeException exception) {
            return ResponseEntity.status(403).body(Map.of(
                    "code", exception.getMessage(),
                    "message", "Bạn không có quyền thay đổi giới hạn AI Usage của trường."
            ));
        }
    }

    private ResponseEntity<?> aiUsageError(AiUsageException exception) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("code", exception.getCode());
        body.put("message", exception.getMessage());
        if (exception.getUsage() != null) body.put("usage", exception.getUsage());
        int status;
        if (SchoolAiUsageService.MONTHLY_LIMIT_REACHED.equals(exception.getCode())
                || SchoolAiUsageService.DAILY_LIMIT_REACHED.equals(exception.getCode())
                || SchoolAiUsageService.VIDEO_NOT_ACTIVATED.equals(exception.getCode())) {
            status = 403;
        } else if (SchoolAiUsageService.VIDEO_PROCESSING_IN_PROGRESS.equals(exception.getCode())) {
            status = 409;
        } else {
            status = 400;
        }
        return ResponseEntity.status(status).body(body);
    }

    private ResponseEntity<?> unauthorized() {
        return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
    }

    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return auth.getName();
        }
        return null;
    }
}
