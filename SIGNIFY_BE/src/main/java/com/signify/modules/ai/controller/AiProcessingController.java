package com.signify.modules.ai.controller;

import com.signify.modules.ai.dto.DictionaryLookupRequest;
import com.signify.modules.ai.dto.SignData;
import com.signify.modules.ai.dto.TranscriptEvent;
import com.signify.modules.ai.service.AiProcessingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    @GetMapping("/youtube-transcript")
    public ResponseEntity<List<TranscriptEvent>> getYouTubeTranscript(@RequestParam String videoId) {
        try {
            List<TranscriptEvent> response = aiProcessingService.getYouTubeTranscript(videoId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}

