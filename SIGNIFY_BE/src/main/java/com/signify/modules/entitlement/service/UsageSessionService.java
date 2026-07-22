package com.signify.modules.entitlement.service;

import com.signify.modules.entitlement.dto.EntitlementResponse;
import com.signify.modules.entitlement.dto.HeartbeatUsageRequest;
import com.signify.modules.entitlement.dto.StartUsageSessionRequest;
import com.signify.modules.entitlement.dto.UsageSessionResponse;
import com.signify.modules.entitlement.model.UsageSession;
import com.signify.modules.entitlement.repository.UsageSessionRepository;
import com.signify.modules.school.service.SchoolService;
import com.signify.modules.tracking.service.WatchHistoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
@Slf4j
@Service
@RequiredArgsConstructor
public class UsageSessionService {

    private static final long MAX_HEARTBEAT_GAP_SECONDS = 90;

    private final UsageSessionRepository usageSessionRepository;
    private final EntitlementService entitlementService;
    private final SchoolService schoolService;
    private final WatchHistoryService watchHistoryService;

    public UsageSessionResponse startSession(String userId, StartUsageSessionRequest request) {
        if (!entitlementService.canStartUsageSession(userId)) {
            throw new RuntimeException("FREE_DAILY_LIMIT_REACHED");
        }

        LocalDateTime now = LocalDateTime.now();
        SchoolService.SchoolContext schoolContext = schoolService.resolveSchoolContext(userId).orElse(null);
        UsageSession session = UsageSession.builder()
                .userId(userId)
                .schoolId(schoolContext == null ? null : schoolContext.school().getId())
                .roleAtView(schoolContext == null ? null : schoolContext.membership().getRole())
                .source(normalizeSource(request.getSource()))
                .videoId(trimToNull(request.getVideoId()))
                .videoTitle(trimToNull(request.getVideoTitle()))
                .videoUrl(trimToNull(request.getVideoUrl()))
                .channelName(trimToNull(request.getChannelName()))
                .videoDurationSeconds(nonNegative(request.getVideoDurationSeconds()))
                .startedAt(now)
                .lastHeartbeatAt(now)
                .status("ACTIVE")
                .durationSeconds(0L)
                .lastPositionSeconds(0L)
                .lastSequence(-1L)
                .historyRecordedSeconds(0L)
                .createdAt(now)
                .updatedAt(now)
                .build();

        session = usageSessionRepository.save(session);
        EntitlementResponse entitlement = entitlementService.getEntitlement(userId);

        return UsageSessionResponse.builder()
                .sessionId(session.getId())
                .status(session.getStatus())
                .startedAt(session.getStartedAt())
                .entitlement(entitlement)
                .build();
    }

    public EntitlementResponse heartbeat(String userId, String sessionId, HeartbeatUsageRequest request) {
        UsageSession session = usageSessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if (!"ACTIVE".equals(session.getStatus())) {
            throw new RuntimeException("Session is not active");
        }

        long addSeconds = updateSessionProgress(session, request, LocalDateTime.now());
        persistUsage(userId, session, addSeconds);
        return entitlementService.getEntitlement(userId);
    }

    public EntitlementResponse endSession(String userId, String sessionId, HeartbeatUsageRequest request) {
        UsageSession session = usageSessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if ("ENDED".equals(session.getStatus())) {
            return entitlementService.getEntitlement(userId);
        }

        LocalDateTime now = LocalDateTime.now();
        long addSeconds = updateSessionProgress(session, request, now);
        session.setEndedAt(now);
        session.setStatus("ENDED");
        session.setUpdatedAt(now);
        persistUsage(userId, session, addSeconds);
        return entitlementService.getEntitlement(userId);
    }

    private long updateSessionProgress(UsageSession session, HeartbeatUsageRequest request, LocalDateTime now) {
        if (request != null && request.getSequence() != null
                && request.getSequence() <= safe(session.getLastSequence(), -1L)) {
            return 0;
        }
        if (request != null && request.getPlayedSecondsDelta() != null
                && "EXTENSION".equalsIgnoreCase(session.getSource())
                && request.getSequence() == null) {
            throw new RuntimeException("Heartbeat sequence is required");
        }

        long addSeconds;
        if (request != null && request.getPlayedSecondsDelta() != null) {
            LocalDateTime lastBeat = session.getLastHeartbeatAt() != null
                    ? session.getLastHeartbeatAt() : session.getStartedAt();
            long elapsedSeconds = Math.max(0, Duration.between(lastBeat, now).getSeconds());
            long maximumPlausiblePlayback = Math.min(MAX_HEARTBEAT_GAP_SECONDS,
                    Math.max(5, elapsedSeconds * 2 + 5));
            addSeconds = Math.min(maximumPlausiblePlayback, Math.max(0, request.getPlayedSecondsDelta()));
            if (request.getSequence() != null) session.setLastSequence(request.getSequence());
            if (request.getCurrentPositionSeconds() != null) {
                session.setLastPositionSeconds(Math.max(0, request.getCurrentPositionSeconds()));
            }
        } else {
            LocalDateTime lastBeat = session.getLastHeartbeatAt() != null
                    ? session.getLastHeartbeatAt() : session.getStartedAt();
            long gapSeconds = Math.max(0, Duration.between(lastBeat, now).getSeconds());
            addSeconds = Math.min(gapSeconds, MAX_HEARTBEAT_GAP_SECONDS);
        }

        session.setDurationSeconds(safe(session.getDurationSeconds(), 0L) + addSeconds);
        session.setLastHeartbeatAt(now);
        session.setUpdatedAt(now);
        return addSeconds;
    }

    private void persistUsage(String userId, UsageSession session, long addSeconds) {
        usageSessionRepository.save(session);
        if (addSeconds > 0) entitlementService.recordUsage(userId, addSeconds);

        long duration = safe(session.getDurationSeconds(), 0L);
        long recorded = safe(session.getHistoryRecordedSeconds(), 0L);
        if (duration >= WatchHistoryService.MIN_WATCHED_SECONDS && duration > recorded) {
            watchHistoryService.recordProgress(session, duration - recorded, recorded == 0);
            session.setHistoryRecordedSeconds(duration);
            usageSessionRepository.save(session);
        }
    }

    private String normalizeSource(String source) {
        return source == null || source.isBlank() ? "WEB" : source.trim().toUpperCase();
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private Long nonNegative(Long value) {
        return value == null ? null : Math.max(0, value);
    }

    private long safe(Long value, long fallback) {
        return value == null ? fallback : value;
    }
}
