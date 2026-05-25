package com.signify.modules.ai.model;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Document(collection = "ai_processings")
public class AiProcessing {
    @Id
    String id;

    String userId;

    String youtubeVideoId;

    String subtitleText;

    String signResult;

    String aiStatus;

    Float processingTime;

    @CreatedDate
    LocalDateTime createdAt;
}
