package com.signify.modules.entitlement.repository;

import com.signify.modules.entitlement.model.SchoolAiUsage;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface SchoolAiUsageRepository extends MongoRepository<SchoolAiUsage, String> {
    Optional<SchoolAiUsage> findBySchoolIdAndPeriodStart(String schoolId, LocalDateTime periodStart);
    boolean existsByAppliedTopUpOrderCodesContaining(Long orderCode);
}
