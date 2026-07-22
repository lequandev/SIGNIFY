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
@Document(collection = "personal_ai_usages")
@CompoundIndex(name = "personal_ai_period_unique", def = "{ 'userId': 1, 'periodStart': 1 }", unique = true)
public class PersonalAiUsage {
    @Id
    String id;

    String userId;
    String subscriptionId;
    String packageId;
    LocalDateTime periodStart;
    LocalDateTime periodEnd;
    Long limitSeconds;
    Long additionalSeconds;
    Long usedSeconds;

    @Builder.Default
    List<Long> appliedTopUpOrderCodes = new ArrayList<>();

    @Version
    Long version;

    @CreatedDate
    LocalDateTime createdAt;

    @LastModifiedDate
    LocalDateTime updatedAt;
}
