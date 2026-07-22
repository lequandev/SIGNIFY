package com.signify.modules.school.controller;

import com.signify.modules.school.service.SchoolService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/school-invitations")
@RequiredArgsConstructor
public class SchoolInvitationController {

    private final SchoolService schoolService;

    @GetMapping("/{token}")
    public ResponseEntity<?> getInvitation(@PathVariable String token, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("message", "Vui lòng đăng nhập trước khi xem lời mời."));
        }
        try {
            return ResponseEntity.ok(schoolService.getTeacherInvitation(authentication.getName(), token));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", e.getMessage() == null ? "Không tìm thấy lời mời." : e.getMessage()));
        }
    }

    @PostMapping("/{token}/accept")
    public ResponseEntity<?> accept(@PathVariable String token, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("message", "Vui lòng đăng nhập trước khi nhận lời mời."));
        }
        try {
            return ResponseEntity.ok(schoolService.acceptTeacherInvitation(authentication.getName(), token));
        } catch (RuntimeException e) {
            if (e instanceof com.signify.modules.school.exception.SchoolConflictException conflict) {
                return ResponseEntity.status(409).body(Map.of("code", conflict.getCode(), "message", conflict.getMessage()));
            }
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage() == null ? "Không thể nhận lời mời." : e.getMessage()));
        }
    }
}
