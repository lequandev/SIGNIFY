package com.signify.modules.entitlement.model;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.annotation.Version;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Document(collection = "school_ai_usages")
@CompoundIndex(name = "school_ai_period_unique", def = "{ 'schoolId': 1, 'periodStart': 1 }", unique = true)
public class SchoolAiUsage {
    @Id
    String id;

    String schoolId;
    String subscriptionId;
    String packageId;
    LocalDateTime periodStart;
    LocalDateTime periodEnd;
    Long limitSeconds;
    Long additionalSeconds;
    @Builder.Default
    List<Long> appliedTopUpOrderCodes = new ArrayList<>();
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
