package com.signify.modules.entitlement.model;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.annotation.Version;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Document(collection = "school_member_daily_ai_usages")
@CompoundIndex(
        name = "school_member_ai_day_unique",
        def = "{ 'schoolId': 1, 'userId': 1, 'usageDate': 1 }",
        unique = true)
public class SchoolMemberDailyAiUsage {
    @Id
    String id;

    String schoolId;
    String userId;
    String role;
    LocalDate usageDate;
    Long limitSeconds;
    Long usedSeconds;
    Long reservedSeconds;
    Long processedVideoCount;

    @Version
    Long version;

    @CreatedDate
    LocalDateTime createdAt;

    @LastModifiedDate
    LocalDateTime updatedAt;
}
