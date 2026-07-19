package com.signify.modules.entitlement.repository;

import com.signify.modules.entitlement.model.UsageSession;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UsageSessionRepository extends MongoRepository<UsageSession, String> {
    Optional<UsageSession> findByIdAndUserId(String id, String userId);
    List<UsageSession> findByUserIdAndStatus(String userId, String status);
}
