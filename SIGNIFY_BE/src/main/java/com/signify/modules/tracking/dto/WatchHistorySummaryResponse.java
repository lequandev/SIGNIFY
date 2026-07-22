package com.signify.modules.tracking.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class WatchHistorySummaryResponse {
    long totalViewers;
    long uniqueVideos;
    long totalWatchedSeconds;
    long totalViews;
}
