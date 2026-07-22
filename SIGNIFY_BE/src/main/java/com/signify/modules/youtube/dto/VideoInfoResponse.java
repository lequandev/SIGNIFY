package com.signify.modules.youtube.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VideoInfoResponse {
    String id;
    String videoId;
    String videoUrl;
    String title;
    String signLanguage;
    List<Map<String, Object>> signLanguageScripts;
    Boolean hasCachedScripts;
    Boolean isProcessed;
    Integer viewCount;
    LocalDateTime lastAccessedAt;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
