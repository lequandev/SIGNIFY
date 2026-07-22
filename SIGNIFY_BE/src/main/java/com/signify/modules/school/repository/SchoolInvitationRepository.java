package com.signify.modules.school.repository;

import com.signify.modules.school.model.SchoolInvitation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SchoolInvitationRepository extends MongoRepository<SchoolInvitation, String> {
    Optional<SchoolInvitation> findByToken(String token);
    Optional<SchoolInvitation> findBySchoolIdAndEmailAndStatus(String schoolId, String email, String status);
    List<SchoolInvitation> findByEmailIgnoreCaseAndStatus(String email, String status);
    List<SchoolInvitation> findBySchoolIdAndStatus(String schoolId, String status);
}
