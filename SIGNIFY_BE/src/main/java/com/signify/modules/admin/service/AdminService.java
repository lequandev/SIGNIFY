package com.signify.modules.admin.service;

import com.signify.modules.admin.dto.response.AdminSubscriptionResponse;
import com.signify.modules.admin.dto.response.AdminUserResponse;
import com.signify.modules.subscription.model.ServicePackage;
import com.signify.modules.subscription.model.Subscription;
import com.signify.modules.subscription.repository.ServicePackageRepository;
import com.signify.modules.subscription.repository.SubscriptionRepository;
import com.signify.modules.school.model.School;
import com.signify.modules.school.repository.SchoolRepository;
import com.signify.modules.school.repository.SchoolMembershipRepository;
import com.signify.modules.classroom.repository.ClassroomRepository;
import com.signify.modules.assignment.repository.AssignmentProgressRepository;
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
    private final SchoolRepository schoolRepository;
    private final SchoolMembershipRepository schoolMembershipRepository;
    private final ClassroomRepository classroomRepository;
    private final AssignmentProgressRepository progressRepository;

    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalPackages", packageRepository.count());
        stats.put("totalSubscriptions", subscriptionRepository.count());
        stats.put("totalSchools", schoolRepository.count());
        stats.put("totalTeachers", schoolMembershipRepository.countByRole("TEACHER"));
        stats.put("totalStudents", schoolMembershipRepository.countByRole("STUDENT"));
        stats.put("totalClasses", classroomRepository.count());
        stats.put("completedLessons", progressRepository.countByStatus("COMPLETED"));
        // For revenue, we could sum up payments later, but for now let's just count
        return stats;
    }

    public List<School> getSchools() {
        return schoolRepository.findAll();
    }

    public School updateSchoolStatus(String schoolId, String status) {
        School school = schoolRepository.findById(schoolId)
                .orElseThrow(() -> new RuntimeException("School not found"));
        String normalized = status == null ? "" : status.trim().toUpperCase();
        if (!"ACTIVE".equals(normalized) && !"INACTIVE".equals(normalized)) {
            throw new RuntimeException("Invalid school status");
        }
        school.setStatus(normalized);
        return schoolRepository.save(school);
    }

    public List<AdminUserResponse> getAllUsers() {
        return userRepository.findAll().stream().map(AdminUserResponse::from).toList();
    }

    public List<AdminSubscriptionResponse> getSubscriptions() {
        return subscriptionRepository.findAll()
                .stream()
                .map(this::toAdminSubscriptionResponse)
                .toList();
    }

    public AdminUserResponse updateUser(String id, Map<String, String> updates) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (updates.containsKey("role")) {
            user.setRole(updates.get("role"));
        }
        if (updates.containsKey("status")) {
            user.setStatus(updates.get("status"));
        }

        return AdminUserResponse.from(userRepository.save(user));
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
