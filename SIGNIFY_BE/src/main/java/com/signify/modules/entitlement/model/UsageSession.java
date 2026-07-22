package com.signify.modules.entitlement.model;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Document(collection = "usage_sessions")
public class UsageSession {
    @Id
    String id;

    @Indexed
    String userId;

    @Indexed
    String schoolId;

    String roleAtView;

    LocalDateTime startedAt;

    LocalDateTime lastHeartbeatAt;

    LocalDateTime endedAt;

    String status; // ACTIVE, ENDED, EXPIRED

    Long durationSeconds;

    String source; // EXTENSION, WEB, API

    String videoId;

    String videoTitle;

    String videoUrl;

    String channelName;

    Long videoDurationSeconds;

    Long lastPositionSeconds;

    Long lastSequence;

    Long historyRecordedSeconds;

    @CreatedDate
    LocalDateTime createdAt;

    @LastModifiedDate
    LocalDateTime updatedAt;
}
