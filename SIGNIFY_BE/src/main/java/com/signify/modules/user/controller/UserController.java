package com.signify.modules.user.controller;

import com.signify.modules.user.dto.ChangePasswordRequest;
import com.signify.modules.user.dto.UpdateProfileRequest;
import com.signify.modules.user.dto.UserProfileResponse;
import com.signify.modules.user.model.User;
import com.signify.modules.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile() {
        String userId = getCurrentUserId();
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        try {
            return ResponseEntity.ok(UserProfileResponse.from(userService.getProfile(userId)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        String userId = getCurrentUserId();
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        try {
            User updated = userService.updateProfile(userId, request);
            return ResponseEntity.ok(UserProfileResponse.from(updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        String userId = getCurrentUserId();
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        try {
            userService.changePassword(userId, request);
            return ResponseEntity.ok(Map.of("message", "Đổi mật khẩu thành công."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/avatar")
    public ResponseEntity<?> uploadAvatar(@RequestParam("file") MultipartFile file) {
        String userId = getCurrentUserId();
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        try {
            User updated = userService.updateAvatar(userId, file);
            return ResponseEntity.ok(UserProfileResponse.from(updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return auth.getName();
        }
        return null;
    }
}
