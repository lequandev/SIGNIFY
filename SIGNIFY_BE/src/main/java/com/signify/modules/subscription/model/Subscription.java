package com.signify.modules.subscription.model;

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
@Document(collection = "subscriptions")
public class Subscription {
    @Id
    String id;

    String userId;

    String packageId;

    LocalDateTime startDate;

    LocalDateTime endDate;

    String status;

    @CreatedDate
    LocalDateTime createdAt;
}
