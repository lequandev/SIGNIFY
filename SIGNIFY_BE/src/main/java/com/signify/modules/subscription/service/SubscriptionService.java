package com.signify.modules.subscription.service;

import com.signify.modules.subscription.dto.PackageRequest;
import com.signify.modules.subscription.dto.SubscribeRequest;
import com.signify.modules.subscription.model.ServicePackage;
import com.signify.modules.subscription.model.Subscription;
import com.signify.modules.subscription.repository.ServicePackageRepository;
import com.signify.modules.subscription.repository.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SubscriptionService {

    private final ServicePackageRepository packageRepository;
    private final SubscriptionRepository subscriptionRepository;

    public ServicePackage createPackage(PackageRequest request) {
        ServicePackage servicePackage = ServicePackage.builder()
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .durationDays(request.getDurationDays())
                .aiLimitPerDay(request.getAiLimitPerDay())
                .createdAt(LocalDateTime.now())
                .build();
        return packageRepository.save(servicePackage);
    }

    public List<ServicePackage> getAllPackages() {
        return packageRepository.findAll();
    }

    public Subscription subscribe(SubscribeRequest request) {
        ServicePackage servicePackage = packageRepository.findById(request.getPackageId())
                .orElseThrow(() -> new RuntimeException("Package not found"));

        // Invalidate old subscriptions if any
        subscriptionRepository.findByUserIdAndStatus(request.getUserId(), "ACTIVE")
                .ifPresent(sub -> {
                    sub.setStatus("CANCELLED");
                    subscriptionRepository.save(sub);
                });

        Subscription subscription = Subscription.builder()
                .userId(request.getUserId())
                .packageId(request.getPackageId())
                .startDate(LocalDateTime.now())
                .endDate(LocalDateTime.now().plusDays(servicePackage.getDurationDays()))
                .status("ACTIVE")
                .createdAt(LocalDateTime.now())
                .build();

        return subscriptionRepository.save(subscription);
    }

    public List<Subscription> getUserSubscriptions(String userId) {
        return subscriptionRepository.findByUserId(userId);
    }

    public ServicePackage updatePackage(String id, PackageRequest request) {
        ServicePackage servicePackage = packageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Package not found"));
        
        servicePackage.setName(request.getName());
        servicePackage.setDescription(request.getDescription());
        servicePackage.setPrice(request.getPrice());
        servicePackage.setDurationDays(request.getDurationDays());
        servicePackage.setAiLimitPerDay(request.getAiLimitPerDay());
        
        return packageRepository.save(servicePackage);
    }

    public void deletePackage(String id) {
        packageRepository.deleteById(id);
    }
}
