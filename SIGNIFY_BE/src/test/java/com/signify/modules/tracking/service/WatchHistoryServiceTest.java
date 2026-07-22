package com.signify.modules.tracking.service;

import com.signify.modules.classroom.model.ClassEnrollment;
import com.signify.modules.classroom.model.Classroom;
import com.signify.modules.classroom.repository.ClassEnrollmentRepository;
import com.signify.modules.classroom.repository.ClassroomRepository;
import com.signify.modules.entitlement.model.UsageSession;
import com.signify.modules.school.model.School;
import com.signify.modules.school.model.SchoolMembership;
import com.signify.modules.school.repository.SchoolMembershipRepository;
import com.signify.modules.school.service.SchoolService;
import com.signify.modules.subscription.model.ServicePackage;
import com.signify.modules.subscription.model.Subscription;
import com.signify.modules.user.model.Role;
import com.signify.modules.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import org.bson.Document;
import org.mockito.ArgumentCaptor;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WatchHistoryServiceTest {

    @Mock private MongoTemplate mongoTemplate;
    @Mock private SchoolService schoolService;
    @Mock private SchoolMembershipRepository membershipRepository;
    @Mock private ClassroomRepository classroomRepository;
    @Mock private ClassEnrollmentRepository enrollmentRepository;
    @Mock private UserRepository userRepository;

    private WatchHistoryService service;

    @BeforeEach
    void setUp() {
        service = new WatchHistoryService(mongoTemplate, schoolService, membershipRepository,
                classroomRepository, enrollmentRepository, userRepository);
    }

    @Test
    void teacherCanOnlyViewStudentsEnrolledInOwnedClasses() {
        SchoolService.SchoolContext teacherContext = context("teacher-1", Role.TEACHER);
        SchoolMembership studentMembership = SchoolMembership.builder()
                .schoolId("school-1").userId("student-1").role(Role.STUDENT).status("ACTIVE").build();
        when(schoolService.resolveSchoolContext("teacher-1")).thenReturn(Optional.of(teacherContext));
        when(membershipRepository.findBySchoolIdAndUserId("school-1", "student-1"))
                .thenReturn(Optional.of(studentMembership));
        when(classroomRepository.findByTeacherIdAndStatusNot("teacher-1", "ARCHIVED"))
                .thenReturn(List.of(Classroom.builder().id("class-1").teacherId("teacher-1").schoolId("school-1").build()));
        when(enrollmentRepository.findByStudentIdAndStatus("student-1", "ACTIVE"))
                .thenReturn(List.of(ClassEnrollment.builder().classId("class-1").studentId("student-1").status("ACTIVE").build()));

        assertDoesNotThrow(() -> service.assertCanViewStudent("teacher-1", "student-1"));
    }

    @Test
    void teacherIsForbiddenForStudentOutsideOwnedClasses() {
        SchoolService.SchoolContext teacherContext = context("teacher-1", Role.TEACHER);
        SchoolMembership studentMembership = SchoolMembership.builder()
                .schoolId("school-1").userId("student-2").role(Role.STUDENT).status("ACTIVE").build();
        when(schoolService.resolveSchoolContext("teacher-1")).thenReturn(Optional.of(teacherContext));
        when(membershipRepository.findBySchoolIdAndUserId("school-1", "student-2"))
                .thenReturn(Optional.of(studentMembership));
        when(classroomRepository.findByTeacherIdAndStatusNot("teacher-1", "ARCHIVED"))
                .thenReturn(List.of(Classroom.builder().id("class-1").teacherId("teacher-1").schoolId("school-1").build()));
        when(enrollmentRepository.findByStudentIdAndStatus("student-2", "ACTIVE"))
                .thenReturn(List.of(ClassEnrollment.builder().classId("class-2").studentId("student-2").status("ACTIVE").build()));

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> service.assertCanViewStudent("teacher-1", "student-2"));
        assertEquals(SchoolService.SCHOOL_FORBIDDEN, exception.getMessage());
    }

    @Test
    void recordProgressDoesNotWriteMetadataThroughConflictingMongoOperators() {
        UsageSession session = UsageSession.builder()
                .userId("teacher-1")
                .schoolId("school-1")
                .roleAtView(Role.TEACHER)
                .source("EXTENSION")
                .videoId("video-1")
                .videoTitle("Video title")
                .videoUrl("https://www.youtube.com/watch?v=video-1")
                .channelName("Channel")
                .videoDurationSeconds(120L)
                .lastPositionSeconds(20L)
                .build();

        service.recordProgress(session, 20, true);

        ArgumentCaptor<Update> updateCaptor = ArgumentCaptor.forClass(Update.class);
        verify(mongoTemplate).upsert(any(Query.class), updateCaptor.capture(), eq(com.signify.modules.tracking.model.VideoWatchHistory.class));
        Document update = updateCaptor.getValue().getUpdateObject();
        Document set = update.get("$set", Document.class);
        Document setOnInsert = update.get("$setOnInsert", Document.class);
        assertFalse(set.keySet().stream().anyMatch(setOnInsert::containsKey));
    }

    private SchoolService.SchoolContext context(String userId, String role) {
        School school = School.builder().id("school-1").status("ACTIVE").build();
        SchoolMembership membership = SchoolMembership.builder()
                .schoolId("school-1").userId(userId).role(role).status("ACTIVE").build();
        return new SchoolService.SchoolContext(school, membership, new Subscription(), new ServicePackage());
    }
}
