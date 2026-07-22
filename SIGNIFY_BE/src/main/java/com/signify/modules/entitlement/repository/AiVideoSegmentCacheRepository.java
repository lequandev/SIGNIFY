package com.signify.modules.entitlement.repository;

import com.signify.modules.entitlement.model.AiVideoSegmentCache;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AiVideoSegmentCacheRepository extends MongoRepository<AiVideoSegmentCache, String> {
    Optional<AiVideoSegmentCache> findByProcessingIdAndTextHash(String processingId, String textHash);
}
