package com.signify.modules.business.repository;

import com.signify.modules.business.model.BusinessMembership;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BusinessMembershipRepository extends MongoRepository<BusinessMembership, String> {
    Optional<BusinessMembership> findByOrganizationIdAndUserId(String organizationId, String userId);
    Optional<BusinessMembership> findFirstByUserIdAndStatus(String userId, String status);
    List<BusinessMembership> findByUserIdAndStatus(String userId, String status);
    List<BusinessMembership> findByOrganizationId(String organizationId);
    long countByOrganizationId(String organizationId);
}
