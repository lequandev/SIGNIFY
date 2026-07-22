package com.signify.modules.admin.controller;

import com.signify.modules.admin.dto.response.AdminSubscriptionResponse;
import com.signify.modules.admin.service.AdminService;
import com.signify.modules.school.model.School;
import com.signify.modules.admin.dto.response.AdminUserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(adminService.getDashboardStats());
    }

    @GetMapping("/users")
    public ResponseEntity<List<AdminUserResponse>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @GetMapping("/subscriptions")
    public ResponseEntity<List<AdminSubscriptionResponse>> getSubscriptions() {
        return ResponseEntity.ok(adminService.getSubscriptions());
    }

    @GetMapping("/schools")
    public ResponseEntity<List<School>> getSchools() {
        return ResponseEntity.ok(adminService.getSchools());
    }

    @PatchMapping("/schools/{id}/status")
    public ResponseEntity<?> updateSchoolStatus(@PathVariable String id, @RequestBody Map<String, String> request) {
        try {
            return ResponseEntity.ok(adminService.updateSchoolStatus(id, request.get("status")));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<AdminUserResponse> updateUser(@PathVariable String id, @RequestBody Map<String, String> updates) {
        return ResponseEntity.ok(adminService.updateUser(id, updates));
    }
}
