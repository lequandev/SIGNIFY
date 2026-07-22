package com.signify.modules.entitlement.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SchoolDailyAiLimitRequest {
    @NotNull
    @Min(0)
    @Max(1440)
    Integer teacherDailyAiMinutes;

    @NotNull
    @Min(0)
    @Max(1440)
    Integer studentDailyAiMinutes;
}
