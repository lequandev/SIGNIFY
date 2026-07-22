package com.signify.modules.youtube.model;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Document(collection = "youtube_videos")
public class YoutubeVideo {
    @Id
    String id;

    @Indexed(unique = true)
    String videoId;

    String videoUrl;

    String title;

    String signLanguage;

    List<Map<String, Object>> signLanguageScripts;

    Boolean isProcessed;

    String createdByUserId;

    @Builder.Default
    Integer viewCount = 1;

    LocalDateTime lastAccessedAt;

    @CreatedDate
    LocalDateTime createdAt;

    @LastModifiedDate
    LocalDateTime updatedAt;
}
