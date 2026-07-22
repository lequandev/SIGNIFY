package com.signify.modules.school.repository;

import com.signify.modules.school.model.SchoolMembership;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SchoolMembershipRepository extends MongoRepository<SchoolMembership, String> {
    Optional<SchoolMembership> findBySchoolIdAndUserId(String schoolId, String userId);
    Optional<SchoolMembership> findFirstByUserIdAndStatus(String userId, String status);
    List<SchoolMembership> findByUserIdAndStatus(String userId, String status);
    long deleteByUserId(String userId);
    List<SchoolMembership> findBySchoolId(String schoolId);
    List<SchoolMembership> findBySchoolIdAndRole(String schoolId, String role);
    List<SchoolMembership> findBySchoolIdAndRoleAndStatus(String schoolId, String role, String status);
    long countBySchoolId(String schoolId);
    long countBySchoolIdAndRole(String schoolId, String role);
    long countByRole(String role);
}
