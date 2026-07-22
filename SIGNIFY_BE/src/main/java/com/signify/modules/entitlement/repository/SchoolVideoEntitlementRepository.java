package com.signify.modules.entitlement.repository;

import com.signify.modules.entitlement.model.SchoolVideoEntitlement;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SchoolVideoEntitlementRepository extends MongoRepository<SchoolVideoEntitlement, String> {
    Optional<SchoolVideoEntitlement> findBySchoolIdAndProcessingKey(String schoolId, String processingKey);
    List<SchoolVideoEntitlement> findBySchoolIdAndStatusAndActivatedAtBetweenOrderByActivatedAtDesc(
            String schoolId, String status, LocalDateTime from, LocalDateTime to);
}
