package com.signify.modules.entitlement.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class HeartbeatUsageRequest {
    @Min(0)
    @Max(90)
    Long playedSecondsDelta;

    @Min(0)
    Long currentPositionSeconds;

    @Min(0)
    Long sequence;
}
