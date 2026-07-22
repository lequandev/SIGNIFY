package com.signify.modules.entitlement.repository;

import com.signify.modules.entitlement.model.PersonalAiUsage;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface PersonalAiUsageRepository extends MongoRepository<PersonalAiUsage, String> {
    Optional<PersonalAiUsage> findByUserIdAndPeriodStart(String userId, LocalDateTime periodStart);
    boolean existsByAppliedTopUpOrderCodesContaining(Long orderCode);
}
