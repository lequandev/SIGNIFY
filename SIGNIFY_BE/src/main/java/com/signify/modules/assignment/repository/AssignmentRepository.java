package com.signify.modules.assignment.repository;

import com.signify.modules.assignment.model.Assignment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface AssignmentRepository extends MongoRepository<Assignment, String> {
    List<Assignment> findByClassIdOrderByCreatedAtDesc(String classId);
    List<Assignment> findByClassIdIn(Collection<String> classIds);
    long countByClassIdIn(Collection<String> classIds);
}
