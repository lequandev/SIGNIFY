package com.signify.modules.classroom.repository;

import com.signify.modules.classroom.model.ClassEnrollment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClassEnrollmentRepository extends MongoRepository<ClassEnrollment, String> {
    Optional<ClassEnrollment> findByClassIdAndStudentId(String classId, String studentId);
    List<ClassEnrollment> findByClassIdAndStatus(String classId, String status);
    List<ClassEnrollment> findByStudentIdAndStatus(String studentId, String status);
    long deleteByStudentId(String studentId);
    long countByClassIdAndStatus(String classId, String status);
}
