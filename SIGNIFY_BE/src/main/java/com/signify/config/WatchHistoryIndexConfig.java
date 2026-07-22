package com.signify.config;

import com.signify.modules.entitlement.model.UsageSession;
import com.signify.modules.entitlement.repository.UsageSessionRepository;
import com.signify.modules.tracking.model.VideoWatchHistory;
import com.signify.modules.tracking.service.WatchHistoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class WatchHistoryIndexConfig implements ApplicationRunner {

    private final MongoTemplate mongoTemplate;
    private final UsageSessionRepository usageSessionRepository;
    private final WatchHistoryService watchHistoryService;

    @Override
    public void run(ApplicationArguments args) {
        var indexOps = mongoTemplate.indexOps(VideoWatchHistory.class);
        indexOps.ensureIndex(new Index()
                .on("schoolId", Sort.Direction.ASC)
                .on("userId", Sort.Direction.ASC)
                .on("youtubeVideoId", Sort.Direction.ASC)
                .unique()
                .named("school_user_video_unique"));
        indexOps.ensureIndex(new Index()
                .on("schoolId", Sort.Direction.ASC)
                .on("lastWatchedAt", Sort.Direction.DESC)
                .named("school_last_watched"));

        Query pendingHistory = Query.query(new Criteria().andOperator(
                Criteria.where("source").is("EXTENSION"),
                Criteria.where("schoolId").ne(null),
                Criteria.where("durationSeconds").gte(WatchHistoryService.MIN_WATCHED_SECONDS),
                new Criteria().orOperator(
                        Criteria.where("historyRecordedSeconds").exists(false),
                        Criteria.where("historyRecordedSeconds").lt(WatchHistoryService.MIN_WATCHED_SECONDS))));
        int migrated = 0;
        for (UsageSession session : mongoTemplate.find(pendingHistory, UsageSession.class)) {
            long duration = session.getDurationSeconds() == null ? 0 : session.getDurationSeconds();
            long recorded = session.getHistoryRecordedSeconds() == null ? 0 : session.getHistoryRecordedSeconds();
            if (duration <= recorded) continue;
            watchHistoryService.recordProgress(session, duration - recorded, recorded == 0);
            session.setHistoryRecordedSeconds(duration);
            usageSessionRepository.save(session);
            migrated++;
        }
        if (migrated > 0) log.info("Backfilled {} extension watch-history sessions.", migrated);
    }
}
