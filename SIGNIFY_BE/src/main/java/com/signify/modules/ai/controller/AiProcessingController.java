package com.signify.modules.ai.controller;

import com.signify.modules.ai.dto.DictionaryLookupRequest;
import com.signify.modules.ai.dto.ResolveSignAnimationsRequest;
import com.signify.modules.ai.dto.SegmentRequest;
import com.signify.modules.ai.dto.SignData;
import com.signify.modules.ai.dto.SignSequenceRequest;
import com.signify.modules.ai.dto.TranscriptEvent;
import com.signify.modules.ai.model.GlossaryTerm;
import com.signify.modules.ai.service.AiProcessingService;
import com.signify.modules.entitlement.service.EntitlementService;
import com.signify.modules.entitlement.exception.AiUsageException;
import com.signify.modules.entitlement.service.SchoolAiUsageService;
import com.signify.modules.entitlement.service.AiVideoSegmentCacheService;
import com.signify.modules.youtube.service.YoutubeVideoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.POST, RequestMethod.GET, RequestMethod.OPTIONS})
public class AiProcessingController {

    private final AiProcessingService aiProcessingService;
    private final EntitlementService entitlementService;
    private final SchoolAiUsageService schoolAiUsageService;
    private final AiVideoSegmentCacheService aiVideoSegmentCacheService;
    private final YoutubeVideoService youtubeVideoService;

    @PostMapping("/sign-sequence")
    public ResponseEntity<?> saveSignSequence(@RequestBody SignSequenceRequest request) {
        String userId = getCurrentUserId();
        Map<String, Object> result = youtubeVideoService.saveSignSequence(request, userId);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/dictionary-lookup")
    public ResponseEntity<?> dictionaryLookup(@Valid @RequestBody DictionaryLookupRequest request) {
        String userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of(
                    "code", "AUTH_REQUIRED",
                    "message", "Vui lòng đăng nhập Signify để sử dụng extension."
            ));
        }
        boolean schoolRequest;
        try {
            schoolRequest = schoolAiUsageService.validateSchoolProcessing(
                    userId, request.getVideoId(), request.getAiProcessingId());
            if (!schoolRequest && !entitlementService.canUseFeature(userId)) {
                return ResponseEntity.status(403).body(Map.of(
                        "code", "FREE_DAILY_LIMIT_REACHED",
                        "message", "Bạn đã dùng hết 20 phút miễn phí hôm nay. Vui lòng nâng cấp gói để tiếp tục."
                ));
            }
        } catch (AiUsageException exception) {
            return ResponseEntity.status(403).body(Map.of(
                    "code", exception.getCode(),
                    "message", exception.getMessage()
            ));
        }

        String cacheText = request.getText() != null ? request.getText() : String.join(" ", request.getWords());
        if (schoolRequest) {
            var cached = aiVideoSegmentCacheService.find(request.getAiProcessingId(), cacheText);
            if (cached.isPresent()) {
                List<String> cachedWords = cached.get().stream()
                        .map(SignData::getWord)
                        .filter(java.util.Objects::nonNull)
                        .toList();
                return ResponseEntity.ok(aiProcessingService.resolveSignAnimations(cachedWords));
            }
        }
        List<SignData> response = aiProcessingService.dictionaryLookup(request.getWords(), request.getText());
        if (schoolRequest) {
            aiVideoSegmentCacheService.save(request.getAiProcessingId(), request.getVideoId(), cacheText, response);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/resolve-sign-animations")
    public ResponseEntity<List<SignData>> resolveSignAnimations(
            @Valid @RequestBody ResolveSignAnimationsRequest request) {
        return ResponseEntity.ok(aiProcessingService.resolveSignAnimations(request.getWords()));
    }

    /**
     * Tách một câu tiếng Việt thành danh sách các đơn vị ký hiệu có nghĩa.
     */
    @PostMapping("/segment")
    public ResponseEntity<?> segment(@Valid @RequestBody SegmentRequest request) {
        String userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of(
                    "code", "AUTH_REQUIRED",
                    "message", "Vui lòng đăng nhập Signify để sử dụng extension."
            ));
        }
        if (!entitlementService.canUseFeature(userId)) {
            return ResponseEntity.status(403).body(Map.of(
                    "code", "FREE_DAILY_LIMIT_REACHED",
                    "message", "Bạn đã dùng hết 20 phút miễn phí hôm nay. Vui lòng nâng cấp gói để tiếp tục."
            ));
        }

        List<String> response = aiProcessingService.segmentText(null, request.getText());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/youtube-transcript")
    public ResponseEntity<List<TranscriptEvent>> getYouTubeTranscript(@RequestParam String videoId) {
        try {
            List<TranscriptEvent> response = aiProcessingService.getYouTubeTranscript(videoId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // ===== Glossary thủ công (nguồn chính xác do người duyệt) =====

    @GetMapping("/glossary")
    public ResponseEntity<List<GlossaryTerm>> listGlossary() {
        return ResponseEntity.ok(aiProcessingService.listGlossary());
    }

    /**
     * Thêm/cập nhật một cụm glossary.
     * Body: { "phrase": "bao nhiêu tuổi", "glosses": ["HỎI","TUỔI"], "note": "..." }
     */
    @PostMapping("/glossary")
    public ResponseEntity<GlossaryTerm> upsertGlossary(@RequestBody Map<String, Object> body) {
        String phrase = String.valueOf(body.getOrDefault("phrase", "")).trim();
        if (phrase.isEmpty()) return ResponseEntity.badRequest().build();

        @SuppressWarnings("unchecked")
        List<String> glosses = body.get("glosses") instanceof List
                ? (List<String>) body.get("glosses")
                : List.of();
        String note = body.get("note") != null ? String.valueOf(body.get("note")) : null;

        return ResponseEntity.ok(aiProcessingService.upsertGlossary(phrase, glosses, note));
    }

    @DeleteMapping("/glossary/{id}")
    public ResponseEntity<Void> deleteGlossary(@PathVariable String id) {
        aiProcessingService.deleteGlossary(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/clear-cache")
    public ResponseEntity<Map<String, String>> clearCache() {
        aiProcessingService.clearSegmentCache();
        aiProcessingService.clearMongoCache();
        return ResponseEntity.ok(Map.of("message", "Cache cleared successfully"));
    }

    @PostMapping("/translate-to-vietnamese")
    public ResponseEntity<Map<String, String>> translateToVietnamese(@RequestBody Map<String, String> body) {
        String text = body.get("text");
        if (text == null || text.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        String translated = aiProcessingService.translateToVietnamese(text);
        return ResponseEntity.ok(Map.of("original", text, "translated", translated));
    }

    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return auth.getName();
        }
        return null;
    }
}
