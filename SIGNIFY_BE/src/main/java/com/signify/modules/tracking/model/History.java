package com.signify.modules.tracking.model;

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
@Document(collection = "histories")
public class History {
    @Id
    String id;

    String userId;

    String youtubeVideoId;

    @CreatedDate
    LocalDateTime watchedAt;
}
