package com.signify.modules.admin.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AdminSubscriptionResponse {
    String subscriptionId;
    String userId;
    String userName;
    String userEmail;
    String packageId;
    String packageName;
    String planType;
    String status;
    LocalDateTime startDate;
    LocalDateTime endDate;
    LocalDateTime createdAt;
}
