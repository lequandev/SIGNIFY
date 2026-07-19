package com.signify.modules.business.repository;

import com.signify.modules.business.model.BusinessOrganization;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BusinessOrganizationRepository extends MongoRepository<BusinessOrganization, String> {
    Optional<BusinessOrganization> findBySubscriptionId(String subscriptionId);
    Optional<BusinessOrganization> findByOwnerUserIdAndStatus(String ownerUserId, String status);
    Optional<BusinessOrganization> findByIdAndStatus(String id, String status);
}
