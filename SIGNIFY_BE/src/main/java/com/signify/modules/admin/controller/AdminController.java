package com.signify.modules.admin.controller;

import com.signify.modules.admin.dto.response.AdminSubscriptionResponse;
import com.signify.modules.admin.service.AdminService;
import com.signify.modules.user.model.User;
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
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @GetMapping("/subscriptions")
    public ResponseEntity<List<AdminSubscriptionResponse>> getSubscriptions() {
        return ResponseEntity.ok(adminService.getSubscriptions());
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<User> updateUser(@PathVariable String id, @RequestBody Map<String, String> updates) {
        return ResponseEntity.ok(adminService.updateUser(id, updates));
    }
}
