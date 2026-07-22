package com.signify.modules.entitlement.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AiVideoAuthorizationRequest {
    @NotBlank
    String videoId;

    @Min(1)
    @Max(43200)
    Long durationSeconds;

    String videoTitle;
    String videoUrl;
    String channelName;
}
