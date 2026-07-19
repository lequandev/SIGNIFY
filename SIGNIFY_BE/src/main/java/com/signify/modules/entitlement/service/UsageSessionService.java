package com.signify.modules.entitlement.service;

import com.signify.modules.entitlement.dto.EntitlementResponse;
import com.signify.modules.entitlement.dto.StartUsageSessionRequest;
import com.signify.modules.entitlement.dto.UsageSessionResponse;
import com.signify.modules.entitlement.model.UsageSession;
import com.signify.modules.entitlement.repository.UsageSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UsageSessionService {

    private static final long MAX_HEARTBEAT_GAP_SECONDS = 90;

    private final UsageSessionRepository usageSessionRepository;
    private final EntitlementService entitlementService;

    public UsageSessionResponse startSession(String userId, StartUsageSessionRequest request) {
        if (!entitlementService.canUseFeature(userId)) {
            throw new RuntimeException("FREE_DAILY_LIMIT_REACHED");
        }

        UsageSession session = UsageSession.builder()
                .userId(userId)
                .source(request.getSource() != null ? request.getSource() : "WEB")
                .videoId(request.getVideoId())
                .startedAt(LocalDateTime.now())
                .lastHeartbeatAt(LocalDateTime.now())
                .status("ACTIVE")
                .durationSeconds(0L)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
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

    public EntitlementResponse heartbeat(String userId, String sessionId) {
        UsageSession session = usageSessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if (!"ACTIVE".equals(session.getStatus())) {
            throw new RuntimeException("Session is not active");
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime lastBeat = session.getLastHeartbeatAt() != null ? session.getLastHeartbeatAt() : session.getStartedAt();
        long gapSeconds = Duration.between(lastBeat, now).getSeconds();
        long addSeconds = Math.min(gapSeconds, MAX_HEARTBEAT_GAP_SECONDS);

        session.setDurationSeconds((session.getDurationSeconds() != null ? session.getDurationSeconds() : 0L) + addSeconds);
        session.setLastHeartbeatAt(now);
        session.setUpdatedAt(now);
        usageSessionRepository.save(session);

        entitlementService.recordUsage(userId, addSeconds);
        return entitlementService.getEntitlement(userId);
    }

    public EntitlementResponse endSession(String userId, String sessionId) {
        UsageSession session = usageSessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if ("ENDED".equals(session.getStatus())) {
            return entitlementService.getEntitlement(userId);
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime lastBeat = session.getLastHeartbeatAt() != null ? session.getLastHeartbeatAt() : session.getStartedAt();
        long gapSeconds = Duration.between(lastBeat, now).getSeconds();
        long addSeconds = Math.min(gapSeconds, MAX_HEARTBEAT_GAP_SECONDS);

        session.setDurationSeconds((session.getDurationSeconds() != null ? session.getDurationSeconds() : 0L) + addSeconds);
        session.setEndedAt(now);
        session.setStatus("ENDED");
        session.setUpdatedAt(now);
        usageSessionRepository.save(session);

        entitlementService.recordUsage(userId, addSeconds);
        return entitlementService.getEntitlement(userId);
    }
}
