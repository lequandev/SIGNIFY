package com.signify.modules.subscription.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SubscriptionResponse {
    String id;
    String packageName;
    String packageId;
    LocalDateTime startDate;
    LocalDateTime endDate;
    String status;
}
