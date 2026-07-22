package com.signify.modules.school.model;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * A school (organization) in the education platform. Mirrors the legacy
 * organization record bound 1:1 to an education subscription.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Document(collection = "schools")
public class School {
    @Id
    String id;

    String name;

    @Indexed
    String ownerUserId;

    @Indexed(unique = true)
    String subscriptionId;

    String status;

    Integer teacherDailyAiMinutes;
    Integer studentDailyAiMinutes;

    @CreatedDate
    LocalDateTime createdAt;

    @LastModifiedDate
    LocalDateTime updatedAt;
}
