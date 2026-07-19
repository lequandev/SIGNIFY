package com.signify.modules.subscription.service;

import com.signify.modules.subscription.model.ServicePackage;
import com.signify.modules.subscription.model.Subscription;
import com.signify.modules.subscription.repository.ServicePackageRepository;
import com.signify.modules.subscription.repository.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final ServicePackageRepository servicePackageRepository;

    @Transactional
    public Subscription createSubscription(String userId, String packageId) {
        ServicePackage servicePackage = servicePackageRepository.findById(packageId)
                .orElseThrow(() -> new RuntimeException("Package not found"));

        // Check if user already has an active subscription that is still valid
        Optional<Subscription> existingSub = getCurrentSubscription(userId);

        LocalDateTime startDate = LocalDateTime.now();
        if (existingSub.isPresent()) {
            Subscription sub = existingSub.get();
            // If already active, we might want to extend it or mark the old one as EXPIRED
            // For simplicity, let's just mark the old one as REPLACED and create a new one
            sub.setStatus("REPLACED");
            subscriptionRepository.save(sub);
        }

        // Handle Enterprise package where durationDays might be null
        Integer days = servicePackage.getDurationDays() != null ? servicePackage.getDurationDays() : 30;

        Subscription newSubscription = Subscription.builder()
                .userId(userId)
                .packageId(packageId)
                .startDate(startDate)
                .endDate(startDate.plusDays(days))
                .status("ACTIVE")
                .createdAt(LocalDateTime.now())
                .build();

        return subscriptionRepository.save(newSubscription);
    }

    public Optional<Subscription> getCurrentSubscription(String userId) {
        LocalDateTime now = LocalDateTime.now();
        Optional<Subscription> active = subscriptionRepository.findByUserIdAndStatus(userId, "ACTIVE");

        if (active.isPresent()) {
            Subscription subscription = active.get();
            if (subscription.getEndDate() != null && subscription.getEndDate().isBefore(now)) {
                subscription.setStatus("EXPIRED");
                subscriptionRepository.save(subscription);
                return Optional.empty();
            }
            return Optional.of(subscription);
        }

        return Optional.empty();
    }
}
