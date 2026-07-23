package com.signify.modules.entitlement.service;

import com.signify.modules.entitlement.dto.AiVideoAuthorizationRequest;
import com.signify.modules.entitlement.dto.AiVideoAuthorizationResponse;
import com.signify.modules.entitlement.exception.AiUsageException;
import com.signify.modules.entitlement.model.AiVideoProcessing;
import com.signify.modules.entitlement.model.SchoolAiUsage;
import com.signify.modules.entitlement.model.SchoolMemberDailyAiUsage;
import com.signify.modules.entitlement.model.SchoolVideoEntitlement;
import com.signify.modules.entitlement.repository.AiVideoProcessingRepository;
import com.signify.modules.entitlement.repository.SchoolAiUsageRepository;
import com.signify.modules.entitlement.repository.SchoolMemberDailyAiUsageRepository;
import com.signify.modules.entitlement.repository.SchoolVideoEntitlementRepository;
import com.signify.modules.school.model.School;
import com.signify.modules.school.model.SchoolMembership;
import com.signify.modules.school.service.SchoolService;
import com.signify.modules.subscription.model.ServicePackage;
import com.signify.modules.subscription.model.Subscription;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SchoolAiUsageServiceTest {

    @Mock private SchoolAiUsageRepository usageRepository;
    @Mock private SchoolMemberDailyAiUsageRepository memberDailyUsageRepository;
    @Mock private AiVideoProcessingRepository processingRepository;
    @Mock private SchoolVideoEntitlementRepository videoEntitlementRepository;
    @Mock private SchoolService schoolService;

    private SchoolAiUsageService service;
    private SchoolService.SchoolContext context;
    private SchoolAiUsage usage;
    private SchoolMemberDailyAiUsage memberDailyUsage;

    @BeforeEach
    void setUp() {
        service = new SchoolAiUsageService(
                usageRepository, memberDailyUsageRepository, processingRepository,
                videoEntitlementRepository, schoolService);
        LocalDateTime start = LocalDateTime.now().minusDays(5);
        School school = School.builder()
                .id("school-1")
                .name("Trường Signify")
                .teacherDailyAiMinutes(120)
                .studentDailyAiMinutes(60)
                .build();
        SchoolMembership membership = SchoolMembership.builder()
                .schoolId("school-1").userId("teacher-1").role("TEACHER").status("ACTIVE").build();
        Subscription subscription = Subscription.builder()
                .id("subscription-1").packageId("package-1")
                .startDate(start).endDate(start.plusDays(180)).status("ACTIVE").build();
        ServicePackage servicePackage = ServicePackage.builder()
                .id("package-1").name("Giáo dục").planType("education").monthlyAiMinutes(5000).build();
        context = new SchoolService.SchoolContext(school, membership, subscription, servicePackage);
        usage = SchoolAiUsage.builder()
                .id("usage-1").schoolId("school-1").periodStart(start).periodEnd(start.plusDays(30))
                .limitSeconds(300000L).additionalSeconds(0L).usedSeconds(0L).reservedSeconds(0L)
                .processedVideoCount(0L).version(0L).build();
        memberDailyUsage = SchoolMemberDailyAiUsage.builder()
                .id("daily-1").schoolId("school-1").userId("teacher-1").role("TEACHER")
                .usageDate(LocalDate.now()).limitSeconds(7200L).usedSeconds(0L).reservedSeconds(0L)
                .processedVideoCount(0L).version(0L).build();

        lenient().when(schoolService.resolveSchoolContext("teacher-1")).thenReturn(Optional.of(context));
        lenient().when(usageRepository.findBySchoolIdAndPeriodStart(eq("school-1"), any(LocalDateTime.class)))
                .thenReturn(Optional.of(usage));
        lenient().when(usageRepository.save(any(SchoolAiUsage.class))).thenAnswer(invocation -> invocation.getArgument(0));
        lenient().when(memberDailyUsageRepository.findBySchoolIdAndUserIdAndUsageDate(
                        eq("school-1"), eq("teacher-1"), any(LocalDate.class)))
                .thenReturn(Optional.of(memberDailyUsage));
        lenient().when(usageRepository.findById("usage-1")).thenReturn(Optional.of(usage));
        lenient().when(memberDailyUsageRepository.findById("daily-1"))
                .thenReturn(Optional.of(memberDailyUsage));
        lenient().when(memberDailyUsageRepository.save(any(SchoolMemberDailyAiUsage.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        lenient().when(videoEntitlementRepository.save(any(SchoolVideoEntitlement.class)))
                .thenAnswer(invocation -> {
                    SchoolVideoEntitlement entitlement = invocation.getArgument(0);
                    if (entitlement.getId() == null) entitlement.setId("entitlement-1");
                    return entitlement;
                });
    }

    @Test
    void newVideoReservesItsDurationBeforeProcessing() {
        when(processingRepository.findByProcessingKey("v1:video-1")).thenReturn(Optional.empty());
        when(processingRepository.save(any(AiVideoProcessing.class))).thenAnswer(invocation -> {
            AiVideoProcessing processing = invocation.getArgument(0);
            processing.setId("processing-1");
            return processing;
        });

        AiVideoAuthorizationResponse response = service.authorizeVideo("teacher-1", request("video-1", 600));

        assertTrue(response.isAllowed());
        assertTrue(response.isOwnsProcessing());
        assertEquals(600, response.getChargeSeconds());
        assertEquals(600, usage.getReservedSeconds());
        assertEquals(0, usage.getUsedSeconds());
        assertEquals(600, memberDailyUsage.getReservedSeconds());
    }

    @Test
    void videoIsRejectedWhenItsFullDurationDoesNotFit() {
        usage.setUsedSeconds(299700L);
        when(processingRepository.findByProcessingKey("v1:video-2")).thenReturn(Optional.empty());

        AiUsageException exception = assertThrows(AiUsageException.class,
                () -> service.authorizeVideo("teacher-1", request("video-2", 600)));

        assertEquals(SchoolAiUsageService.MONTHLY_LIMIT_REACHED, exception.getCode());
        verify(processingRepository, never()).save(any());
        assertEquals(0, memberDailyUsage.getReservedSeconds());
    }

    @Test
    void videoIsRejectedWhenMemberDailyQuotaDoesNotFit() {
        context.school().setTeacherDailyAiMinutes(10);
        memberDailyUsage.setUsedSeconds(300L);
        when(processingRepository.findByProcessingKey("v1:video-daily-limit"))
                .thenReturn(Optional.empty());

        AiUsageException exception = assertThrows(AiUsageException.class,
                () -> service.authorizeVideo("teacher-1", request("video-daily-limit", 600)));

        assertEquals(SchoolAiUsageService.DAILY_LIMIT_REACHED, exception.getCode());
        assertEquals(0, memberDailyUsage.getReservedSeconds());
        assertEquals(0, usage.getReservedSeconds());
        verify(processingRepository, never()).save(any());
    }

    @Test
    void currentDailyUsageReturnsOnlyTheCurrentMembersDailyQuota() {
        memberDailyUsage.setUsedSeconds(1800L);
        memberDailyUsage.setReservedSeconds(300L);

        var result = service.currentDailyUsageForMember("teacher-1");

        assertEquals("teacher-1", result.getUserId());
        assertEquals("TEACHER", result.getRole());
        assertEquals(7200L, result.getLimitSeconds());
        assertEquals(1800L, result.getUsedSeconds());
        assertEquals(300L, result.getReservedSeconds());
        assertEquals(5100L, result.getRemainingSeconds());
    }

    @Test
    void completionMovesReservedSecondsIntoUsedSecondsOnce() {
        usage.setReservedSeconds(600L);
        AiVideoProcessing processing = AiVideoProcessing.builder()
                .id("processing-1").processingKey("v1:video-1").videoId("video-1")
                .processingVersion("v1").durationSeconds(600L).chargedSchoolId("school-1")
                .requestedBy("teacher-1").usageId("usage-1").reservedSeconds(600L)
                .memberDailyUsageId("daily-1")
                .status("PROCESSING").usageCommitted(false).memberDailyUsageCommitted(false).build();
        memberDailyUsage.setReservedSeconds(600L);
        when(processingRepository.findById("processing-1")).thenReturn(Optional.of(processing));
        when(processingRepository.save(any(AiVideoProcessing.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(usageRepository.findById("usage-1")).thenReturn(Optional.of(usage));

        service.completeProcessing("teacher-1", "processing-1");

        assertEquals("COMPLETED", processing.getStatus());
        assertTrue(processing.getUsageCommitted());
        assertTrue(processing.getMemberDailyUsageCommitted());
        assertEquals(0, usage.getReservedSeconds());
        assertEquals(600, usage.getUsedSeconds());
        assertEquals(1, usage.getProcessedVideoCount());
        assertEquals(0, memberDailyUsage.getReservedSeconds());
        assertEquals(600, memberDailyUsage.getUsedSeconds());
        assertEquals(1, memberDailyUsage.getProcessedVideoCount());
        verify(videoEntitlementRepository, atLeastOnce()).save(argThat(entitlement ->
                "school-1".equals(entitlement.getSchoolId())
                        && "v1:video-1".equals(entitlement.getProcessingKey())
                        && "ACTIVE".equals(entitlement.getStatus())));
    }

    @Test
    void completedVideoUsesCacheWithoutReservingAgain() {
        AiVideoProcessing completed = AiVideoProcessing.builder()
                .id("processing-1").processingKey("v1:video-1").videoId("video-1")
                .status("COMPLETED").durationSeconds(600L).build();
        SchoolVideoEntitlement entitlement = SchoolVideoEntitlement.builder()
                .id("entitlement-1").schoolId("school-1").processingKey("v1:video-1")
                .status("ACTIVE").chargedSeconds(600L).build();
        when(processingRepository.findByProcessingKey("v1:video-1")).thenReturn(Optional.of(completed));
        when(videoEntitlementRepository.findBySchoolIdAndProcessingKey("school-1", "v1:video-1"))
                .thenReturn(Optional.of(entitlement));

        AiVideoAuthorizationResponse response = service.authorizeVideo("teacher-1", request("video-1", 600));

        assertTrue(response.isCached());
        assertFalse(response.isOwnsProcessing());
        assertEquals(0, response.getChargeSeconds());
        assertEquals(0, usage.getReservedSeconds());
    }

    @Test
    void anotherSchoolActivationChargesItsOwnQuotaWhileReusingGlobalCache() {
        AiVideoProcessing completed = AiVideoProcessing.builder()
                .id("processing-global").processingKey("v1:shared-video").videoId("shared-video")
                .videoTitle("Video dùng chung").status("COMPLETED").durationSeconds(600L).build();
        when(processingRepository.findByProcessingKey("v1:shared-video")).thenReturn(Optional.of(completed));
        when(videoEntitlementRepository.findBySchoolIdAndProcessingKey("school-1", "v1:shared-video"))
                .thenReturn(Optional.empty());

        AiVideoAuthorizationResponse response = service.authorizeVideo(
                "teacher-1", request("shared-video", 600));

        assertTrue(response.isCached());
        assertFalse(response.isOwnsProcessing());
        assertEquals(600, response.getChargeSeconds());
        assertEquals(600, usage.getUsedSeconds());
        assertEquals(0, usage.getReservedSeconds());
        assertEquals(600, memberDailyUsage.getUsedSeconds());
        verify(videoEntitlementRepository, atLeastOnce()).save(argThat(entitlement ->
                "school-1".equals(entitlement.getSchoolId())
                        && "v1:shared-video".equals(entitlement.getProcessingKey())
                        && "ACTIVE".equals(entitlement.getStatus())));
    }

    @Test
    void studentCannotActivateVideoThatSchoolHasNotLicensed() {
        SchoolService.SchoolContext studentContext = contextWithRole("student-1", "STUDENT");
        when(schoolService.resolveSchoolContext("student-1")).thenReturn(Optional.of(studentContext));
        when(processingRepository.findByProcessingKey("v1:new-for-student")).thenReturn(Optional.empty());

        AiUsageException exception = assertThrows(AiUsageException.class,
                () -> service.authorizeVideo("student-1", request("new-for-student", 600)));

        assertEquals(SchoolAiUsageService.VIDEO_NOT_ACTIVATED, exception.getCode());
        verify(processingRepository, never()).save(any());
    }

    @Test
    void studentCanReuseVideoAlreadyLicensedByItsSchoolWithoutQuota() {
        SchoolService.SchoolContext studentContext = contextWithRole("student-1", "STUDENT");
        when(schoolService.resolveSchoolContext("student-1")).thenReturn(Optional.of(studentContext));
        AiVideoProcessing completed = AiVideoProcessing.builder()
                .id("processing-licensed").processingKey("v1:licensed-video").videoId("licensed-video")
                .status("COMPLETED").durationSeconds(600L).build();
        SchoolVideoEntitlement entitlement = SchoolVideoEntitlement.builder()
                .id("entitlement-licensed").schoolId("school-1").processingKey("v1:licensed-video")
                .status("ACTIVE").chargedSeconds(600L).build();
        when(processingRepository.findByProcessingKey("v1:licensed-video")).thenReturn(Optional.of(completed));
        when(videoEntitlementRepository.findBySchoolIdAndProcessingKey("school-1", "v1:licensed-video"))
                .thenReturn(Optional.of(entitlement));

        AiVideoAuthorizationResponse response = service.authorizeVideo(
                "student-1", request("licensed-video", 600));

        assertTrue(response.isCached());
        assertEquals(0, response.getChargeSeconds());
        assertEquals(0, usage.getUsedSeconds());
    }

    @Test
    void fixedDemoIsActivatedAndChargedImmediatelyWhileUsingLocalAssets() {
        when(processingRepository.findByProcessingKey("fixed-demo-v1:9yGEEb0CRl4"))
                .thenReturn(Optional.empty());
        when(processingRepository.save(any(AiVideoProcessing.class))).thenAnswer(invocation -> {
            AiVideoProcessing processing = invocation.getArgument(0);
            processing.setId("fixed-demo-processing");
            return processing;
        });

        AiVideoAuthorizationResponse response = service.authorizeVideo(
                "teacher-1", request("9yGEEb0CRl4", 600));

        assertTrue(response.isAllowed());
        assertTrue(response.isCached());
        assertFalse(response.isOwnsProcessing());
        assertEquals(600, response.getChargeSeconds());
        assertEquals(600, usage.getUsedSeconds());
        assertEquals(0, usage.getReservedSeconds());
        assertEquals(600, memberDailyUsage.getUsedSeconds());
        verify(processingRepository).save(argThat(processing ->
                "COMPLETED".equals(processing.getStatus())
                        && "fixed-demo-v1".equals(processing.getProcessingVersion())
                        && Boolean.TRUE.equals(processing.getUsageCommitted())));
        verify(videoEntitlementRepository, atLeastOnce()).save(argThat(entitlement ->
                "school-1".equals(entitlement.getSchoolId())
                        && "fixed-demo-v1:9yGEEb0CRl4".equals(entitlement.getProcessingKey())
                        && "ACTIVE".equals(entitlement.getStatus())));
    }

    @Test
    void fixedDemoAlreadyActivatedBySchoolIsNotChargedAgainForStudent() {
        SchoolService.SchoolContext studentContext = contextWithRole("student-1", "STUDENT");
        when(schoolService.resolveSchoolContext("student-1")).thenReturn(Optional.of(studentContext));
        AiVideoProcessing completed = AiVideoProcessing.builder()
                .id("fixed-demo-processing")
                .processingKey("fixed-demo-v1:J7b0jxVB1TE")
                .videoId("J7b0jxVB1TE")
                .status("COMPLETED")
                .durationSeconds(600L)
                .build();
        SchoolVideoEntitlement entitlement = SchoolVideoEntitlement.builder()
                .id("fixed-demo-entitlement")
                .schoolId("school-1")
                .processingKey("fixed-demo-v1:J7b0jxVB1TE")
                .status("ACTIVE")
                .chargedSeconds(600L)
                .build();
        when(processingRepository.findByProcessingKey("fixed-demo-v1:J7b0jxVB1TE"))
                .thenReturn(Optional.of(completed));
        when(videoEntitlementRepository.findBySchoolIdAndProcessingKey(
                "school-1", "fixed-demo-v1:J7b0jxVB1TE"))
                .thenReturn(Optional.of(entitlement));

        AiVideoAuthorizationResponse response = service.authorizeVideo(
                "student-1", request("J7b0jxVB1TE", 600));

        assertTrue(response.isAllowed());
        assertEquals(0, response.getChargeSeconds());
        assertEquals(0, usage.getUsedSeconds());
        verify(videoEntitlementRepository, never()).save(any());
    }

    @Test
    void studentCanBeTheFirstActivatorOfFixedDemoAndIsChargedToday() {
        SchoolService.SchoolContext studentContext = contextWithRole("student-1", "STUDENT");
        when(schoolService.resolveSchoolContext("student-1")).thenReturn(Optional.of(studentContext));
        SchoolMemberDailyAiUsage studentDailyUsage = SchoolMemberDailyAiUsage.builder()
                .id("student-daily-1")
                .schoolId("school-1")
                .userId("student-1")
                .role("STUDENT")
                .usageDate(LocalDate.now())
                .limitSeconds(3600L)
                .usedSeconds(0L)
                .reservedSeconds(0L)
                .processedVideoCount(0L)
                .version(0L)
                .build();
        when(memberDailyUsageRepository.findBySchoolIdAndUserIdAndUsageDate(
                eq("school-1"), eq("student-1"), any(LocalDate.class)))
                .thenReturn(Optional.of(studentDailyUsage));
        when(memberDailyUsageRepository.findById("student-daily-1"))
                .thenReturn(Optional.of(studentDailyUsage));
        when(processingRepository.findByProcessingKey("fixed-demo-v1:VG8apSF2018"))
                .thenReturn(Optional.empty());
        when(processingRepository.save(any(AiVideoProcessing.class))).thenAnswer(invocation -> {
            AiVideoProcessing processing = invocation.getArgument(0);
            processing.setId("fixed-demo-student-processing");
            return processing;
        });

        AiVideoAuthorizationResponse response = service.authorizeVideo(
                "student-1", request("VG8apSF2018", 600));

        assertTrue(response.isAllowed());
        assertEquals(600, response.getChargeSeconds());
        assertEquals(600, usage.getUsedSeconds());
        assertEquals(600, studentDailyUsage.getUsedSeconds());
        assertEquals(1, studentDailyUsage.getProcessedVideoCount());
    }

    @Test
    void paidTopUpAddsMinutesToCurrentPeriodOnlyOnce() {
        when(schoolService.resolveManagedSchoolContext("admin-1")).thenReturn(context);
        usage.setUsedSeconds(300000L);

        service.applyPurchasedTopUp("admin-1", 123456L, 1000);
        service.applyPurchasedTopUp("admin-1", 123456L, 1000);

        assertEquals(60000L, usage.getAdditionalSeconds());
        assertEquals(1, usage.getAppliedTopUpOrderCodes().size());
        assertEquals(123456L, usage.getAppliedTopUpOrderCodes().get(0));
        verify(usageRepository, times(1)).save(usage);
    }

    @Test
    void topUpCheckoutIsRejectedWhileMonthlyQuotaRemains() {
        when(schoolService.resolveManagedSchoolContext("admin-1")).thenReturn(context);

        AiUsageException exception = assertThrows(AiUsageException.class,
                () -> service.requireTopUpEligibility("admin-1"));

        assertEquals(SchoolAiUsageService.TOP_UP_NOT_AVAILABLE, exception.getCode());
    }

    private SchoolService.SchoolContext contextWithRole(String userId, String role) {
        SchoolMembership membership = SchoolMembership.builder()
                .schoolId("school-1").userId(userId).role(role).status("ACTIVE").build();
        return new SchoolService.SchoolContext(
                context.school(), membership, context.subscription(), context.servicePackage());
    }

    private AiVideoAuthorizationRequest request(String videoId, long durationSeconds) {
        return AiVideoAuthorizationRequest.builder()
                .videoId(videoId)
                .durationSeconds(durationSeconds)
                .videoTitle("Video kiểm thử")
                .build();
    }
}
