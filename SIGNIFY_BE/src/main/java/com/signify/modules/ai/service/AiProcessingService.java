package com.signify.modules.ai.service;

import com.signify.modules.ai.dto.SignData;
import com.signify.modules.ai.dto.TranscriptEvent;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

@Service
@Slf4j
public class AiProcessingService {

    @org.springframework.beans.factory.annotation.Value("${gemini.api-key}")
    private String geminiApiKey;

    @org.springframework.beans.factory.annotation.Value("${server.port:8080}")
    private String serverPort;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .followRedirects(HttpClient.Redirect.NORMAL)
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    public List<TranscriptEvent> getYouTubeTranscript(String videoId) throws Exception {
        log.info("Fetching YouTube transcript for video ID: {}", videoId);
        String url = "https://www.youtube.com/watch?v=" + videoId;
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                .header("Accept-Language", "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7")
                .GET()
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200) {
            throw new RuntimeException("Failed to fetch YouTube page: HTTP " + response.statusCode());
        }

        String html = response.body();
        String jsonStr = extractPlayerResponse(html);
        if (jsonStr == null) {
            throw new RuntimeException("Could not find ytInitialPlayerResponse in YouTube page HTML.");
        }

        ObjectMapper mapper = new ObjectMapper();
        JsonNode root = mapper.readTree(jsonStr);
        
        JsonNode captionsNode = root.path("captions")
                .path("playerCaptionsTracklistRenderer")
                .path("captionTracks");
                
        if (captionsNode.isMissingNode() || !captionsNode.isArray() || captionsNode.isEmpty()) {
            throw new RuntimeException("No captions found for this video.");
        }

        // Find Vietnamese track first, then English, then first available
        String captionUrl = null;
        for (JsonNode track : captionsNode) {
            String langCode = track.path("languageCode").asText("");
            if (langCode.startsWith("vi")) {
                captionUrl = track.path("baseUrl").asText();
                break;
            }
        }
        
        if (captionUrl == null) {
            for (JsonNode track : captionsNode) {
                String langCode = track.path("languageCode").asText("");
                if (langCode.startsWith("en")) {
                    captionUrl = track.path("baseUrl").asText();
                    break;
                }
            }
        }
        
        if (captionUrl == null) {
            captionUrl = captionsNode.get(0).path("baseUrl").asText();
        }
        
        if (captionUrl == null || captionUrl.isEmpty()) {
            throw new RuntimeException("Caption URL is missing.");
        }
        
        // Fetch caption track in JSON3 format
        String json3Url = captionUrl + "&fmt=json3";
        HttpRequest captionRequest = HttpRequest.newBuilder()
                .uri(URI.create(json3Url))
                .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                .GET()
                .build();
                
        HttpResponse<String> captionResponse = httpClient.send(captionRequest, HttpResponse.BodyHandlers.ofString());
        if (captionResponse.statusCode() != 200) {
            throw new RuntimeException("Failed to fetch caption data: HTTP " + captionResponse.statusCode());
        }
        
        JsonNode captionRoot = mapper.readTree(captionResponse.body());
        JsonNode eventsNode = captionRoot.path("events");
        List<TranscriptEvent> events = new ArrayList<>();
        
        if (eventsNode.isArray()) {
            for (JsonNode ev : eventsNode) {
                JsonNode segsNode = ev.path("segs");
                if (segsNode.isMissingNode() || !segsNode.isArray() || segsNode.isEmpty()) {
                    continue;
                }
                
                StringBuilder sb = new StringBuilder();
                for (JsonNode seg : segsNode) {
                    sb.append(seg.path("utf8").asText(""));
                }
                
                String text = sb.toString().replace("\n", " ").trim();
                if (text.isEmpty()) {
                    continue;
                }
                
                long tStartMs = ev.path("tStartMs").asLong();
                long dDurationMs = ev.path("dDurationMs").asLong(0);
                
                events.add(TranscriptEvent.builder()
                        .start(tStartMs)
                        .end(tStartMs + dDurationMs)
                        .text(text)
                        .build());
            }
        }
        
        return events;
    }

    private String extractPlayerResponse(String html) {
        int startIdx = html.indexOf("ytInitialPlayerResponse");
        if (startIdx == -1) return null;
        
        int openBraceIdx = html.indexOf("{", startIdx);
        if (openBraceIdx == -1) return null;
        
        int braceCount = 1;
        int endIdx = openBraceIdx + 1;
        while (braceCount > 0 && endIdx < html.length()) {
            char c = html.charAt(endIdx);
            if (c == '{') {
                braceCount++;
            } else if (c == '}') {
                braceCount--;
            }
            endIdx++;
        }
        
        if (braceCount == 0) {
            return html.substring(openBraceIdx, endIdx);
        }
        return null;
    }


    // Vietnamese Sign Language Stopwords
    private static final Set<String> VIETNAMESE_STOPWORDS = new HashSet<>(Arrays.asList(
            "nè", "nha", "nhé", "nhỉ", "à", "ơi", "ớ", "ừ", "dạ", "vâng", "bạn", "các", "kiểu", "cơ", "đấy", "thế",
            "này", "kia", "nọ", "nhe", "nha", "ờ", "ờm", "thì", "mà",
            "là", "còn", "và", "hoặc", "nhưng", "tuy", "tại", "do", "bởi", "đang", "đã", "vừa", "mới", "sẽ",
            "cũng", "như", "nó", "họ", "chúng", "mình", "tôi", "tớ", "ta", "cậu", "chúng tôi", "chúng ta",
            "này", "đó", "ấy", "rồi", "lại", "nơi", "nào", "gì", "ai", "đâu", "sao", "bao", "quá", "rất", "lắm", "hơi",
            "cực", "kỳ", "món", "để", "cho", "hơn",
            ">>", "<<", "->", "=>", "http", "https", ">", "<", "các kiểu"
    ));

    // Dictionary lookup with AI processing fallback
    public List<SignData> dictionaryLookup(List<String> words, String text) {
        if (text != null && !text.trim().isEmpty()) {
            log.info("Performing AI-enhanced dictionary lookup for sentence: '{}'", text);
            List<String> aiGlosses = translateTextToGloss(text);
            if (aiGlosses != null && !aiGlosses.isEmpty()) {
                log.info("AI successfully translated sentence into {} sign language glosses.", aiGlosses.size());
                return mapKeywordsToSignData(aiGlosses);
            }
            log.warn("AI translation failed or returned empty. Falling back to rule-based words.");
        }
        
        log.info("Dictionary lookup for {} words (no AI processing / fallback)", words.size());
        return mapKeywordsToSignData(words);
    }

    public List<String> translateTextToGloss(String text) {
        if (geminiApiKey == null || geminiApiKey.isEmpty() || geminiApiKey.startsWith("${")) {
            log.warn("Gemini API key is not configured. Falling back to rule-based segmentation.");
            return null;
        }

        try {
            log.info("Translating text to sign language glosses using Gemini AI: '{}'", text);
            String prompt = "Hãy đóng vai một chuyên gia ngôn ngữ ký hiệu Việt Nam (Vietnamese Sign Language). Dịch câu phụ đề tiếng Việt thông thường sau đây thành một danh sách (JSON array of strings) các từ khóa cử chỉ ký hiệu tương ứng dành cho người câm điếc Việt Nam. Quy tắc:\n" +
                    "1. Bỏ qua các đại từ thừa, từ nối, từ chỉ thái độ không có cử chỉ ký hiệu riêng (như: thì, mà, là, sẽ, đã, đang, rất, quá, cực kỳ, nhé, nha, à, ơi...).\n" +
                    "2. Cố gắng giữ lại các động từ, danh từ, tính từ chính cốt lõi.\n" +
                    "3. Nếu có từ ghép hoặc cụm từ ghép có nghĩa rõ ràng (như 'cơm chiên hải sản', 'xin chào', 'mọi người'), hãy giữ chúng thành một cụm từ đơn trong mảng thay vì tách rời.\n" +
                    "4. Trả về định dạng JSON array chứa các chuỗi chữ thường.\n\n" +
                    "Câu cần dịch: \"" + text.replace("\"", "\\\"") + "\"";

            Map<String, Object> parts = Map.of("text", prompt);
            Map<String, Object> contents = Map.of("parts", List.of(parts));
            Map<String, Object> generationConfig = Map.of("responseMimeType", "application/json");
            Map<String, Object> requestBodyMap = Map.of(
                    "contents", List.of(contents),
                    "generationConfig", generationConfig
            );

            ObjectMapper mapper = new ObjectMapper();
            String requestBody = mapper.writeValueAsString(requestBodyMap);

            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + geminiApiKey;

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .timeout(Duration.ofSeconds(6)) // Fail fast if API is slow
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                log.warn("Gemini API call failed with status: {}. Body: {}", response.statusCode(), response.body());
                return null;
            }

            JsonNode rootNode = mapper.readTree(response.body());
            JsonNode candidateTextNode = rootNode.path("candidates")
                    .path(0)
                    .path("content")
                    .path("parts")
                    .path(0)
                    .path("text");

            if (candidateTextNode.isMissingNode()) {
                log.warn("Could not find generated text in Gemini response.");
                return null;
            }

            String aiResponseText = candidateTextNode.asText().trim();
            log.info("Gemini raw response: {}", aiResponseText);

            JsonNode jsonNode = mapper.readTree(aiResponseText);
            if (jsonNode.isArray()) {
                List<String> glosses = new ArrayList<>();
                for (JsonNode node : jsonNode) {
                    glosses.add(node.asText());
                }
                return glosses;
            }

            return null;
        } catch (Exception e) {
            log.error("Failed to translate text to sign language glosses using Gemini AI", e);
            return null;
        }
    }

    private List<SignData> mapKeywordsToSignData(List<String> keywords) {
        List<SignData> signDataList = new ArrayList<>();
        for (String word : keywords) {
            String cleanWord = word.trim().toLowerCase().replaceAll("^[.,?!\\-\"]+|[.,?!\\-\"]+$", "");
            if (cleanWord.isEmpty() || VIETNAMESE_STOPWORDS.contains(cleanWord)) continue;

            String cleanWordNoAccents = stripVietnameseAccents(cleanWord).replace(" ", "-");
            String dynamicUrl = "http://127.0.0.1:" + serverPort + "/assets/animations/" + cleanWordNoAccents + ".mp4";

            signDataList.add(SignData.builder()
                    .word(cleanWord)
                    .animation(dynamicUrl)
                    .build());
        }
        return signDataList;
    }

    private String stripVietnameseAccents(String str) {
        if (str == null) return null;
        String normalized = java.text.Normalizer.normalize(str, java.text.Normalizer.Form.NFD);
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
        String temp = pattern.matcher(normalized).replaceAll("");
        return temp.replace('đ', 'd').replace('Đ', 'D');
    }
}