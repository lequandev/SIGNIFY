package com.signify.modules.entitlement.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PersonalAiUsageSummaryResponse {
    String userId;
    String packageName;
    LocalDateTime periodStart;
    LocalDateTime periodEnd;
    long limitSeconds;
    long additionalSeconds;
    long usedSeconds;
    long remainingSeconds;
}
