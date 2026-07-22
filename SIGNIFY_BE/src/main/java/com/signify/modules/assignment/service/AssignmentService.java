package com.signify.modules.assignment.service;

import com.signify.modules.assignment.dto.AssignmentView;
import com.signify.modules.assignment.model.Assignment;
import com.signify.modules.assignment.model.AssignmentProgress;
import com.signify.modules.assignment.repository.AssignmentProgressRepository;
import com.signify.modules.assignment.repository.AssignmentRepository;
import com.signify.modules.assignment.util.YoutubeVideoIdExtractor;
import com.signify.modules.classroom.model.ClassEnrollment;
import com.signify.modules.classroom.model.Classroom;
import com.signify.modules.classroom.repository.ClassEnrollmentRepository;
import com.signify.modules.classroom.repository.ClassroomRepository;
import com.signify.modules.school.service.SchoolService;
import com.signify.modules.tracking.model.History;
import com.signify.modules.tracking.repository.HistoryRepository;
import com.signify.modules.tracking.service.WatchHistoryService;
import com.signify.modules.user.model.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final AssignmentProgressRepository progressRepository;
    private final ClassroomRepository classroomRepository;
    private final ClassEnrollmentRepository enrollmentRepository;
    private final SchoolService schoolService;
    private final HistoryRepository historyRepository;
    private final WatchHistoryService watchHistoryService;

    @Transactional
    public Assignment create(String teacherId, String classId, String youtubeUrl, String title,
                             String description, LocalDateTime dueDate) {
        Classroom classroom = requireTeacherClass(teacherId, classId);
        String videoId = YoutubeVideoIdExtractor.extract(youtubeUrl);
        Assignment assignment = assignmentRepository.save(Assignment.builder()
                .classId(classId)
                .teacherId(teacherId)
                .youtubeVideoId(videoId)
                .title(title == null || title.isBlank() ? videoId : title.trim())
                .description(description)
                .dueDate(dueDate)
                .status("ACTIVE")
                .createdAt(LocalDateTime.now())
                .build());

        for (ClassEnrollment enrollment : enrollmentRepository.findByClassIdAndStatus(classId, "ACTIVE")) {
            progressRepository.save(AssignmentProgress.builder()
                    .assignmentId(assignment.getId())
                    .studentId(enrollment.getStudentId())
                    .youtubeVideoId(videoId)
                    .status("ASSIGNED")
                    .watchedSeconds(0)
                    .updatedAt(LocalDateTime.now())
                    .build());
        }
        return assignment;
    }

    public List<AssignmentView> getByClass(String userId, String classId) {
        requireTeacherClass(userId, classId);
        return assignmentRepository.findByClassIdOrderByCreatedAtDesc(classId).stream()
                .map(assignment -> AssignmentView.from(assignment, null))
                .toList();
    }

    public List<AssignmentView> getMyAssignments(String studentId, String statusFilter) {
        requireStudent(studentId);
        List<String> classIds = enrollmentRepository.findByStudentIdAndStatus(studentId, "ACTIVE")
                .stream().map(ClassEnrollment::getClassId).toList();
        if (classIds.isEmpty()) return List.of();
        List<Assignment> assignments = assignmentRepository.findByClassIdIn(classIds);
        Set<String> assignmentIds = assignments.stream().map(Assignment::getId).collect(Collectors.toSet());
        Map<String, AssignmentProgress> progress = progressRepository.findByAssignmentIdInAndStudentId(assignmentIds, studentId)
                .stream().collect(Collectors.toMap(AssignmentProgress::getAssignmentId, p -> p));
        return assignments.stream()
                .map(a -> AssignmentView.from(a, progress.get(a.getId())))
                .filter(view -> statusFilter == null || statusFilter.isBlank() || statusFilter.equalsIgnoreCase(view.getProgressStatus()))
                .sorted(Comparator.comparing((AssignmentView v) -> "COMPLETED".equals(v.getProgressStatus()))
                        .thenComparing(AssignmentView::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }

    public List<AssignmentProgress> getProgress(String teacherId, String assignmentId) {
        Assignment assignment = requireAssignment(assignmentId);
        requireTeacherClass(teacherId, assignment.getClassId());
        return progressRepository.findByAssignmentId(assignmentId);
    }

    @Transactional
    public AssignmentProgress start(String studentId, String assignmentId) {
        AssignmentProgress progress = requireStudentProgress(studentId, assignmentId);
        if ("ASSIGNED".equals(progress.getStatus())) {
            progress.setStatus("IN_PROGRESS");
            progress.setStartedAt(LocalDateTime.now());
        }
        progress.setUpdatedAt(LocalDateTime.now());
        return progressRepository.save(progress);
    }

    @Transactional
    public AssignmentProgress complete(String studentId, String assignmentId, Integer watchedSeconds) {
        AssignmentProgress progress = requireStudentProgress(studentId, assignmentId);
        LocalDateTime now = LocalDateTime.now();
        progress.setStatus("COMPLETED");
        progress.setCompletedAt(now);
        progress.setUpdatedAt(now);
        if (watchedSeconds != null && watchedSeconds >= 0) progress.setWatchedSeconds(watchedSeconds);
        AssignmentProgress saved = progressRepository.save(progress);
        historyRepository.save(History.builder().userId(studentId).youtubeVideoId(progress.getYoutubeVideoId()).watchedAt(now).build());
        return saved;
    }

    public List<History> getStudentHistory(String teacherId, String studentId) {
        watchHistoryService.assertCanViewStudent(teacherId, studentId);
        return historyRepository.findByUserIdOrderByWatchedAtDesc(studentId);
    }

    public List<History> getMyHistory(String studentId) {
        requireStudent(studentId);
        return historyRepository.findByUserIdOrderByWatchedAtDesc(studentId);
    }

    private AssignmentProgress requireStudentProgress(String studentId, String assignmentId) {
        requireStudent(studentId);
        return progressRepository.findByAssignmentIdAndStudentId(assignmentId, studentId)
                .orElseThrow(() -> new RuntimeException("Assignment not assigned to this student"));
    }

    private Assignment requireAssignment(String assignmentId) {
        return assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));
    }

    private Classroom requireTeacherClass(String teacherId, String classId) {
        Classroom classroom = classroomRepository.findById(classId)
                .orElseThrow(() -> new RuntimeException("Class not found"));
        SchoolService.SchoolContext context = schoolService.resolveSchoolContext(teacherId)
                .orElseThrow(() -> new RuntimeException(SchoolService.SCHOOL_NOT_FOUND));
        if (!context.school().getId().equals(classroom.getSchoolId())) {
            throw new RuntimeException(SchoolService.SCHOOL_FORBIDDEN);
        }
        if (!teacherId.equals(classroom.getTeacherId()) && !Role.SCHOOL_ADMIN.equals(context.membership().getRole())) {
            throw new RuntimeException(SchoolService.SCHOOL_FORBIDDEN);
        }
        return classroom;
    }

    private void requireStudent(String studentId) {
        SchoolService.SchoolContext context = schoolService.resolveSchoolContext(studentId)
                .orElseThrow(() -> new RuntimeException(SchoolService.SCHOOL_NOT_FOUND));
        if (!Role.STUDENT.equals(context.membership().getRole())) {
            throw new RuntimeException(SchoolService.SCHOOL_FORBIDDEN);
        }
    }
}
