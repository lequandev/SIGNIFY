package com.signify.modules.tracking.repository;

import com.signify.modules.tracking.model.History;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HistoryRepository extends MongoRepository<History, String> {
    List<History> findByUserIdOrderByWatchedAtDesc(String userId);
    long deleteByUserId(String userId);
}
