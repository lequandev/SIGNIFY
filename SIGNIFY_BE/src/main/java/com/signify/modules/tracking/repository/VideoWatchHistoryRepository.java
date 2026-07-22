package com.signify.modules.tracking.repository;

import com.signify.modules.tracking.model.VideoWatchHistory;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VideoWatchHistoryRepository extends MongoRepository<VideoWatchHistory, String> {
    long deleteByUserId(String userId);
}
