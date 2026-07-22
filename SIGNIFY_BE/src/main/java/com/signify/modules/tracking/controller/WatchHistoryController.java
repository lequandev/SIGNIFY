package com.signify.modules.tracking.controller;

import com.signify.modules.school.service.SchoolService;
import com.signify.modules.tracking.service.WatchHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class WatchHistoryController {

    private final WatchHistoryService watchHistoryService;

    @GetMapping("/schools/me/watch-history")
    public ResponseEntity<?> getSchoolHistory(
            Authentication authentication,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String classId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            return ResponseEntity.ok(watchHistoryService.getSchoolHistory(authentication.getName(), role, userId,
                    classId, keyword, from, to, page, size));
        } catch (RuntimeException exception) {
            return handle(exception);
        }
    }

    @GetMapping("/schools/me/watch-history/summary")
    public ResponseEntity<?> getSchoolSummary(Authentication authentication) {
        try {
            return ResponseEntity.ok(watchHistoryService.getSchoolSummary(authentication.getName()));
        } catch (RuntimeException exception) {
            return handle(exception);
        }
    }

    @GetMapping("/students/{studentId}/watch-history")
    public ResponseEntity<?> getStudentHistory(
            Authentication authentication,
            @PathVariable String studentId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            return ResponseEntity.ok(watchHistoryService.getStudentHistory(authentication.getName(), studentId,
                    keyword, from, to, page, size));
        } catch (RuntimeException exception) {
            return handle(exception);
        }
    }

    @GetMapping("/students/{studentId}/watch-history/summary")
    public ResponseEntity<?> getStudentSummary(Authentication authentication, @PathVariable String studentId) {
        try {
            return ResponseEntity.ok(watchHistoryService.getStudentSummary(authentication.getName(), studentId));
        } catch (RuntimeException exception) {
            return handle(exception);
        }
    }

    @GetMapping("/me/watch-history")
    public ResponseEntity<?> getMyHistory(
            Authentication authentication,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            return ResponseEntity.ok(watchHistoryService.getMyHistory(authentication.getName(), keyword, from, to,
                    page, size));
        } catch (RuntimeException exception) {
            return handle(exception);
        }
    }

    private ResponseEntity<?> handle(RuntimeException exception) {
        if (SchoolService.SCHOOL_FORBIDDEN.equals(exception.getMessage())) {
            return ResponseEntity.status(403).body(Map.of("message", "Bạn không có quyền xem lịch sử này."));
        }
        if (SchoolService.SCHOOL_NOT_FOUND.equals(exception.getMessage())
                || "Student not found".equals(exception.getMessage())
                || "Class not found".equals(exception.getMessage())) {
            return ResponseEntity.status(404).body(Map.of("message", exception.getMessage()));
        }
        return ResponseEntity.badRequest().body(Map.of("message", exception.getMessage()));
    }
}
