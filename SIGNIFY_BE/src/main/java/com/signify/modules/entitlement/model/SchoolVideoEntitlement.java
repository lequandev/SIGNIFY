package com.signify.modules.entitlement.model;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.annotation.Version;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Document(collection = "school_video_entitlements")
@CompoundIndex(
        name = "school_processing_entitlement_unique",
        def = "{ 'schoolId': 1, 'processingKey': 1 }",
        unique = true)
public class SchoolVideoEntitlement {
    @Id
    String id;

    @Indexed
    String schoolId;

    @Indexed
    String videoId;

    String processingKey;
    String processingId;
    String videoTitle;
    String videoUrl;
    String channelName;
    Long durationSeconds;
    String activatedBy;
    String usageId;
    String memberDailyUsageId;
    Long chargedSeconds;
    String status;
    Boolean usageCommitted;
    Boolean memberDailyUsageCommitted;
    LocalDateTime activatedAt;

    @Version
    Long version;

    @CreatedDate
    LocalDateTime createdAt;

    @LastModifiedDate
    LocalDateTime updatedAt;
}
