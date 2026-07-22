package com.signify.modules.school.repository;

import com.signify.modules.school.model.School;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SchoolRepository extends MongoRepository<School, String> {
    Optional<School> findBySubscriptionId(String subscriptionId);
    Optional<School> findByOwnerUserIdAndStatus(String ownerUserId, String status);
    Optional<School> findByIdAndStatus(String id, String status);
    List<School> findByStatus(String status);
}
