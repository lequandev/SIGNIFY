package com.signify.modules.admin.service;

import com.signify.modules.admin.dto.response.AdminSubscriptionResponse;
import com.signify.modules.subscription.model.ServicePackage;
import com.signify.modules.subscription.model.Subscription;
import com.signify.modules.subscription.repository.ServicePackageRepository;
import com.signify.modules.subscription.repository.SubscriptionRepository;
import com.signify.modules.user.model.User;
import com.signify.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final ServicePackageRepository packageRepository;

    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalPackages", packageRepository.count());
        stats.put("totalSubscriptions", subscriptionRepository.count());
        // For revenue, we could sum up payments later, but for now let's just count
        return stats;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public List<AdminSubscriptionResponse> getSubscriptions() {
        return subscriptionRepository.findAll()
                .stream()
                .map(this::toAdminSubscriptionResponse)
                .toList();
    }

    public User updateUser(String id, Map<String, String> updates) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (updates.containsKey("role")) {
            user.setRole(updates.get("role"));
        }
        if (updates.containsKey("status")) {
            user.setStatus(updates.get("status"));
        }

        return userRepository.save(user);
    }

    private AdminSubscriptionResponse toAdminSubscriptionResponse(Subscription subscription) {
        User user = userRepository.findById(subscription.getUserId()).orElse(null);
        ServicePackage servicePackage = packageRepository.findById(subscription.getPackageId()).orElse(null);

        return AdminSubscriptionResponse.builder()
                .subscriptionId(subscription.getId())
                .userId(subscription.getUserId())
                .userName(user != null ? user.getFullName() : null)
                .userEmail(user != null ? user.getEmail() : null)
                .packageId(subscription.getPackageId())
                .packageName(servicePackage != null ? servicePackage.getName() : null)
                .planType(servicePackage != null ? servicePackage.getPlanType() : null)
                .status(subscription.getStatus())
                .startDate(subscription.getStartDate())
                .endDate(subscription.getEndDate())
                .createdAt(subscription.getCreatedAt())
                .build();
    }
}
