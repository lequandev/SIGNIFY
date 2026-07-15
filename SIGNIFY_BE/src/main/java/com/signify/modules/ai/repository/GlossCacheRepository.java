package com.signify.modules.ai.repository;

import com.signify.modules.ai.model.GlossCacheEntry;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface GlossCacheRepository extends MongoRepository<GlossCacheEntry, String> {
}
