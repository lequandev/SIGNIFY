package com.signify.modules.entitlement.service;

import com.signify.modules.entitlement.dto.EntitlementResponse;
import com.signify.modules.entitlement.dto.HeartbeatUsageRequest;
import com.signify.modules.entitlement.model.UsageSession;
import com.signify.modules.entitlement.repository.UsageSessionRepository;
import com.signify.modules.school.service.SchoolService;
import com.signify.modules.tracking.service.WatchHistoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UsageSessionServiceTest {

    @Mock
    private UsageSessionRepository usageSessionRepository;
    @Mock
    private EntitlementService entitlementService;
    @Mock
    private SchoolService schoolService;
    @Mock
    private WatchHistoryService watchHistoryService;

    private UsageSessionService service;

    @BeforeEach
    void setUp() {
        service = new UsageSessionService(usageSessionRepository, entitlementService, schoolService, watchHistoryService);
    }

    @Test
    void heartbeatRecordsClientPlaybackOnceForDuplicateSequence() {
        UsageSession session = UsageSession.builder()
                .id("session-1")
                .userId("student-1")
                .schoolId("school-1")
                .roleAtView("STUDENT")
                .source("EXTENSION")
                .videoId("video-1")
                .status("ACTIVE")
                .startedAt(LocalDateTime.now().minusMinutes(1))
                .lastHeartbeatAt(LocalDateTime.now().minusSeconds(30))
                .durationSeconds(0L)
                .lastSequence(-1L)
                .historyRecordedSeconds(0L)
                .build();
        HeartbeatUsageRequest request = new HeartbeatUsageRequest(30L, 45L, 0L);
        EntitlementResponse entitlement = EntitlementResponse.builder().build();

        when(usageSessionRepository.findByIdAndUserId("session-1", "student-1"))
                .thenReturn(Optional.of(session));
        when(usageSessionRepository.save(any(UsageSession.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(entitlementService.getEntitlement("student-1")).thenReturn(entitlement);

        service.heartbeat("student-1", "session-1", request);
        service.heartbeat("student-1", "session-1", request);

        verify(entitlementService, times(1)).recordUsage("student-1", 30L);
        verify(watchHistoryService, times(1)).recordProgress(session, 30L, true);
    }
}
