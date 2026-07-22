package com.signify.modules.tracking.model;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
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
@Document(collection = "video_watch_histories")
@CompoundIndex(name = "school_user_video_unique", def = "{ 'schoolId': 1, 'userId': 1, 'youtubeVideoId': 1 }", unique = true)
public class VideoWatchHistory {
    @Id
    String id;

    @Indexed
    String schoolId;

    @Indexed
    String userId;

    String roleAtView;
    String youtubeVideoId;
    String videoTitle;
    String videoUrl;
    String channelName;
    Long videoDurationSeconds;
    Long totalWatchedSeconds;
    Long furthestPositionSeconds;
    Integer viewCount;
    LocalDateTime firstWatchedAt;
    LocalDateTime lastWatchedAt;
    String source;

    @CreatedDate
    LocalDateTime createdAt;

    @LastModifiedDate
    LocalDateTime updatedAt;
}
