package com.signify.modules.youtube.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.signify.modules.ai.dto.SignSequenceRequest;
import com.signify.modules.youtube.dto.SaveScriptsRequest;
import com.signify.modules.youtube.dto.SaveVideoInfoRequest;
import com.signify.modules.youtube.dto.VideoInfoResponse;
import com.signify.modules.youtube.model.YoutubeVideo;
import com.signify.modules.youtube.repository.YoutubeVideoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class YoutubeVideoService {

    private final YoutubeVideoRepository youtubeVideoRepository;

    @Value("${groq.api-key:}")
    private String groqApiKey;

    @Value("${groq.model:llama-3.3-70b-versatile}")
    private String groqModel;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .followRedirects(HttpClient.Redirect.NORMAL)
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Trích xuất YouTube video ID thuần từ ID hoặc URL.
     * "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10" -> "dQw4w9WgXcQ"
     * "dQw4w9WgXcQ" -> "dQw4w9WgXcQ"
     */
    public String extractYoutubeVideoId(String input) {
        if (input == null) return null;
        if (!input.contains("/") && !input.contains("?")) return input.trim();
        java.util.regex.Matcher m = java.util.regex.Pattern
                .compile("[?&]v=([^&]+)").matcher(input);
        return m.find() ? m.group(1) : null;
    }

    /**
     * Lưu chuỗi ký hiệu (signLanguageText) trực tiếp vào MongoDB collection 'youtube_videos' (trường signLanguage).
     */
    public Map<String, Object> saveSignSequence(SignSequenceRequest request, String userId) {
        if (request == null || request.getSignLanguageText() == null) {
            return Map.of(
                    "success", false,
                    "message", "signLanguageText is required"
            );
        }

        String rawId = (request.getVideoId() != null && !request.getVideoId().isBlank())
                ? request.getVideoId()
                : request.getVideoUrl();

        String videoId = extractYoutubeVideoId(rawId);
        if (videoId == null || videoId.isBlank()) {
            return Map.of(
                    "success", false,
                    "message", "videoId or videoUrl is required to identify YouTube video"
            );
        }

        LocalDateTime now = LocalDateTime.now();
        Optional<YoutubeVideo> existingOpt = youtubeVideoRepository.findByVideoId(videoId);

        YoutubeVideo video;
        if (existingOpt.isPresent()) {
            video = existingOpt.get();
            video.setSignLanguage(request.getSignLanguageText());
            video.setIsProcessed(true);
            if (request.getTitle() != null && !request.getTitle().isBlank()) {
                video.setTitle(request.getTitle());
            }
            if (request.getVideoUrl() != null && !request.getVideoUrl().isBlank()) {
                video.setVideoUrl(request.getVideoUrl());
            }
            video.setUpdatedAt(now);
        } else {
            video = YoutubeVideo.builder()
                    .videoId(videoId)
                    .videoUrl((request.getVideoUrl() != null && !request.getVideoUrl().isBlank())
                            ? request.getVideoUrl()
                            : "https://www.youtube.com/watch?v=" + videoId)
                    .title((request.getTitle() != null && !request.getTitle().isBlank()) ? request.getTitle() : videoId)
                    .signLanguage(request.getSignLanguageText())
                    .isProcessed(true)
                    .createdByUserId(userId)
                    .viewCount(1)
                    .lastAccessedAt(now)
                    .createdAt(now)
                    .updatedAt(now)
                    .build();
        }

        YoutubeVideo saved = youtubeVideoRepository.save(video);
        log.info("[YoutubeVideoService] ✅ Saved signLanguageText to MongoDB 'youtube_videos' for videoId: '{}'", videoId);

        return Map.of(
                "success", true,
                "message", "Saved successfully",
                "data", mapToResponse(saved)
        );
    }
    // ═══════════════════════════════════════════════════════════════════════════

    public VideoInfoResponse processOrGetVideoInfo(SaveVideoInfoRequest request, String userId) {
        Optional<YoutubeVideo> existingOpt = youtubeVideoRepository.findByVideoId(request.getVideoId());

        YoutubeVideo video;
        LocalDateTime now = LocalDateTime.now();

        if (existingOpt.isPresent()) {
            video = existingOpt.get();

            int currentViews = (video.getViewCount() == null) ? 0 : video.getViewCount();
            video.setViewCount(currentViews + 1);
            video.setLastAccessedAt(now);

            if (request.getTitle() != null && !request.getTitle().isBlank() && !request.getTitle().equals(video.getTitle())) {
                video.setTitle(request.getTitle());
            }
            if (request.getVideoUrl() != null && !request.getVideoUrl().isBlank() && !request.getVideoUrl().equals(video.getVideoUrl())) {
                video.setVideoUrl(request.getVideoUrl());
            }
            if (request.getSignLanguage() != null && !request.getSignLanguage().isBlank()) {
                video.setSignLanguage(request.getSignLanguage());
            }
            if (request.getSignLanguageScripts() != null && !request.getSignLanguageScripts().isEmpty()) {
                video.setSignLanguageScripts(request.getSignLanguageScripts());
                video.setIsProcessed(true);
            }

            if ((video.getSignLanguage() == null || video.getSignLanguage().isBlank()) && video.getTitle() != null && !video.getTitle().isBlank()) {
                String generatedSignLanguage = generateSignLanguageFromTitle(video.getTitle());
                if (!generatedSignLanguage.isBlank()) {
                    video.setSignLanguage(generatedSignLanguage);
                    video.setIsProcessed(true);
                }
            }

            video.setUpdatedAt(now);
            video = youtubeVideoRepository.save(video);
            log.info("[YoutubeVideoService] Existing video retrieved & updated for videoId: {}", request.getVideoId());
        } else {
            boolean hasScripts = request.getSignLanguageScripts() != null && !request.getSignLanguageScripts().isEmpty();

            String signLanguageStr = request.getSignLanguage();
            if ((signLanguageStr == null || signLanguageStr.isBlank()) && request.getTitle() != null && !request.getTitle().isBlank()) {
                signLanguageStr = generateSignLanguageFromTitle(request.getTitle());
                if (!signLanguageStr.isBlank()) {
                    hasScripts = true;
                }
            }

            video = YoutubeVideo.builder()
                    .videoId(request.getVideoId())
                    .videoUrl(request.getVideoUrl())
                    .title(request.getTitle())
                    .signLanguage(signLanguageStr)
                    .signLanguageScripts(request.getSignLanguageScripts())
                    .isProcessed(hasScripts)
                    .createdByUserId(userId)
                    .viewCount(1)
                    .lastAccessedAt(now)
                    .createdAt(now)
                    .updatedAt(now)
                    .build();

            video = youtubeVideoRepository.save(video);
            log.info("[YoutubeVideoService] New unique video info saved for videoId: {}", request.getVideoId());
        }

        return mapToResponse(video);
    }

    public Optional<VideoInfoResponse> getVideoInfoByVideoId(String videoId) {
        String cleanId = extractYoutubeVideoId(videoId);
        if (cleanId == null || cleanId.isBlank()) cleanId = videoId;
        return youtubeVideoRepository.findByVideoId(cleanId).map(this::mapToResponse);
    }

    public VideoInfoResponse saveScripts(SaveScriptsRequest request) {
        LocalDateTime now = LocalDateTime.now();
        YoutubeVideo video = youtubeVideoRepository.findByVideoId(request.getVideoId())
                .orElseGet(() -> YoutubeVideo.builder()
                        .videoId(request.getVideoId())
                        .videoUrl("https://www.youtube.com/watch?v=" + request.getVideoId())
                        .viewCount(1)
                        .lastAccessedAt(now)
                        .createdAt(now)
                        .build());

        video.setSignLanguageScripts(request.getSignLanguageScripts());
        video.setIsProcessed(true);
        video.setUpdatedAt(now);

        if ((video.getSignLanguage() == null || video.getSignLanguage().isBlank()) && video.getTitle() != null && !video.getTitle().isBlank()) {
            video.setSignLanguage(generateSignLanguageFromTitle(video.getTitle()));
        }

        YoutubeVideo saved = youtubeVideoRepository.save(video);
        log.info("[YoutubeVideoService] Scripts cached successfully for videoId: {}", request.getVideoId());
        return mapToResponse(saved);
    }

    public Map<String, Object> getAdminVideoStatsAndList(String period, String search, int page, int size) {
        List<YoutubeVideo> allVideos = youtubeVideoRepository.findAll();

        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LocalDateTime monthStart = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime yearStart  = LocalDate.now().withDayOfYear(1).atStartOfDay();

        long todayCount        = allVideos.stream().filter(v -> v.getCreatedAt() != null && !v.getCreatedAt().isBefore(todayStart)).count();
        long monthCount        = allVideos.stream().filter(v -> v.getCreatedAt() != null && !v.getCreatedAt().isBefore(monthStart)).count();
        long yearCount         = allVideos.stream().filter(v -> v.getCreatedAt() != null && !v.getCreatedAt().isBefore(yearStart)).count();
        long cachedScriptCount = allVideos.stream().filter(v ->
                (v.getSignLanguage() != null && !v.getSignLanguage().isBlank()) ||
                (v.getSignLanguageScripts() != null && !v.getSignLanguageScripts().isEmpty())).count();

        List<YoutubeVideo> filtered = allVideos.stream().filter(v -> {
            if ("day".equalsIgnoreCase(period))   return v.getCreatedAt() != null && !v.getCreatedAt().isBefore(todayStart);
            if ("month".equalsIgnoreCase(period)) return v.getCreatedAt() != null && !v.getCreatedAt().isBefore(monthStart);
            if ("year".equalsIgnoreCase(period))  return v.getCreatedAt() != null && !v.getCreatedAt().isBefore(yearStart);
            return true;
        }).filter(v -> {
            if (search == null || search.isBlank()) return true;
            String q = search.toLowerCase();
            return (v.getTitle() != null && v.getTitle().toLowerCase().contains(q)) ||
                   (v.getVideoId() != null && v.getVideoId().toLowerCase().contains(q)) ||
                   (v.getSignLanguage() != null && v.getSignLanguage().toLowerCase().contains(q));
        }).sorted((a, b) -> {
            LocalDateTime tA = a.getUpdatedAt() != null ? a.getUpdatedAt() : (a.getCreatedAt() != null ? a.getCreatedAt() : LocalDateTime.MIN);
            LocalDateTime tB = b.getUpdatedAt() != null ? b.getUpdatedAt() : (b.getCreatedAt() != null ? b.getCreatedAt() : LocalDateTime.MIN);
            return tB.compareTo(tA);
        }).toList();

        int totalElements = filtered.size();
        int fromIndex     = Math.min(page * size, totalElements);
        int toIndex       = Math.min(fromIndex + size, totalElements);
        List<VideoInfoResponse> responses = filtered.subList(fromIndex, toIndex).stream().map(this::mapToResponse).toList();

        Map<String, Object> stats = Map.of(
                "totalVideos", allVideos.size(),
                "todayCount", todayCount,
                "monthCount", monthCount,
                "yearCount", yearCount,
                "cachedScriptCount", cachedScriptCount);

        Map<String, Object> response = new HashMap<>();
        response.put("videos", responses);
        response.put("stats", stats);
        response.put("page", page);
        response.put("size", size);
        response.put("totalElements", totalElements);
        response.put("totalPages", (int) Math.ceil((double) totalElements / size));
        return response;
    }

    public void deleteVideo(String id) {
        youtubeVideoRepository.deleteById(id);
    }

    /**
     * Gọi Groq API để rút gọn tiêu đề thành danh sách từ ký hiệu tiếng Việt.
     */
    public String generateSignLanguageFromTitle(String title) {
        if (title == null || title.isBlank()) return "";
        if (groqApiKey == null || groqApiKey.isBlank()) {
            log.warn("[Groq AI] GROQ_API_KEY chưa được cấu hình.");
            return "";
        }

        try {
            log.info("[Groq AI] Generating sign language keywords for: '{}'", title);

            String systemPrompt = "Bạn là chuyên gia ngôn ngữ ký hiệu (Sign Language) tiếng Việt. " +
                    "Nhiệm vụ: Rút gọn tiêu đề/nội dung được cung cấp thành danh sách các từ/cụm từ ngữ ký hiệu cốt lõi tiếng Việt theo thứ tự ngữ pháp ký hiệu. " +
                    "Định dạng đầu ra BẮT BUỘC: Chỉ trả về các từ/cụm từ ngăn cách nhau bằng dấu phẩy và khoảng trắng ', ' " +
                    "(ví dụ: 'Bé, đi học, về, mẹ, cho, táo, ăn, ngon, bé, vui, hôn, má, mẹ'). " +
                    "QUY TẮC: KHÔNG giải thích, KHÔNG markdown, KHÔNG dùng ngoặc vuông hay ngoặc kép, " +
                    "CHỈ trả về chuỗi từ ký hiệu ngăn cách bằng dấu phẩy.";

            Map<String, Object> requestMap = Map.of(
                    "model", (groqModel != null && !groqModel.isBlank()) ? groqModel : "llama-3.3-70b-versatile",
                    "messages", List.of(
                            Map.of("role", "system", "content", systemPrompt),
                            Map.of("role", "user", "content", title)),
                    "temperature", 0.3,
                    "max_tokens", 300);

            String requestBody = objectMapper.writeValueAsString(requestMap);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.groq.com/openai/v1/chat/completions"))
                    .header("Authorization", "Bearer " + groqApiKey)
                    .header("Content-Type", "application/json; charset=UTF-8")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody, java.nio.charset.StandardCharsets.UTF_8))
                    .timeout(Duration.ofSeconds(15))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(java.nio.charset.StandardCharsets.UTF_8));
            if (response.statusCode() == 200) {
                JsonNode root   = objectMapper.readTree(response.body());
                String   result = root.path("choices").get(0).path("message").path("content").asText();
                if (result != null) result = result.replaceAll("[\"'\\[\\]]", "").trim();
                log.info("[Groq AI] Keywords generated: '{}'", result);
                return result;
            } else {
                log.error("[Groq AI] Error {}: {}", response.statusCode(), response.body());
            }
        } catch (Exception e) {
            log.error("[Groq AI] Failed to generate sign language keywords", e);
        }
        return "";
    }

    private VideoInfoResponse mapToResponse(YoutubeVideo video) {
        boolean hasCached = (video.getSignLanguage() != null && !video.getSignLanguage().isBlank()) ||
                            (video.getSignLanguageScripts() != null && !video.getSignLanguageScripts().isEmpty());
        return VideoInfoResponse.builder()
                .id(video.getId())
                .videoId(video.getVideoId())
                .videoUrl(video.getVideoUrl())
                .title(video.getTitle())
                .signLanguage(video.getSignLanguage())
                .signLanguageScripts(video.getSignLanguageScripts())
                .hasCachedScripts(hasCached)
                .isProcessed(Boolean.TRUE.equals(video.getIsProcessed()))
                .viewCount(video.getViewCount() == null ? 1 : video.getViewCount())
                .lastAccessedAt(video.getLastAccessedAt())
                .createdAt(video.getCreatedAt())
                .updatedAt(video.getUpdatedAt())
                .build();
    }
}
