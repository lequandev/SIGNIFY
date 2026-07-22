package com.signify.modules.entitlement.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class StartUsageSessionRequest {
    String source;
    String videoId;
    String videoTitle;
    String videoUrl;
    String channelName;
    Long videoDurationSeconds;
}
