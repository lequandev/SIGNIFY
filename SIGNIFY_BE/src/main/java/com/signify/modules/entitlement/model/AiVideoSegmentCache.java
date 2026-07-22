package com.signify.modules.entitlement.model;

import com.signify.modules.ai.dto.SignData;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Document(collection = "ai_video_segment_cache")
@CompoundIndex(name = "processing_segment_unique", def = "{ 'processingId': 1, 'textHash': 1 }", unique = true)
public class AiVideoSegmentCache {
    @Id
    String id;

    String processingId;
    String videoId;
    String textHash;
    List<SignData> signData;

    @CreatedDate
    LocalDateTime createdAt;
}
