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
@Document(collection = "usage_logs")
public class UsageLog {
    @Id
    String id;

    String userId;

    String featureName;

    Integer usageCount;

    @CreatedDate
    LocalDateTime createdAt;
}
