package com.signify.modules.school.controller;

import com.signify.modules.school.dto.response.SchoolMemberResponse;
import com.signify.modules.school.dto.response.SchoolOverviewResponse;
import com.signify.modules.school.service.SchoolService;
import com.signify.modules.school.exception.SchoolConflictException;
import com.signify.modules.school.dto.response.SchoolInvitationResponse;
import com.signify.modules.assignment.model.AssignmentProgress;
import com.signify.modules.assignment.repository.AssignmentProgressRepository;
import com.signify.modules.assignment.repository.AssignmentRepository;
import com.signify.modules.classroom.repository.ClassroomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * School Admin endpoints for the current user's school. Replaces the legacy
 * current-school management controller.
 */
@RestController
@RequestMapping("/api/v1/schools/me")
@RequiredArgsConstructor
public class SchoolController {

    private final SchoolService schoolService;
    private final ClassroomRepository classroomRepository;
    private final AssignmentProgressRepository progressRepository;
    private final AssignmentRepository assignmentRepository;

    @GetMapping
    public ResponseEntity<?> getMySchool() {
        String userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        try {
            SchoolOverviewResponse response = schoolService.getMySchool(userId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return handleSchoolException(e);
        }
    }

    @GetMapping("/members")
    public ResponseEntity<?> getMembers(@RequestParam(value = "role", required = false) String role) {
        String userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        try {
            List<SchoolMemberResponse> response = schoolService.getMembers(userId, role);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return handleSchoolException(e);
        }
    }

    @GetMapping("/invitations")
    public ResponseEntity<?> getPendingInvitations() {
        String userId = getCurrentUserId();
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        try {
            List<SchoolInvitationResponse> response = schoolService.getPendingTeacherInvitations(userId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) { return handleSchoolException(e); }
    }

    @PatchMapping
    public ResponseEntity<?> updateSchoolName(@RequestBody Map<String, String> request) {
        String userId = getCurrentUserId();
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        try {
            return ResponseEntity.ok(schoolService.updateSchoolName(userId, request.get("name")));
        } catch (RuntimeException e) { return handleSchoolException(e); }
    }

    @PostMapping("/teachers")
    public ResponseEntity<?> inviteTeacher(@RequestBody Map<String, String> request) {
        String userId = getCurrentUserId();
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        try {
            SchoolInvitationResponse invitation = schoolService.inviteTeacher(userId, request.get("fullName"), request.get("email"));
            return ResponseEntity.status(201).body(invitation);
        } catch (RuntimeException e) { return handleSchoolException(e); }
    }

    @PostMapping("/students")
    public ResponseEntity<?> createStudent(@RequestBody Map<String, String> request) {
        String userId = getCurrentUserId();
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        try {
            SchoolService.ProvisionedMember created = schoolService.createStudent(
                    userId, request.get("fullName"), request.get("username"));
            return ResponseEntity.status(201).body(Map.of(
                    "member", created.member(), "loginId", created.loginId(), "temporaryPassword", created.temporaryPassword()));
        } catch (RuntimeException e) { return handleSchoolException(e); }
    }

    @PostMapping("/students/{studentId}/reset-password")
    public ResponseEntity<?> resetStudentPassword(@PathVariable String studentId) {
        String userId = getCurrentUserId();
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        try {
            SchoolService.StudentCredentials credentials = schoolService.resetStudentPassword(userId, studentId);
            return ResponseEntity.ok(Map.of(
                    "loginId", credentials.loginId(), "temporaryPassword", credentials.temporaryPassword()));
        } catch (RuntimeException e) { return handleSchoolException(e); }
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        String userId = getCurrentUserId();
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        try {
            SchoolService.SchoolContext context = schoolService.resolveManagedSchoolContext(userId);
            String schoolId = context.school().getId();
            long classCount = classroomRepository.countBySchoolId(schoolId);
            List<String> classIds = classroomRepository.findBySchoolId(schoolId).stream().map(c -> c.getId()).toList();
            List<String> assignmentIds = assignmentRepository.findByClassIdIn(classIds).stream().map(a -> a.getId()).toList();
            long completed = assignmentIds.isEmpty() ? 0 : progressRepository.countByAssignmentIdInAndStatus(assignmentIds, "COMPLETED");
            long progress = assignmentIds.isEmpty() ? 0 : progressRepository.countByAssignmentIdInAndStatus(assignmentIds, "ASSIGNED")
                    + progressRepository.countByAssignmentIdInAndStatus(assignmentIds, "IN_PROGRESS")
                    + completed;
            double completionRate = progress == 0 ? 0 : Math.round((completed * 10000.0 / progress)) / 100.0;
            return ResponseEntity.ok(Map.of("schoolId", schoolId, "classCount", classCount,
                    "teacherCount", schoolService.getMembers(userId, "TEACHER").size(),
                    "studentCount", schoolService.getMembers(userId, "STUDENT").size(),
                    "completionRate", completionRate));
        } catch (RuntimeException e) { return handleSchoolException(e); }
    }

    @PatchMapping("/members/{memberId}/status")
    public ResponseEntity<?> updateMemberStatus(@PathVariable String memberId,
                                                @RequestBody Map<String, String> request) {
        String userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        try {
            SchoolMemberResponse response = schoolService.updateMemberStatus(userId, memberId, request.get("status"));
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return handleSchoolException(e);
        }
    }

    @DeleteMapping("/members/{memberId}")
    public ResponseEntity<?> deleteMember(@PathVariable String memberId) {
        String userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        try {
            schoolService.deleteMember(userId, memberId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return handleSchoolException(e);
        }
    }

    private ResponseEntity<?> handleSchoolException(RuntimeException e) {
        if (e instanceof SchoolConflictException conflict) {
            return ResponseEntity.status(409).body(Map.of("code", conflict.getCode(), "message", conflict.getMessage()));
        }
        if (SchoolService.isSchoolNotFound(e) || "Class not found".equals(e.getMessage())) {
            return ResponseEntity.status(404).body(Map.of("message", "Bạn chưa thuộc trường học nào."));
        }
        if (SchoolService.isSchoolForbidden(e)) {
            return ResponseEntity.status(403).body(Map.of("message", "Bạn không có quyền quản lý trường học này."));
        }
        return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    }

    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return auth.getName();
        }
        return null;
    }
}
