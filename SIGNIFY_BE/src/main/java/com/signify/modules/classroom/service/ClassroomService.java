package com.signify.modules.classroom.service;

import com.signify.modules.classroom.model.ClassEnrollment;
import com.signify.modules.classroom.model.Classroom;
import com.signify.modules.classroom.repository.ClassEnrollmentRepository;
import com.signify.modules.classroom.repository.ClassroomRepository;
import com.signify.modules.school.repository.SchoolMembershipRepository;
import com.signify.modules.school.service.SchoolService;
import com.signify.modules.user.model.Role;
import com.signify.modules.user.model.User;
import com.signify.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ClassroomService {

    private final ClassroomRepository classroomRepository;
    private final ClassEnrollmentRepository enrollmentRepository;
    private final SchoolService schoolService;
    private final SchoolMembershipRepository schoolMembershipRepository;
    private final UserRepository userRepository;

    // ======== Classroom CRUD ========

    public Classroom createClass(String teacherUserId, String name, String description) {
        SchoolService.SchoolContext context = resolveTeacherContext(teacherUserId);
        LocalDateTime now = LocalDateTime.now();
        Classroom classroom = Classroom.builder()
                .schoolId(context.school().getId())
                .teacherId(teacherUserId)
                .name(name)
                .description(description)
                .status("ACTIVE")
                .createdAt(now)
                .updatedAt(now)
                .build();
        return classroomRepository.save(classroom);
    }

    public Classroom getClassById(String teacherUserId, String classId) {
        Classroom classroom = classroomRepository.findById(classId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lớp học."));
        ensureTeacherOwnsClass(teacherUserId, classroom);
        return classroom;
    }

    public List<Classroom> getMyClasses(String teacherUserId) {
        resolveTeacherContext(teacherUserId); // ensure teacher membership
        return classroomRepository.findByTeacherId(teacherUserId);
    }

    @Transactional
    public Classroom updateClass(String teacherUserId, String classId, String name, String description, String status) {
        Classroom classroom = classroomRepository.findById(classId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lớp học."));
        ensureTeacherOwnsClass(teacherUserId, classroom);
        if (name != null && !name.isBlank()) classroom.setName(name);
        if (description != null) classroom.setDescription(description);
        if (status != null) classroom.setStatus(status.trim().toUpperCase());
        classroom.setUpdatedAt(LocalDateTime.now());
        return classroomRepository.save(classroom);
    }

    // ======== Enrollment (add/remove students) ========

    @Transactional
    public ClassEnrollment addStudentToClass(String teacherUserId, String classId, String studentId) {
        Classroom classroom = classroomRepository.findById(classId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lớp học."));
        ensureTeacherOwnsClass(teacherUserId, classroom);

        // Validate the student belongs to the same school
        schoolMembershipRepository.findBySchoolIdAndUserId(classroom.getSchoolId(), studentId)
                .filter(m -> Role.STUDENT.equals(m.getRole()))
                .orElseThrow(() -> new RuntimeException("Học sinh không thuộc trường này."));

        Optional<ClassEnrollment> existing = enrollmentRepository.findByClassIdAndStudentId(classId, studentId);
        if (existing.isPresent()) {
            ClassEnrollment enrollment = existing.get();
            if ("ACTIVE".equals(enrollment.getStatus())) {
                return enrollment; // already enrolled
            }
            enrollment.setStatus("ACTIVE");
            return enrollmentRepository.save(enrollment);
        }

        ClassEnrollment enrollment = ClassEnrollment.builder()
                .classId(classId)
                .studentId(studentId)
                .status("ACTIVE")
                .createdAt(LocalDateTime.now())
                .build();
        return enrollmentRepository.save(enrollment);
    }

    @Transactional
    public void removeStudentFromClass(String teacherUserId, String classId, String studentId) {
        Classroom classroom = classroomRepository.findById(classId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lớp học."));
        ensureTeacherOwnsClass(teacherUserId, classroom);

        ClassEnrollment enrollment = enrollmentRepository.findByClassIdAndStudentId(classId, studentId)
                .orElseThrow(() -> new RuntimeException("Học sinh không thuộc lớp này."));
        enrollment.setStatus("REMOVED");
        enrollmentRepository.save(enrollment);
    }

    public List<User> getStudentsInClass(String teacherUserId, String classId) {
        Classroom classroom = classroomRepository.findById(classId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lớp học."));
        ensureTeacherOwnsClass(teacherUserId, classroom);

        List<ClassEnrollment> enrollments = enrollmentRepository.findByClassIdAndStatus(classId, "ACTIVE");
        List<String> studentIds = enrollments.stream().map(ClassEnrollment::getStudentId).toList();
        return userRepository.findAllById(studentIds);
    }

    /**
     * Get all active class IDs that a student is enrolled in.
     */
    public List<String> getStudentClassIds(String studentId) {
        return enrollmentRepository.findByStudentIdAndStatus(studentId, "ACTIVE")
                .stream().map(ClassEnrollment::getClassId).toList();
    }

    // ======== Helpers ========

    private SchoolService.SchoolContext resolveTeacherContext(String teacherUserId) {
        SchoolService.SchoolContext context = schoolService.resolveSchoolContext(teacherUserId)
                .orElseThrow(() -> new RuntimeException("Bạn chưa thuộc trường học nào."));
        String role = context.membership().getRole();
        if (!Role.TEACHER.equals(role)) {
            throw new RuntimeException("Bạn không có quyền giáo viên.");
        }
        return context;
    }

    private void ensureTeacherOwnsClass(String teacherUserId, Classroom classroom) {
        if (!teacherUserId.equals(classroom.getTeacherId())) {
            throw new RuntimeException("Bạn không có quyền truy cập lớp này.");
        }
    }
}
