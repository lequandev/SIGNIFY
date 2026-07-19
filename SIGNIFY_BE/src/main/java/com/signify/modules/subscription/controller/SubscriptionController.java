package com.signify.modules.subscription.controller;

import com.signify.modules.subscription.dto.response.SubscriptionResponse;
import com.signify.modules.subscription.model.ServicePackage;
import com.signify.modules.subscription.model.Subscription;
import com.signify.modules.subscription.repository.ServicePackageRepository;
import com.signify.modules.subscription.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;
    private final ServicePackageRepository servicePackageRepository;

    @PostMapping("/subscribe")
    public ResponseEntity<?> subscribe(@RequestBody Map<String, String> request) {
        String userId = getCurrentUserId();
        String packageId = request.get("packageId");

        if (userId == null || packageId == null) {
            return ResponseEntity.badRequest().body("Invalid request: User ID or Package ID missing");
        }

        Subscription sub = subscriptionService.createSubscription(userId, packageId);
        return ResponseEntity.ok(sub);
    }

    @GetMapping("/active-plan")
    public ResponseEntity<SubscriptionResponse> getActivePlan() {
        return getMySubscription();
    }

    @GetMapping("/me")
    public ResponseEntity<SubscriptionResponse> getMySubscription() {
        String userId = getCurrentUserId();
        
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }
        
        Optional<Subscription> subOpt = subscriptionService.getCurrentSubscription(userId);
        
        if (subOpt.isPresent()) {
            Subscription sub = subOpt.get();
            ServicePackage pkg = servicePackageRepository.findById(sub.getPackageId()).orElse(null);
            
            SubscriptionResponse response = SubscriptionResponse.builder()
                    .id(sub.getId())
                    .packageId(sub.getPackageId())
                    .packageName(pkg != null ? pkg.getName() : "Unknown Package")
                    .startDate(sub.getStartDate())
                    .endDate(sub.getEndDate())
                    .status(sub.getStatus())
                    .active(true)
                    .build();
            return ResponseEntity.ok(response);
        }

        return ResponseEntity.ok(SubscriptionResponse.builder()
                .packageName("Miễn phí")
                .status("FREE")
                .active(false)
                .build());
    }

    private String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getPrincipal())) {
            return authentication.getName();
        }
        return null;
    }
}
