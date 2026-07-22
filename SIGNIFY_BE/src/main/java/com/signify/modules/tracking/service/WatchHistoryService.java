package com.signify.modules.tracking.service;

import com.signify.modules.classroom.model.ClassEnrollment;
import com.signify.modules.classroom.model.Classroom;
import com.signify.modules.classroom.repository.ClassEnrollmentRepository;
import com.signify.modules.classroom.repository.ClassroomRepository;
import com.signify.modules.entitlement.model.UsageSession;
import com.signify.modules.school.model.SchoolMembership;
import com.signify.modules.school.repository.SchoolMembershipRepository;
import com.signify.modules.school.service.SchoolService;
import com.signify.modules.tracking.dto.WatchHistoryPageResponse;
import com.signify.modules.tracking.dto.WatchHistoryResponse;
import com.signify.modules.tracking.dto.WatchHistorySummaryResponse;
import com.signify.modules.tracking.model.VideoWatchHistory;
import com.signify.modules.user.model.Role;
import com.signify.modules.user.model.User;
import com.signify.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WatchHistoryService {

    public static final long MIN_WATCHED_SECONDS = 10;

    private final MongoTemplate mongoTemplate;
    private final SchoolService schoolService;
    private final SchoolMembershipRepository membershipRepository;
    private final ClassroomRepository classroomRepository;
    private final ClassEnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;

    public void recordProgress(UsageSession session, long watchedSeconds, boolean newView) {
        if (session == null || watchedSeconds <= 0
                || session.getSchoolId() == null
                || session.getVideoId() == null
                || !"EXTENSION".equalsIgnoreCase(session.getSource())) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        Query query = Query.query(Criteria.where("schoolId").is(session.getSchoolId())
                .and("userId").is(session.getUserId())
                .and("youtubeVideoId").is(session.getVideoId()));

        Update update = new Update()
                .set("roleAtView", session.getRoleAtView())
                .set("youtubeVideoId", session.getVideoId())
                .set("lastWatchedAt", now)
                .set("source", "EXTENSION")
                .set("updatedAt", now)
                .setOnInsert("schoolId", session.getSchoolId())
                .setOnInsert("userId", session.getUserId())
                .setOnInsert("firstWatchedAt", now)
                .setOnInsert("createdAt", now)
                .inc("totalWatchedSeconds", watchedSeconds);

        if (trimToNull(session.getVideoTitle()) != null) update.set("videoTitle", session.getVideoTitle().trim());
        else update.setOnInsert("videoTitle", normalizedTitle(session));
        if (trimToNull(session.getVideoUrl()) != null) update.set("videoUrl", session.getVideoUrl().trim());
        else update.setOnInsert("videoUrl", normalizedUrl(session));
        if (trimToNull(session.getChannelName()) != null) update.set("channelName", session.getChannelName().trim());
        if (session.getVideoDurationSeconds() != null && session.getVideoDurationSeconds() > 0) {
            update.set("videoDurationSeconds", session.getVideoDurationSeconds());
        }
        if (newView) update.inc("viewCount", 1);
        if (session.getLastPositionSeconds() != null) {
            update.max("furthestPositionSeconds", session.getLastPositionSeconds());
        }
        mongoTemplate.upsert(query, update, VideoWatchHistory.class);
    }

    public WatchHistoryPageResponse getSchoolHistory(String actorUserId, String role, String userId,
                                                      String classId, String keyword, LocalDate from, LocalDate to,
                                                      int page, int size) {
        SchoolService.SchoolContext context = schoolService.resolveManagedSchoolContext(actorUserId);
        String normalizedRole = normalizeSchoolRole(role);
        List<String> classStudentIds = resolveClassStudentIds(context.school().getId(), classId);
        Criteria criteria = buildCriteria(context.school().getId(), normalizedRole, userId,
                classStudentIds, keyword, from, to);
        return queryPage(criteria, page, size);
    }

    public WatchHistorySummaryResponse getSchoolSummary(String actorUserId) {
        SchoolService.SchoolContext context = schoolService.resolveManagedSchoolContext(actorUserId);
        Criteria criteria = buildCriteria(context.school().getId(), null, null, null, null, null, null);
        return summarize(criteria);
    }

    public WatchHistoryPageResponse getStudentHistory(String actorUserId, String studentId,
                                                       String keyword, LocalDate from, LocalDate to,
                                                       int page, int size) {
        SchoolService.SchoolContext actor = assertCanViewStudent(actorUserId, studentId);
        Criteria criteria = buildCriteria(actor.school().getId(), Role.STUDENT, studentId,
                null, keyword, from, to);
        return queryPage(criteria, page, size);
    }

    public WatchHistorySummaryResponse getStudentSummary(String actorUserId, String studentId) {
        SchoolService.SchoolContext actor = assertCanViewStudent(actorUserId, studentId);
        Criteria criteria = buildCriteria(actor.school().getId(), Role.STUDENT, studentId,
                null, null, null, null);
        return summarize(criteria);
    }

    public WatchHistoryPageResponse getMyHistory(String userId, String keyword, LocalDate from, LocalDate to,
                                                  int page, int size) {
        SchoolService.SchoolContext context = schoolService.resolveSchoolContext(userId)
                .orElseThrow(() -> new RuntimeException(SchoolService.SCHOOL_NOT_FOUND));
        Criteria criteria = buildCriteria(context.school().getId(), null, userId,
                null, keyword, from, to);
        return queryPage(criteria, page, size);
    }

    public SchoolService.SchoolContext assertCanViewStudent(String actorUserId, String studentId) {
        SchoolService.SchoolContext actor = schoolService.resolveSchoolContext(actorUserId)
                .orElseThrow(() -> new RuntimeException(SchoolService.SCHOOL_NOT_FOUND));
        SchoolMembership studentMembership = membershipRepository
                .findBySchoolIdAndUserId(actor.school().getId(), studentId)
                .filter(membership -> Role.STUDENT.equals(membership.getRole()))
                .orElseThrow(() -> new RuntimeException("Student not found"));

        if (Role.SCHOOL_ADMIN.equals(actor.membership().getRole())) return actor;
        if (!Role.TEACHER.equals(actor.membership().getRole())
                || !SchoolService.STATUS_ACTIVE.equals(studentMembership.getStatus())) {
            throw new RuntimeException(SchoolService.SCHOOL_FORBIDDEN);
        }

        Set<String> teacherClassIds = classroomRepository.findByTeacherIdAndStatusNot(actorUserId, "ARCHIVED")
                .stream().map(Classroom::getId).collect(Collectors.toSet());
        boolean enrolled = enrollmentRepository.findByStudentIdAndStatus(studentId, "ACTIVE").stream()
                .map(ClassEnrollment::getClassId)
                .anyMatch(teacherClassIds::contains);
        if (!enrolled) throw new RuntimeException(SchoolService.SCHOOL_FORBIDDEN);
        return actor;
    }

    private WatchHistoryPageResponse queryPage(Criteria criteria, int requestedPage, int requestedSize) {
        int page = Math.max(0, requestedPage);
        int size = Math.min(100, Math.max(1, requestedSize));
        Query countQuery = Query.query(criteria);
        long total = mongoTemplate.count(countQuery, VideoWatchHistory.class);

        Query pageQuery = Query.query(criteria)
                .with(Sort.by(Sort.Direction.DESC, "lastWatchedAt"))
                .skip((long) page * size)
                .limit(size);
        List<VideoWatchHistory> histories = mongoTemplate.find(pageQuery, VideoWatchHistory.class);
        Map<String, User> users = userRepository.findAllById(histories.stream()
                        .map(VideoWatchHistory::getUserId).filter(Objects::nonNull).collect(Collectors.toSet()))
                .stream().collect(Collectors.toMap(User::getId, user -> user));

        List<WatchHistoryResponse> content = histories.stream()
                .map(history -> toResponse(history, users.get(history.getUserId())))
                .toList();
        return WatchHistoryPageResponse.builder()
                .content(content)
                .page(page)
                .size(size)
                .totalElements(total)
                .totalPages((int) Math.ceil(total / (double) size))
                .build();
    }

    private WatchHistorySummaryResponse summarize(Criteria criteria) {
        List<VideoWatchHistory> histories = mongoTemplate.find(Query.query(criteria), VideoWatchHistory.class);
        long viewers = histories.stream().map(VideoWatchHistory::getUserId).filter(Objects::nonNull).distinct().count();
        long videos = histories.stream().map(VideoWatchHistory::getYoutubeVideoId).filter(Objects::nonNull).distinct().count();
        long seconds = histories.stream().map(VideoWatchHistory::getTotalWatchedSeconds)
                .filter(Objects::nonNull).mapToLong(Long::longValue).sum();
        long views = histories.stream().map(VideoWatchHistory::getViewCount)
                .filter(Objects::nonNull).mapToLong(Integer::longValue).sum();
        return WatchHistorySummaryResponse.builder()
                .totalViewers(viewers)
                .uniqueVideos(videos)
                .totalWatchedSeconds(seconds)
                .totalViews(views)
                .build();
    }

    private Criteria buildCriteria(String schoolId, String role, String userId, List<String> classStudentIds,
                                   String keyword, LocalDate from, LocalDate to) {
        List<Criteria> filters = new ArrayList<>();
        filters.add(Criteria.where("schoolId").is(schoolId));
        filters.add(Criteria.where("source").is("EXTENSION"));
        filters.add(role == null
                ? Criteria.where("roleAtView").in(Role.TEACHER, Role.STUDENT)
                : Criteria.where("roleAtView").is(role));
        if (userId != null && !userId.isBlank()) filters.add(Criteria.where("userId").is(userId));
        if (classStudentIds != null) filters.add(Criteria.where("userId").in(classStudentIds));
        if (keyword != null && !keyword.isBlank()) {
            String expression = Pattern.quote(keyword.trim());
            filters.add(new Criteria().orOperator(
                    Criteria.where("videoTitle").regex(expression, "i"),
                    Criteria.where("channelName").regex(expression, "i"),
                    Criteria.where("youtubeVideoId").regex(expression, "i")));
        }
        if (from != null || to != null) {
            Criteria date = Criteria.where("lastWatchedAt");
            if (from != null) date.gte(from.atStartOfDay());
            if (to != null) date.lt(to.plusDays(1).atStartOfDay());
            filters.add(date);
        }
        return new Criteria().andOperator(filters.toArray(Criteria[]::new));
    }

    private List<String> resolveClassStudentIds(String schoolId, String classId) {
        if (classId == null || classId.isBlank()) return null;
        Classroom classroom = classroomRepository.findById(classId)
                .filter(value -> schoolId.equals(value.getSchoolId()))
                .orElseThrow(() -> new RuntimeException("Class not found"));
        return enrollmentRepository.findByClassIdAndStatus(classroom.getId(), "ACTIVE")
                .stream().map(ClassEnrollment::getStudentId).toList();
    }

    private String normalizeSchoolRole(String role) {
        if (role == null || role.isBlank()) return null;
        String normalized = role.trim().toUpperCase(Locale.ROOT);
        if (!Role.TEACHER.equals(normalized) && !Role.STUDENT.equals(normalized)) {
            throw new RuntimeException("Invalid role filter");
        }
        return normalized;
    }

    private WatchHistoryResponse toResponse(VideoWatchHistory history, User user) {
        long duration = safe(history.getVideoDurationSeconds());
        long furthest = safe(history.getFurthestPositionSeconds());
        int completion = duration <= 0 ? 0 : (int) Math.min(100, Math.round(furthest * 100.0 / duration));
        return WatchHistoryResponse.builder()
                .id(history.getId())
                .userId(history.getUserId())
                .userName(displayName(user))
                .role(history.getRoleAtView())
                .youtubeVideoId(history.getYoutubeVideoId())
                .videoTitle(history.getVideoTitle())
                .videoUrl(history.getVideoUrl())
                .channelName(history.getChannelName())
                .videoDurationSeconds(history.getVideoDurationSeconds())
                .totalWatchedSeconds(history.getTotalWatchedSeconds())
                .furthestPositionSeconds(history.getFurthestPositionSeconds())
                .completionPercent(completion)
                .viewCount(history.getViewCount())
                .firstWatchedAt(history.getFirstWatchedAt())
                .lastWatchedAt(history.getLastWatchedAt())
                .source(history.getSource())
                .build();
    }

    private String normalizedTitle(UsageSession session) {
        String title = trimToNull(session.getVideoTitle());
        return title == null ? "YouTube video " + session.getVideoId() : title;
    }

    private String normalizedUrl(UsageSession session) {
        String url = trimToNull(session.getVideoUrl());
        return url == null ? "https://www.youtube.com/watch?v=" + session.getVideoId() : url;
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) return null;
        return value.trim();
    }

    private String displayName(User user) {
        if (user == null) return "Thành viên";
        if (trimToNull(user.getFullName()) != null) return user.getFullName().trim();
        if (trimToNull(user.getUsername()) != null) return user.getUsername().trim();
        if (trimToNull(user.getEmail()) != null) return user.getEmail().trim();
        return "Thành viên";
    }

    private long safe(Long value) {
        return value == null ? 0 : value;
    }
}
