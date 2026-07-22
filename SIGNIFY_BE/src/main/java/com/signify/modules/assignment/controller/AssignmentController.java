package com.signify.modules.assignment.controller;

import com.signify.modules.assignment.dto.AssignmentView;
import com.signify.modules.assignment.model.AssignmentProgress;
import com.signify.modules.assignment.service.AssignmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class AssignmentController {

    private final AssignmentService assignmentService;

    @GetMapping("/classes/{classId}/assignments")
    public ResponseEntity<?> getByClass(@PathVariable String classId, Authentication authentication) {
        try { return ResponseEntity.ok(assignmentService.getByClass(authentication.getName(), classId)); }
        catch (RuntimeException e) { return handle(e); }
    }

    @PostMapping("/classes/{classId}/assignments")
    public ResponseEntity<?> create(@PathVariable String classId, @RequestBody Map<String, Object> request,
                                    Authentication authentication) {
        try {
            LocalDateTime dueDate = request.get("dueDate") == null || request.get("dueDate").toString().isBlank()
                    ? null : LocalDateTime.parse(request.get("dueDate").toString());
            return ResponseEntity.ok(assignmentService.create(authentication.getName(), classId,
                    value(request, "youtubeUrl", "youtubeVideoId"), value(request, "title", null),
                    value(request, "description", null), dueDate));
        } catch (IllegalArgumentException e) { return ResponseEntity.badRequest().body(Map.of("message", e.getMessage())); }
        catch (RuntimeException e) { return handle(e); }
    }

    @GetMapping("/assignments/{assignmentId}/progress")
    public ResponseEntity<?> getProgress(@PathVariable String assignmentId, Authentication authentication) {
        try { return ResponseEntity.ok(assignmentService.getProgress(authentication.getName(), assignmentId)); }
        catch (RuntimeException e) { return handle(e); }
    }

    @GetMapping("/assignments/my")
    public ResponseEntity<?> getMy(@RequestParam(required = false) String status, Authentication authentication) {
        try { return ResponseEntity.ok(assignmentService.getMyAssignments(authentication.getName(), status)); }
        catch (RuntimeException e) { return handle(e); }
    }

    @PostMapping("/assignments/{assignmentId}/start")
    public ResponseEntity<?> start(@PathVariable String assignmentId, Authentication authentication) {
        try { return ResponseEntity.ok(assignmentService.start(authentication.getName(), assignmentId)); }
        catch (RuntimeException e) { return handle(e); }
    }

    @PostMapping("/assignments/{assignmentId}/complete")
    public ResponseEntity<?> complete(@PathVariable String assignmentId, @RequestBody(required = false) Map<String, Object> request,
                                      Authentication authentication) {
        try {
            Integer watched = request == null || request.get("watchedSeconds") == null ? null : Integer.valueOf(request.get("watchedSeconds").toString());
            return ResponseEntity.ok(assignmentService.complete(authentication.getName(), assignmentId, watched));
        } catch (RuntimeException e) { return handle(e); }
    }

    @GetMapping("/me/history")
    public ResponseEntity<?> getMyHistory(Authentication authentication) {
        try { return ResponseEntity.ok(assignmentService.getMyHistory(authentication.getName())); }
        catch (RuntimeException e) { return handle(e); }
    }

    @GetMapping("/students/{studentId}/history")
    public ResponseEntity<?> getStudentHistory(@PathVariable String studentId, Authentication authentication) {
        try { return ResponseEntity.ok(assignmentService.getStudentHistory(authentication.getName(), studentId)); }
        catch (RuntimeException e) { return handle(e); }
    }

    private ResponseEntity<?> handle(RuntimeException e) {
        String message = e.getMessage() == null ? "Bad request" : e.getMessage();
        int status = "SCHOOL_FORBIDDEN".equals(message) ? 403 : "SCHOOL_NOT_FOUND".equals(message) ? 404 : 400;
        return ResponseEntity.status(status).body(Map.of("message", message));
    }

    private static String value(Map<String, Object> request, String primary, String fallback) {
        Object value = request.get(primary);
        if (value == null && fallback != null) value = request.get(fallback);
        return value == null ? null : value.toString();
    }
}
