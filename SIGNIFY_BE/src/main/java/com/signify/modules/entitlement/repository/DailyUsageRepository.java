package com.signify.modules.entitlement.repository;

import com.signify.modules.entitlement.model.DailyUsage;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface DailyUsageRepository extends MongoRepository<DailyUsage, String> {
    Optional<DailyUsage> findByUserIdAndUsageDate(String userId, LocalDate usageDate);
}
