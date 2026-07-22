package com.signify.modules.entitlement.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AiUsageSummaryResponse {
    String schoolId;
    String packageName;
    LocalDateTime periodStart;
    LocalDateTime periodEnd;
    long limitSeconds;
    long additionalSeconds;
    long usedSeconds;
    long reservedSeconds;
    long remainingSeconds;
    long processedVideoCount;
    double usagePercent;
    int teacherDailyLimitMinutes;
    int studentDailyLimitMinutes;
    LocalDateTime dailyQuotaResetsAt;
    List<DailyUsagePoint> dailyUsage;
    List<MemberDailyUsage> todayMemberUsage;
    List<RecentVideoUsage> recentVideos;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class DailyUsagePoint {
        LocalDate date;
        long usedSeconds;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class RecentVideoUsage {
        String processingId;
        String videoId;
        String videoTitle;
        String channelName;
        String requestedBy;
        long durationSeconds;
        LocalDateTime completedAt;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class MemberDailyUsage {
        String userId;
        String role;
        long limitSeconds;
        long usedSeconds;
        long reservedSeconds;
        long remainingSeconds;
        long processedVideoCount;
    }
}
