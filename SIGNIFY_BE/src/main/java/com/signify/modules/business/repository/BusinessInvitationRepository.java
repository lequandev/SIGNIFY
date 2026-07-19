package com.signify.modules.business.repository;

import com.signify.modules.business.model.BusinessInvitation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface BusinessInvitationRepository extends MongoRepository<BusinessInvitation, String> {
    Optional<BusinessInvitation> findByToken(String token);
    Optional<BusinessInvitation> findFirstByOrganizationIdAndEmailAndStatusOrderByCreatedAtDesc(String organizationId, String email, String status);
    long countByOrganizationIdAndStatusAndExpiresAtAfter(String organizationId, String status, LocalDateTime expiresAt);
}
