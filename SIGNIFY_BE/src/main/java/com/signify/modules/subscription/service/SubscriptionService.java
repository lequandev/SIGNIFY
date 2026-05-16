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

        // Check if user already has an active subscription
        Optional<Subscription> existingSub = subscriptionRepository.findByUserIdAndStatus(userId, "ACTIVE");
        
        LocalDateTime startDate = LocalDateTime.now();
        if (existingSub.isPresent()) {
            Subscription sub = existingSub.get();
            // If already active, we might want to extend it or mark the old one as EXPIRED
            // For simplicity, let's just mark the old one as REPLACED and create a new one
            sub.setStatus("REPLACED");
            subscriptionRepository.save(sub);
        }

        Subscription newSubscription = Subscription.builder()
                .userId(userId)
                .packageId(packageId)
                .startDate(startDate)
                .endDate(startDate.plusDays(servicePackage.getDurationDays()))
                .status("ACTIVE")
                .createdAt(LocalDateTime.now())
                .build();

        return subscriptionRepository.save(newSubscription);
    }
}
