package com.signify.modules.admin.service;

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
}
