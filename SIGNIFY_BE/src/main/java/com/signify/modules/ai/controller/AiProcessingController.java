package com.signify.modules.ai.controller;

import com.signify.modules.ai.dto.DictionaryLookupRequest;
import com.signify.modules.ai.dto.SegmentRequest;
import com.signify.modules.ai.dto.SignData;
import com.signify.modules.ai.dto.TranscriptEvent;
import com.signify.modules.ai.model.GlossaryTerm;
import com.signify.modules.ai.service.AiProcessingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.POST, RequestMethod.GET, RequestMethod.OPTIONS})
public class AiProcessingController {

    private final AiProcessingService aiProcessingService;

    @PostMapping("/dictionary-lookup")
    public ResponseEntity<List<SignData>> dictionaryLookup(@Valid @RequestBody DictionaryLookupRequest request) {
        List<SignData> response = aiProcessingService.dictionaryLookup(request.getWords(), request.getText());
        return ResponseEntity.ok(response);
    }

    /**
     * Tách một câu tiếng Việt thành danh sách các đơn vị ký hiệu có nghĩa.
     * Ví dụ: "Hôm nay chúng ta sẽ tìm hiểu về trí tuệ nhân tạo và cách AI đang thay đổi cuộc sống hiện đại."
     * -> ["hôm nay","tìm hiểu","trí tuệ nhân tạo","AI","thay đổi","cuộc sống hiện đại"]
     */
    @PostMapping("/segment")
    public ResponseEntity<List<String>> segment(@Valid @RequestBody SegmentRequest request) {
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
}

