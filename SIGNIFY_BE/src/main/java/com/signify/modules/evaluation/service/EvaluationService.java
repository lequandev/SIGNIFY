package com.signify.modules.evaluation.service;

import com.signify.modules.classroom.model.Classroom;
import com.signify.modules.classroom.repository.ClassroomRepository;
import com.signify.modules.evaluation.model.Evaluation;
import com.signify.modules.evaluation.repository.EvaluationRepository;
import com.signify.modules.school.model.SchoolMembership;
import com.signify.modules.school.repository.SchoolMembershipRepository;
import com.signify.modules.school.service.SchoolService;
import com.signify.modules.user.model.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EvaluationService {

    private final EvaluationRepository evaluationRepository;
    private final ClassroomRepository classroomRepository;
    private final SchoolMembershipRepository membershipRepository;
    private final SchoolService schoolService;

    @Transactional
    public Evaluation create(String teacherId, String classId, String studentId, Double score, String comment) {
        Classroom classroom = requireTeacherClass(teacherId, classId);
        requireStudent(classroom.getSchoolId(), studentId);
        Evaluation evaluation = Evaluation.builder()
                .schoolId(classroom.getSchoolId())
                .classId(classId)
                .studentId(studentId)
                .teacherId(teacherId)
                .score(score)
                .comment(comment)
                .createdAt(LocalDateTime.now())
                .build();
        return evaluationRepository.save(evaluation);
    }

    public List<Evaluation> getByClass(String teacherId, String classId) {
        requireTeacherClass(teacherId, classId);
        return evaluationRepository.findByClassIdOrderByCreatedAtDesc(classId);
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

    private void requireStudent(String schoolId, String studentId) {
        SchoolMembership membership = membershipRepository.findBySchoolIdAndUserId(schoolId, studentId)
                .orElseThrow(() -> new RuntimeException("Student does not belong to this school"));
        if (!Role.STUDENT.equals(membership.getRole()) || !"ACTIVE".equals(membership.getStatus())) {
            throw new RuntimeException("Student does not belong to this school");
        }
    }
}
