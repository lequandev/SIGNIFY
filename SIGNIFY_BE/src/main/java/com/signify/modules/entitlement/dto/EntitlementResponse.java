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
public class EntitlementResponse {
    String plan;
    String planType;
    String packageName;
    Boolean fullFeatures;
    Boolean unlimited;
    String usageScope;
    Integer dailyUsageLimitMinutes;
    Integer usedMinutesToday;
    Integer remainingMinutesToday;
    LocalDateTime dailyUsageResetsAt;
    Integer monthlyAiLimitMinutes;
    Integer usedAiMinutesThisPeriod;
    Integer remainingAiMinutesThisPeriod;
    LocalDateTime aiUsagePeriodEndsAt;
    LocalDateTime expiresAt;
    String organizationName;
}
