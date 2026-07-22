package com.signify.modules.youtube.repository;

import com.signify.modules.youtube.model.YoutubeVideo;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface YoutubeVideoRepository extends MongoRepository<YoutubeVideo, String> {
    Optional<YoutubeVideo> findByVideoId(String videoId);
    boolean existsByVideoId(String videoId);
}
