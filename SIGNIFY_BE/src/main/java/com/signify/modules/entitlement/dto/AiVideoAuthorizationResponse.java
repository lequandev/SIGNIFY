package com.signify.modules.entitlement.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AiVideoAuthorizationResponse {
    boolean allowed;
    String scope;
    String processingId;
    boolean cached;
    boolean ownsProcessing;
    long chargeSeconds;
    AiUsageSummaryResponse usage;
}
