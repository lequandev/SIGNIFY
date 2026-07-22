package com.signify.config;

import com.signify.modules.entitlement.model.AiVideoProcessing;
import com.signify.modules.entitlement.model.AiVideoSegmentCache;
import com.signify.modules.entitlement.model.PersonalAiUsage;
import com.signify.modules.entitlement.model.SchoolAiUsage;
import com.signify.modules.entitlement.model.SchoolMemberDailyAiUsage;
import com.signify.modules.entitlement.model.SchoolVideoEntitlement;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class AiUsageMigration implements ApplicationRunner {

    private static final int DEFAULT_MONTHLY_AI_MINUTES = 10000;
    private static final int DEFAULT_PERSONAL_MONTHLY_AI_MINUTES = 800;
    private final MongoTemplate mongoTemplate;

    @Override
    public void run(ApplicationArguments args) {
        var usageIndexes = mongoTemplate.indexOps(SchoolAiUsage.class);
        usageIndexes.ensureIndex(new Index()
                .on("schoolId", Sort.Direction.ASC)
                .on("periodStart", Sort.Direction.ASC)
                .unique()
                .named("school_ai_period_unique"));
        usageIndexes.ensureIndex(new Index()
                .on("appliedTopUpOrderCodes", Sort.Direction.ASC)
                .unique()
                .sparse()
                .named("school_ai_top_up_order_unique"));

        var personalUsageIndexes = mongoTemplate.indexOps(PersonalAiUsage.class);
        personalUsageIndexes.ensureIndex(new Index()
                .on("userId", Sort.Direction.ASC)
                .on("periodStart", Sort.Direction.ASC)
                .unique()
                .named("personal_ai_period_unique"));
        personalUsageIndexes.ensureIndex(new Index()
                .on("appliedTopUpOrderCodes", Sort.Direction.ASC)
                .unique()
                .sparse()
                .named("personal_ai_top_up_order_unique"));

        var processingIndexes = mongoTemplate.indexOps(AiVideoProcessing.class);
        processingIndexes.ensureIndex(new Index()
                .on("processingKey", Sort.Direction.ASC)
                .unique()
                .named("processing_key_unique"));
        processingIndexes.ensureIndex(new Index()
                .on("chargedSchoolId", Sort.Direction.ASC)
                .on("status", Sort.Direction.ASC)
                .on("completedAt", Sort.Direction.DESC)
                .named("school_processing_history"));
        processingIndexes.ensureIndex(new Index()
                .on("status", Sort.Direction.ASC)
                .on("expiresAt", Sort.Direction.ASC)
                .named("processing_expiration"));

        mongoTemplate.indexOps(AiVideoSegmentCache.class).ensureIndex(new Index()
                .on("processingId", Sort.Direction.ASC)
                .on("textHash", Sort.Direction.ASC)
                .unique()
                .named("processing_segment_unique"));

        mongoTemplate.indexOps(SchoolMemberDailyAiUsage.class).ensureIndex(new Index()
                .on("schoolId", Sort.Direction.ASC)
                .on("userId", Sort.Direction.ASC)
                .on("usageDate", Sort.Direction.ASC)
                .unique()
                .named("school_member_ai_day_unique"));

        mongoTemplate.indexOps(SchoolVideoEntitlement.class).ensureIndex(new Index()
                .on("schoolId", Sort.Direction.ASC)
                .on("processingKey", Sort.Direction.ASC)
                .unique()
                .named("school_processing_entitlement_unique"));

        backfillSchoolVideoEntitlements();

        Query organizationPackages = Query.query(Criteria.where("planType").is("education"));
        var migrated = mongoTemplate.updateMulti(organizationPackages,
                Update.update("monthlyAiMinutes", DEFAULT_MONTHLY_AI_MINUTES), "packages");
        Query personalPackages = Query.query(Criteria.where("planType").is("individual"));
        var migratedPersonal = mongoTemplate.updateMulti(personalPackages,
                Update.update("monthlyAiMinutes", DEFAULT_PERSONAL_MONTHLY_AI_MINUTES), "packages");
        mongoTemplate.updateMulti(new Query(), new Update().unset("maxAccounts"), "packages");
        mongoTemplate.updateMulti(Query.query(Criteria.where("teacherDailyAiMinutes").exists(false)),
                Update.update("teacherDailyAiMinutes", 0), "schools");
        mongoTemplate.updateMulti(Query.query(Criteria.where("studentDailyAiMinutes").exists(false)),
                Update.update("studentDailyAiMinutes", 0), "schools");

        if (migrated.getModifiedCount() > 0) {
            log.info("Updated monthly AI quota for {} organization packages.", migrated.getModifiedCount());
        }
        if (migratedPersonal.getModifiedCount() > 0) {
            log.info("Updated monthly AI quota for {} personal packages.", migratedPersonal.getModifiedCount());
        }
    }

    private void backfillSchoolVideoEntitlements() {
        Query completedSchoolVideos = Query.query(new Criteria().andOperator(
                Criteria.where("status").is("COMPLETED"),
                Criteria.where("chargedSchoolId").ne(null),
                Criteria.where("processingKey").ne(null)));

        for (AiVideoProcessing processing : mongoTemplate.find(completedSchoolVideos, AiVideoProcessing.class)) {
            Query entitlement = Query.query(new Criteria().andOperator(
                    Criteria.where("schoolId").is(processing.getChargedSchoolId()),
                    Criteria.where("processingKey").is(processing.getProcessingKey())));
            LocalDateTime activatedAt = processing.getCompletedAt() != null
                    ? processing.getCompletedAt() : LocalDateTime.now();
            Update update = new Update()
                    .setOnInsert("schoolId", processing.getChargedSchoolId())
                    .setOnInsert("videoId", processing.getVideoId())
                    .setOnInsert("processingKey", processing.getProcessingKey())
                    .setOnInsert("processingId", processing.getId())
                    .setOnInsert("videoTitle", processing.getVideoTitle())
                    .setOnInsert("videoUrl", processing.getVideoUrl())
                    .setOnInsert("channelName", processing.getChannelName())
                    .setOnInsert("durationSeconds", processing.getDurationSeconds())
                    .setOnInsert("activatedBy", processing.getRequestedBy())
                    .setOnInsert("usageId", processing.getUsageId())
                    .setOnInsert("memberDailyUsageId", processing.getMemberDailyUsageId())
                    .setOnInsert("chargedSeconds", processing.getReservedSeconds())
                    .setOnInsert("status", "ACTIVE")
                    .setOnInsert("usageCommitted", true)
                    .setOnInsert("memberDailyUsageCommitted",
                            processing.getMemberDailyUsageId() == null
                                    || Boolean.TRUE.equals(processing.getMemberDailyUsageCommitted()))
                    .setOnInsert("activatedAt", activatedAt)
                    .setOnInsert("createdAt", activatedAt)
                    .setOnInsert("updatedAt", activatedAt);
            mongoTemplate.upsert(entitlement, update, SchoolVideoEntitlement.class);
        }
    }
}
