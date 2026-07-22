package com.signify.modules.entitlement.repository;

import com.signify.modules.entitlement.model.AiVideoProcessing;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AiVideoProcessingRepository extends MongoRepository<AiVideoProcessing, String> {
    Optional<AiVideoProcessing> findByProcessingKey(String processingKey);
    List<AiVideoProcessing> findByStatusAndExpiresAtBefore(String status, LocalDateTime expiresAt);
    List<AiVideoProcessing> findByChargedSchoolIdAndStatusAndCompletedAtBetweenOrderByCompletedAtDesc(
            String schoolId, String status, LocalDateTime from, LocalDateTime to);
}
