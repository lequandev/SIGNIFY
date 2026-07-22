package com.signify.modules.entitlement.repository;

import com.signify.modules.entitlement.model.SchoolMemberDailyAiUsage;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface SchoolMemberDailyAiUsageRepository extends MongoRepository<SchoolMemberDailyAiUsage, String> {
    Optional<SchoolMemberDailyAiUsage> findBySchoolIdAndUserIdAndUsageDate(
            String schoolId, String userId, LocalDate usageDate);

    List<SchoolMemberDailyAiUsage> findBySchoolIdAndUsageDateOrderByUsedSecondsDesc(
            String schoolId, LocalDate usageDate);
}
