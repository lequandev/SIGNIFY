package com.signify.modules.evaluation.repository;

import com.signify.modules.evaluation.model.Evaluation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EvaluationRepository extends MongoRepository<Evaluation, String> {
    List<Evaluation> findByClassIdOrderByCreatedAtDesc(String classId);
    List<Evaluation> findByStudentIdOrderByCreatedAtDesc(String studentId);
    long deleteByStudentId(String studentId);
}
