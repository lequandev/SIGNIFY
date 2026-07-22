package com.signify.modules.entitlement.service;

import com.signify.modules.ai.dto.SignData;
import com.signify.modules.entitlement.model.AiVideoSegmentCache;
import com.signify.modules.entitlement.repository.AiVideoSegmentCacheRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AiVideoSegmentCacheService {

    private final AiVideoSegmentCacheRepository repository;

    public Optional<List<SignData>> find(String processingId, String text) {
        if (processingId == null || processingId.isBlank()) return Optional.empty();
        return repository.findByProcessingIdAndTextHash(processingId, hash(text))
                .map(AiVideoSegmentCache::getSignData);
    }

    public void save(String processingId, String videoId, String text, List<SignData> signData) {
        if (processingId == null || processingId.isBlank() || signData == null) return;
        try {
            repository.save(AiVideoSegmentCache.builder()
                    .processingId(processingId)
                    .videoId(videoId)
                    .textHash(hash(text))
                    .signData(signData)
                    .createdAt(LocalDateTime.now())
                    .build());
        } catch (DuplicateKeyException ignored) {
            // A concurrent request stored the same deterministic segment first.
        }
    }

    private String hash(String text) {
        String normalized = text == null ? "" : text.trim().replaceAll("\\s+", " ").toLowerCase();
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(normalized.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }
}
