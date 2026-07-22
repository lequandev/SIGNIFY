package com.signify.modules.entitlement.model;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.annotation.Version;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Document(collection = "ai_video_processings")
public class AiVideoProcessing {
    @Id
    String id;

    @Indexed(unique = true)
    String processingKey;

    @Indexed
    String videoId;

    String processingVersion;
    String videoTitle;
    String videoUrl;
    String channelName;
    Long durationSeconds;
    String chargedSchoolId;
    String requestedBy;
    String usageId;
    String memberDailyUsageId;
    Long reservedSeconds;
    String status;
    Boolean usageCommitted;
    Boolean memberDailyUsageCommitted;
    LocalDateTime expiresAt;
    LocalDateTime completedAt;
    LocalDateTime failedAt;

    @Version
    Long version;

    @CreatedDate
    LocalDateTime createdAt;

    @LastModifiedDate
    LocalDateTime updatedAt;
}
