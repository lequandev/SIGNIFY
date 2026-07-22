package com.signify.modules.tracking.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class WatchHistoryResponse {
    String id;
    String userId;
    String userName;
    String role;
    String youtubeVideoId;
    String videoTitle;
    String videoUrl;
    String channelName;
    Long videoDurationSeconds;
    Long totalWatchedSeconds;
    Long furthestPositionSeconds;
    Integer completionPercent;
    Integer viewCount;
    LocalDateTime firstWatchedAt;
    LocalDateTime lastWatchedAt;
    String source;
}
