package com.signify.modules.assignment.repository;

import com.signify.modules.assignment.model.AssignmentProgress;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface AssignmentProgressRepository extends MongoRepository<AssignmentProgress, String> {
    Optional<AssignmentProgress> findByAssignmentIdAndStudentId(String assignmentId, String studentId);
    List<AssignmentProgress> findByAssignmentId(String assignmentId);
    List<AssignmentProgress> findByAssignmentIdInAndStudentId(Collection<String> assignmentIds, String studentId);
    long deleteByStudentId(String studentId);
    long countByStatus(String status);
    long countByAssignmentIdInAndStatus(Collection<String> assignmentIds, String status);
}
