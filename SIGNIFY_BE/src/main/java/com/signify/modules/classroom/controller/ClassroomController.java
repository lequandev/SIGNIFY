package com.signify.modules.classroom.controller;

import com.signify.modules.classroom.model.ClassEnrollment;
import com.signify.modules.classroom.model.Classroom;
import com.signify.modules.classroom.service.ClassroomService;
import com.signify.modules.user.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/classes")
@RequiredArgsConstructor
public class ClassroomController {

    private final ClassroomService classroomService;

    @GetMapping
    public ResponseEntity<?> getMyClasses() {
        String userId = getCurrentUserId();
        if (userId == null) return unauthorized();
        try {
            List<Classroom> classes = classroomService.getMyClasses(userId);
            return ResponseEntity.ok(classes);
        } catch (RuntimeException e) {
            return handleException(e);
        }
    }

    @PostMapping
    public ResponseEntity<?> createClass(@RequestBody Map<String, String> request) {
        String userId = getCurrentUserId();
        if (userId == null) return unauthorized();
        try {
            Classroom classroom = classroomService.createClass(
                    userId,
                    request.get("name"),
                    request.get("description")
            );
            return ResponseEntity.ok(classroom);
        } catch (RuntimeException e) {
            return handleException(e);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getClassById(@PathVariable String id) {
        String userId = getCurrentUserId();
        if (userId == null) return unauthorized();
        try {
            Classroom classroom = classroomService.getClassById(userId, id);
            return ResponseEntity.ok(classroom);
        } catch (RuntimeException e) {
            return handleException(e);
        }
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> updateClass(@PathVariable String id, @RequestBody Map<String, String> request) {
        String userId = getCurrentUserId();
        if (userId == null) return unauthorized();
        try {
            Classroom classroom = classroomService.updateClass(
                    userId, id,
                    request.get("name"),
                    request.get("description"),
                    request.get("status")
            );
            return ResponseEntity.ok(classroom);
        } catch (RuntimeException e) {
            return handleException(e);
        }
    }

    // ======== Enrollment ========

    @GetMapping("/{id}/students")
    public ResponseEntity<?> getStudentsInClass(@PathVariable String id) {
        String userId = getCurrentUserId();
        if (userId == null) return unauthorized();
        try {
            List<User> students = classroomService.getStudentsInClass(userId, id);
            // Return safe projections
            List<Map<String, Object>> response = students.stream().map(s -> Map.<String, Object>of(
                    "id", s.getId(),
                    "fullName", s.getFullName() != null ? s.getFullName() : "",
                    "email", s.getEmail() != null ? s.getEmail() : "",
                    "username", s.getUsername() != null ? s.getUsername() : "",
                    "avatarUrl", s.getAvatarUrl() != null ? s.getAvatarUrl() : "",
                    "status", s.getStatus() != null ? s.getStatus() : "ACTIVE"
            )).toList();
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return handleException(e);
        }
    }

    @PostMapping("/{id}/students")
    public ResponseEntity<?> addStudentToClass(@PathVariable String id, @RequestBody Map<String, String> request) {
        String userId = getCurrentUserId();
        if (userId == null) return unauthorized();
        try {
            ClassEnrollment enrollment = classroomService.addStudentToClass(userId, id, request.get("studentId"));
            return ResponseEntity.ok(enrollment);
        } catch (RuntimeException e) {
            return handleException(e);
        }
    }

    @DeleteMapping("/{id}/students/{studentId}")
    public ResponseEntity<?> removeStudentFromClass(@PathVariable String id, @PathVariable String studentId) {
        String userId = getCurrentUserId();
        if (userId == null) return unauthorized();
        try {
            classroomService.removeStudentFromClass(userId, id, studentId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return handleException(e);
        }
    }

    // ======== Helpers ========

    private ResponseEntity<?> unauthorized() {
        return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
    }

    private ResponseEntity<?> handleException(RuntimeException e) {
        String msg = e.getMessage();
        if ("SCHOOL_FORBIDDEN".equals(msg) || (msg != null && msg.contains("quyền"))) {
            return ResponseEntity.status(403).body(Map.of("message", msg));
        }
        if ("SCHOOL_NOT_FOUND".equals(msg) || "Class not found".equals(msg)) {
            return ResponseEntity.status(404).body(Map.of("message", msg));
        }
        return ResponseEntity.badRequest().body(Map.of("message", msg != null ? msg : "Bad request"));
    }

    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return auth.getName();
        }
        return null;
    }
}
