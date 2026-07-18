package com.signify.modules.ai.repository;

import com.signify.modules.ai.model.GlossaryTerm;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface GlossaryTermRepository extends MongoRepository<GlossaryTerm, String> {
    Optional<GlossaryTerm> findByPhrase(String phrase);
    boolean existsByPhrase(String phrase);
}
