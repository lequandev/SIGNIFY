package com.signify.modules.ai.service;

import com.signify.modules.ai.dto.SignData;
import com.signify.modules.ai.dto.TranscriptEvent;
import com.signify.modules.ai.model.GlossCacheEntry;
import com.signify.modules.ai.model.GlossaryTerm;
import com.signify.modules.ai.repository.GlossCacheRepository;
import com.signify.modules.ai.repository.GlossaryTermRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
@Slf4j
@RequiredArgsConstructor
public class AiProcessingService {

    private final GlossCacheRepository glossCacheRepository;
    private final GlossaryTermRepository glossaryTermRepository;

    // Executor để chạy Gemini ở NỀN (không chặn request của người dùng).
    // 1 luồng duy nhất -> các câu xếp hàng lần lượt, tránh bắn dồn dập gây 429 (quota/rate limit).
    private final ExecutorService backgroundExecutor = Executors.newSingleThreadExecutor();

    // Chống gửi trùng cùng một câu lên Gemini khi nhiều request nền dồn tới.
    private final java.util.Set<String> inFlightGemini =
            java.util.Collections.synchronizedSet(new java.util.HashSet<>());

    // Rate-limit toàn cục: đảm bảo cách nhau tối thiểu giữa 2 lần gọi Gemini để không vượt hạn mức.
    private static final long MIN_GAP_MS = 1500;
    private volatile long lastGeminiCallAt = 0;

    @org.springframework.beans.factory.annotation.Value("${gemini.api-key}")
    private String geminiApiKey;

    @org.springframework.beans.factory.annotation.Value("${anthropic.api-key:}")
    private String anthropicApiKey;

    @org.springframework.beans.factory.annotation.Value("${anthropic.model:claude-3-5-haiku-20241022}")
    private String anthropicModel;

    @org.springframework.beans.factory.annotation.Value("${groq.api-key:}")
    private String groqApiKey;

    @org.springframework.beans.factory.annotation.Value("${groq.model:llama-3.3-70b-versatile}")
    private String groqModel;

    @org.springframework.beans.factory.annotation.Value("${server.port:8080}")
    private String serverPort;

    // URL gốc video trên Cloudinary. Nếu để trống -> rơi về serve local (dev).
    @org.springframework.beans.factory.annotation.Value("${cloudinary.video-base-url:}")
    private String cloudinaryVideoBaseUrl;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .followRedirects(HttpClient.Redirect.NORMAL)
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    private final ObjectMapper objectMapper = new ObjectMapper();

    @jakarta.annotation.PostConstruct
    public void init() {
        try {
            seedGlossaryIfEmpty();
        } catch (Exception e) {
            log.warn("Seed glossary lúc khởi động thất bại: {}", e.getMessage());
        }
        try {
            loadSlugAliases();
        } catch (Exception e) {
            log.warn("Nạp slug alias lúc khởi động thất bại: {}", e.getMessage());
        }
    }

    // Cache kết quả segmentation theo câu đã chuẩn hóa -> tránh gọi lại Gemini cho câu lặp,
    // giúp phản hồi gần như tức thì. Giới hạn kích thước để không phình bộ nhớ.
    private final java.util.Map<String, List<String>> segmentCache =
            java.util.Collections.synchronizedMap(new java.util.LinkedHashMap<>() {
                @Override
                protected boolean removeEldestEntry(java.util.Map.Entry<String, List<String>> eldest) {
                    return size() > 500;
                }
            });

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

        // Chọn track theo thứ tự ưu tiên. Với mỗi ngôn ngữ, ưu tiên phụ đề thủ công
        // (kind != "asr") hơn phụ đề tự sinh để có chất lượng cào tốt hơn.
        String captionUrl = pickCaptionUrl(captionsNode, "vi");
        if (captionUrl == null) captionUrl = pickCaptionUrl(captionsNode, "en");
        if (captionUrl == null) captionUrl = pickCaptionUrl(captionsNode, null);

        if (captionUrl == null || captionUrl.isEmpty()) {
            throw new RuntimeException("Caption URL is missing.");
        }

        // Thử lần lượt nhiều format cho tới khi parse được sự kiện phụ đề.
        String[] formats = {"&fmt=json3", "&fmt=srv3", "&fmt=srv1", ""};
        List<TranscriptEvent> events = new ArrayList<>();
        Exception lastError = null;
        for (String fmt : formats) {
            try {
                String captionUrlWithFmt = captionUrl + fmt;
                HttpRequest captionRequest = HttpRequest.newBuilder()
                        .uri(URI.create(captionUrlWithFmt))
                        .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                        .header("Accept-Language", "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7")
                        .GET()
                        .build();

                HttpResponse<String> captionResponse = httpClient.send(captionRequest, HttpResponse.BodyHandlers.ofString());
                if (captionResponse.statusCode() != 200) {
                    lastError = new RuntimeException("HTTP " + captionResponse.statusCode() + " for fmt=" + (fmt.isEmpty() ? "default" : fmt));
                    continue;
                }

                events = parseCaptionBody(captionResponse.body(), mapper);
                if (!events.isEmpty()) {
                    log.info("Fetched {} transcript events using fmt={}", events.size(), fmt.isEmpty() ? "default" : fmt);
                    break;
                }
            } catch (Exception e) {
                lastError = e;
                log.warn("Caption fetch failed for fmt={}: {}", fmt.isEmpty() ? "default" : fmt, e.getMessage());
            }
        }

        if (events.isEmpty() && lastError != null) {
            throw new RuntimeException("Failed to fetch caption data: " + lastError.getMessage());
        }

        return events;
    }

    /**
     * Chọn baseUrl phụ đề cho một ngôn ngữ. Nếu languagePrefix null thì lấy track đầu tiên.
     * Ưu tiên track thủ công (kind != "asr") hơn track tự sinh.
     */
    private String pickCaptionUrl(JsonNode captionsNode, String languagePrefix) {
        String asrFallback = null;
        for (JsonNode track : captionsNode) {
            String langCode = track.path("languageCode").asText("");
            if (languagePrefix != null && !langCode.startsWith(languagePrefix)) {
                continue;
            }
            String url = track.path("baseUrl").asText("");
            if (url.isEmpty()) continue;

            boolean isAsr = "asr".equals(track.path("kind").asText(""));
            if (!isAsr) {
                return url; // Ưu tiên thủ công
            }
            if (asrFallback == null) {
                asrFallback = url;
            }
        }
        return asrFallback;
    }

    /** Parse body caption dạng json3 (events/segs) hoặc XML timedtext (<text>) thành TranscriptEvent. */
    private List<TranscriptEvent> parseCaptionBody(String body, ObjectMapper mapper) {
        List<TranscriptEvent> events = new ArrayList<>();
        if (body == null || body.trim().isEmpty()) return events;

        String trimmed = body.trim();

        // Thử JSON3 trước
        if (trimmed.startsWith("{")) {
            try {
                JsonNode captionRoot = mapper.readTree(trimmed);
                JsonNode eventsNode = captionRoot.path("events");
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
                        if (text.isEmpty()) continue;

                        long tStartMs = ev.path("tStartMs").asLong();
                        long dDurationMs = ev.path("dDurationMs").asLong(0);
                        events.add(TranscriptEvent.builder()
                                .start(tStartMs)
                                .end(tStartMs + dDurationMs)
                                .text(text)
                                .build());
                    }
                    return events;
                }
            } catch (Exception e) {
                log.warn("JSON3 caption parse failed, trying XML: {}", e.getMessage());
            }
        }

        // Fallback: XML timedtext (<text start="..." dur="...">...</text>)
        try {
            javax.xml.parsers.DocumentBuilderFactory factory = javax.xml.parsers.DocumentBuilderFactory.newInstance();
            factory.setFeature("http://apache.org/xml/features/nonvalidating/load-external-dtd", false);
            org.w3c.dom.Document doc = factory.newDocumentBuilder()
                    .parse(new java.io.ByteArrayInputStream(trimmed.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
            org.w3c.dom.NodeList textNodes = doc.getElementsByTagName("text");
            for (int i = 0; i < textNodes.getLength(); i++) {
                org.w3c.dom.Node node = textNodes.item(i);
                String content = node.getTextContent();
                if (content == null) continue;
                // Giải mã HTML entity cơ bản và bỏ tag còn sót
                content = content.replaceAll("<[^>]+>", "")
                        .replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
                        .replace("&#39;", "'").replace("&quot;", "\"").replace("\n", " ").trim();
                if (content.isEmpty()) continue;

                org.w3c.dom.NamedNodeMap attrs = node.getAttributes();
                double startSec = attrs.getNamedItem("start") != null
                        ? Double.parseDouble(attrs.getNamedItem("start").getNodeValue()) : 0;
                double durSec = attrs.getNamedItem("dur") != null
                        ? Double.parseDouble(attrs.getNamedItem("dur").getNodeValue()) : 0;
                long startMs = (long) (startSec * 1000);
                long endMs = (long) ((startSec + durSec) * 1000);
                events.add(TranscriptEvent.builder().start(startMs).end(endMs).text(content).build());
            }
        } catch (Exception e) {
            log.warn("XML caption parse failed: {}", e.getMessage());
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
    // Lưu ý: KHÔNG đưa đại từ nhân xưng (tôi, bạn, họ, nó, mình, ta, chúng ta...) vào đây
    // vì chúng mang nghĩa và có ký hiệu riêng — loại bỏ sẽ làm mất nghĩa câu.
    private static final Set<String> VIETNAMESE_STOPWORDS = new HashSet<>(Arrays.asList(
            "nè", "nha", "nhé", "nhỉ", "à", "ơi", "ớ", "ừ", "dạ", "vâng", "các", "kiểu", "cơ", "đấy", "thế",
            "này", "kia", "nọ", "nhe", "ờ", "ờm", "thì", "mà",
            "là", "còn", "và", "hoặc", "nhưng", "tuy", "tại", "do", "bởi", "đang", "đã", "vừa", "mới", "sẽ",
            "cũng", "như",
            "đó", "ấy", "rồi", "lại", "nơi", "nào", "gì", "đâu", "sao", "bao", "quá", "rất", "lắm", "hơi",
            "cực", "kỳ", "món", "để", "cho", "hơn",
            ">>", "<<", "->", "=>", "http", "https", ">", "<", "các kiểu"
    ));

    // Dictionary lookup with AI processing fallback
    public List<SignData> dictionaryLookup(List<String> words, String text) {
        // Dịch text sang tiếng Việt nếu cần
        String vietnameseText = translateToVietnamese(text);
        return mapKeywordsToSignData(segmentText(words, vietnameseText));
    }

    /**
     * Tách một câu tiếng Việt thành danh sách các đơn vị ký hiệu có nghĩa.
     * Ưu tiên Gemini AI; nếu không có key / lỗi / rỗng thì rơi về bộ tách rule-based.
     * Trả về danh sách chuỗi (giữ nguyên chữ hoa của từ viết tắt).
     */
    public List<String> segmentText(List<String> words, String text) {
        if (text == null || text.trim().isEmpty()) {
            // Không có câu đầy đủ: dùng danh sách từ do client gửi (lọc stopword cơ bản)
            if (words == null) return new ArrayList<>();
            List<String> filtered = new ArrayList<>();
            for (String w : words) {
                if (isMeaningfulWord(w)) filtered.add(w.trim());
            }
            return filtered;
        }

        // Lọc nội dung trong ngoặc trước khi xử lý
        String filteredText = filterBracketedContent(text);
        if (filteredText == null || filteredText.trim().isEmpty()) {
            log.info("Text sau khi lọc bracketed content rỗng, trả về empty list.");
            return new ArrayList<>();
        }
        String key = normalizeKey(filteredText);

        // TẦNG 1 — glossary thủ công (chính xác nhất, do người duyệt). Tra nếu cả câu trùng.
        Optional<GlossaryTerm> term = glossaryTermRepository.findByPhrase(key);
        if (term.isPresent() && term.get().getGlosses() != null && !term.get().getGlosses().isEmpty()) {
            log.info("Glossary HIT (manual) for: '{}'", text);
            return term.get().getGlosses();
        }

        // TẦNG 2 — cache RAM (nhanh nhất trong tiến trình)
        List<String> ram = segmentCache.get(key);
        if (ram != null) {
            log.info("Segment cache HIT (RAM) for: '{}'", text);
            return ram;
        }

        // TẦNG 3 — cache bền MongoDB
        Optional<GlossCacheEntry> persisted = glossCacheRepository.findById(key);
        if (persisted.isPresent() && persisted.get().getGlosses() != null && !persisted.get().getGlosses().isEmpty()) {
            List<String> g = persisted.get().getGlosses();
            segmentCache.put(key, g); // nạp lên RAM cho lần sau
            log.info("Segment cache HIT (Mongo, source={}) for: '{}'", persisted.get().getSource(), text);
            // Nếu cache đang là rule-based, thử nâng cấp lên Gemini ở nền.
            if ("rule".equals(persisted.get().getSource())) {
                triggerBackgroundGeminiUpgrade(key, text);
            }
            return g;
        }

        // MISS hoàn toàn.
        // Nếu có LLM (Groq): gọi ĐỒNG BỘ để trả về đúng bản chất lượng cao ngay cho client
        // (Groq trả <1s nên chấp nhận chờ). Chỉ khi LLM lỗi/timeout mới rơi về rule-based.
        if (groqConfigured()) {
            log.info("Segment MISS -> gọi Groq đồng bộ cho: '{}'", filteredText);
            List<String> aiGlosses = translateTextToGloss(filteredText);
            if (aiGlosses != null && !aiGlosses.isEmpty()) {
                saveCache(key, aiGlosses, "gemini");
                segmentCache.put(key, aiGlosses);
                return aiGlosses;
            }
            log.warn("Groq lỗi/rỗng -> tạm dùng rule-based cho: '{}'", filteredText);
        }

        // Không có LLM (hoặc LLM lỗi): trả rule-based ngay, và thử nâng cấp nền cho lần sau.
        log.info("Segment MISS -> rule-based cho: '{}'", filteredText);
        List<String> ruleBased = ruleBasedSegment(filteredText);
        saveCache(key, ruleBased, "rule");
        segmentCache.put(key, ruleBased);
        triggerBackgroundGeminiUpgrade(key, filteredText);
        return ruleBased;
    }

    /** Chuẩn hóa khóa cache/glossary: trim + gộp khoảng trắng + lowercase. */
    private String normalizeKey(String text) {
        return text.trim().replaceAll("\\s+", " ").toLowerCase();
    }

    /** Xóa toàn bộ RAM cache segmentation. */
    public void clearSegmentCache() {
        segmentCache.clear();
        log.info("RAM segmentation cache cleared.");
    }

    /** Xóa toàn bộ MongoDB cache segmentation. */
    public void clearMongoCache() {
        glossCacheRepository.deleteAll();
        log.info("MongoDB segmentation cache cleared.");
    }

    /** Dịch text từ bất kỳ ngôn ngữ nào sang tiếng Việt bằng Groq AI */
    public String translateToVietnamese(String text) {
        // Nếu text đã là tiếng Việt thì khỏi gọi AI (tiết kiệm request + độ trễ).
        if (isLikelyVietnamese(text)) {
            log.info("Text đã là tiếng Việt, bỏ qua bước dịch: '{}'", text);
            return text;
        }
        if (!groqConfigured()) {
            log.warn("Groq API key chưa được cấu hình. Không thể dịch sang tiếng Việt.");
            return text;
        }

        try {
            log.info("Translating text to Vietnamese using Groq: '{}'", text);

            String systemPrompt = "Bạn là dịch giả chuyên nghiệp. Nhiệm vụ: dịch đoạn văn bản từ bất kỳ ngôn ngữ nào sang tiếng Việt tự nhiên, chính xác. " +
                    "QUY TẮC:\n" +
                    "1. Giữ nguyên ý nghĩa và ngữ cảnh của văn bản gốc.\n" +
                    "2. Dùng từ ngữ phù hợp với văn phong giao tiếp thông thường.\n" +
                    "3. Nếu văn bản gốc đã là tiếng Việt, trả về nguyên văn.\n" +
                    "4. CHỈ trả về đoạn văn bản đã dịch, KHÔNG kèm giải thích, KHÔNG markdown.";

            Map<String, Object> userMsg = Map.of("role", "user", "content", text);

            String requestBody = objectMapper.writeValueAsString(Map.of(
                    "model", groqModel,
                    "messages", List.of(
                            Map.of("role", "system", "content", systemPrompt),
                            userMsg
                    ),
                    "temperature", 0.3,
                    "max_tokens", 500
            ));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.groq.com/openai/v1/chat/completions"))
                    .header("Authorization", "Bearer " + groqApiKey)
                    .header("Content-Type", "application/json; charset=UTF-8")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody, java.nio.charset.StandardCharsets.UTF_8))
                    .timeout(Duration.ofSeconds(30))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(java.nio.charset.StandardCharsets.UTF_8));

            if (response.statusCode() != 200) {
                log.error("Groq API error: {}", response.body());
                return text;
            }

            JsonNode root = objectMapper.readTree(response.body());
            log.info("Groq translation raw response: {}", response.body());
            String translatedText = root.path("choices").get(0).path("message").path("content").asText();

            log.info("Translated to Vietnamese: '{}' -> '{}'", text, translatedText);
            return translatedText;

        } catch (Exception e) {
            log.error("Failed to translate to Vietnamese using Groq", e);
            return text;
        }
    }

    /** Lưu (hoặc cập nhật) cache bền. */
    private void saveCache(String key, List<String> glosses, String source) {
        if (glosses == null || glosses.isEmpty()) return;
        try {
            glossCacheRepository.save(GlossCacheEntry.builder()
                    .id(key)
                    .glosses(glosses)
                    .source(source)
                    .updatedAt(LocalDateTime.now())
                    .build());
        } catch (Exception e) {
            log.warn("Không lưu được gloss cache cho '{}': {}", key, e.getMessage());
        }
    }

    /**
     * Chạy Gemini ở NỀN cho câu chưa có bản chất lượng cao. Kết quả ghi đè cache
     * (source="gemini"). Người dùng hiện tại không phải chờ; lần sau gặp lại câu này
     * sẽ được trả bản Gemini tức thì.
     */
    private void triggerBackgroundGeminiUpgrade(String key, String originalText) {
        if (!groqConfigured()) {
            return; // không có key thì khỏi thử
        }
        // Lọc nội dung trong ngoặc trước khi xử lý
        String filteredText = filterBracketedContent(originalText);
        // Bỏ qua câu quá ngắn/rác (đỡ tốn quota): cần ít nhất 2 từ có nghĩa.
        if (filteredText.trim().split("\\s+").length < 2) {
            return;
        }
        if (!inFlightGemini.add(key)) {
            return; // đã có một tác vụ nền cho câu này
        }
        backgroundExecutor.submit(() -> {
            try {
                // Giãn cách tối thiểu giữa 2 lần gọi Gemini để tránh 429.
                long wait = MIN_GAP_MS - (System.currentTimeMillis() - lastGeminiCallAt);
                if (wait > 0) {
                    try { Thread.sleep(wait); } catch (InterruptedException ignored) {}
                }
                lastGeminiCallAt = System.currentTimeMillis();

                List<String> aiGlosses = translateTextToGloss(filteredText);
                if (aiGlosses != null && !aiGlosses.isEmpty()) {
                    segmentCache.put(key, aiGlosses);
                    saveCache(key, aiGlosses, "gemini");
                    log.info("[NỀN] Đã nâng cấp gloss (Gemini) cho: '{}' -> {}", filteredText, aiGlosses);
                }
            } catch (Exception e) {
                log.warn("[NỀN] Gemini nâng cấp thất bại cho '{}': {}", filteredText, e.getMessage());
            } finally {
                inFlightGemini.remove(key);
            }
        });
    }


    private boolean groqConfigured() {
        return groqApiKey != null && !groqApiKey.isEmpty()
                && !groqApiKey.startsWith("${") && !groqApiKey.startsWith("PASTE_");
    }

    /** Loại bỏ nội dung trong ngoặc vuông, ngoặc kép, ngoặc đơn (như [âm nhạc], <<...>>, (...)) */
    private String filterBracketedContent(String text) {
        if (text == null || text.trim().isEmpty()) return text;
        // Loại bỏ [nội dung], <<nội dung>>, (nội dung)
        String cleaned = text.replaceAll("\\[.*?\\]", "")
                           .replaceAll("<<.*?>>", "")
                           .replaceAll("\\(.*?\\)", "");
        // Dọn dẹp khoảng trắng thừa sau khi xóa
        cleaned = cleaned.replaceAll("\\s+", " ").trim();
        return cleaned;
    }

    public List<String> translateTextToGloss(String text) {
        if (!groqConfigured()) {
            log.warn("Groq API key chưa được cấu hình (đặt GROQ_API_KEY trong .env). Dùng bộ tách rule-based.");
            return null;
        }

        try {
            String filteredText = filterBracketedContent(text);
            if (filteredText == null || filteredText.trim().isEmpty()) {
                log.warn("Text sau khi lọc bracketed content rỗng, bỏ qua gọi Groq.");
                return null;
            }
            log.info("Translating text to sign language glosses using Groq: '{}'", filteredText);
            String systemPrompt = "Bạn là chuyên gia ngôn ngữ ký hiệu Việt Nam (Vietnamese Sign Language). " +
                    "Nhiệm vụ: tách câu phụ đề tiếng Việt thành danh sách các đơn vị cử chỉ ký hiệu có nghĩa cho người câm điếc.\n\n" +
                    "QUY TẮC:\n" +
                    "1. Bỏ qua đại từ thừa, giới từ, từ nối, từ chỉ thái độ/mức độ không có cử chỉ riêng (và, của, về, cách, thì, mà, là, sẽ, đã, đang, rất, quá, cực kỳ, nhé, nha, à, ơi, các, những...).\n" +
                    "2. Giữ lại động từ, danh từ, tính từ chính mang nội dung.\n" +
                    "3. Gộp từ ghép/cụm có nghĩa rõ ràng thành MỘT phần tử (ví dụ: 'trí tuệ nhân tạo', 'cuộc sống hiện đại', 'xin chào', 'mọi người', 'tìm hiểu', 'buồn ngủ', 'đá bóng').\n" +
                    "4. Giữ nguyên chữ HOA của từ viết tắt/tên riêng (AI, GDP, USA); từ thường viết chữ thường.\n" +
                    "5. Giữ đúng thứ tự xuất hiện trong câu.\n" +
                    "6. CHỈ trả về một JSON array các chuỗi, KHÔNG kèm giải thích, KHÔNG markdown.\n\n" +
                    "QUAN TRỌNG: Xử lý CÂU ĐƯỢC GỬI trong user message, KHÔNG trả về ví dụ này.\n\n" +
                    "Ví dụ tham khảo (để hiểu format, KHÔNG copy output):\n" +
                    "Input: \"Hôm nay chúng ta sẽ tìm hiểu về trí tuệ nhân tạo và cách AI đang thay đổi cuộc sống hiện đại.\"\n" +
                    "Output: [\"hôm nay\", \"tìm hiểu\", \"trí tuệ nhân tạo\", \"AI\", \"thay đổi\", \"cuộc sống hiện đại\"]";

            ObjectMapper mapper = new ObjectMapper();
            // Groq tương thích OpenAI: messages [system, user].
            Map<String, Object> sysMsg = Map.of("role", "system", "content", systemPrompt);
            Map<String, Object> userMsg = Map.of("role", "user", "content", filteredText);
            Map<String, Object> requestBodyMap = Map.of(
                    "model", groqModel,
                    "max_tokens", 512,
                    "temperature", 0,
                    "messages", List.of(sysMsg, userMsg)
            );
            String requestBody = mapper.writeValueAsString(requestBodyMap);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.groq.com/openai/v1/chat/completions"))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + groqApiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .timeout(Duration.ofSeconds(20))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                log.warn("Groq API call failed with status: {}. Body: {}", response.statusCode(), response.body());
                return null;
            }

            // Phản hồi OpenAI-style: { choices: [ { message: { content: "..." } } ] }
            JsonNode rootNode = mapper.readTree(response.body());
            JsonNode textNode = rootNode.path("choices").path(0).path("message").path("content");
            if (textNode.isMissingNode()) {
                log.warn("Could not find generated text in Groq response. Body: {}", response.body());
                return null;
            }

            String aiResponseText = stripMarkdownFence(textNode.asText().trim());
            log.info("Groq raw response: {}", aiResponseText);

            JsonNode jsonNode = mapper.readTree(aiResponseText);
            if (jsonNode.isArray()) {
                List<String> glosses = new ArrayList<>();
                for (JsonNode node : jsonNode) {
                    String g = node.asText().trim();
                    if (!g.isEmpty()) glosses.add(g);
                }
                return glosses;
            }

            return null;
        } catch (Exception e) {
            log.error("Failed to translate text to sign language glosses using Groq", e);
            return null;
        }
    }

    private List<SignData> mapKeywordsToSignData(List<String> keywords) {
        List<SignData> signDataList = new ArrayList<>();
        for (String word : keywords) {
            String displayWord = word.trim().replaceAll("^[.,?!\\-\"]+|[.,?!\\-\"]+$", "");
            if (displayWord.isEmpty()) continue;
            if (!isMeaningfulWord(displayWord)) continue;

            // displayWord giữ nguyên chữ hoa (ví dụ "AI") để hiển thị.
            String animationUrl = resolveAnimationUrl(displayWord);

            signDataList.add(SignData.builder()
                    .word(displayWord)
                    .animation(animationUrl)
                    .build());
        }
        return signDataList;
    }

    // Alias: một số gloss AI trả về không trùng tên file video. Map về slug thật trên Cloudinary.
    // Khóa alias là slug đã chuẩn hóa (không dấu, chữ thường, nối '-'); giá trị là slug video đích.
    // Nạp từ file CSV (video.slug-aliases-file) lúc khởi động -> thêm/sửa bằng Excel, không build lại,
    // chỉ cần restart. Mỗi dòng = 1 video, gom mọi từ đồng nghĩa: canonical,slug,aliases (ngăn bằng '|').
    private final Map<String, String> slugAliases = new java.util.concurrent.ConcurrentHashMap<>();

    // Đường dẫn file CSV alias — MỘT file duy nhất, mặc định "slug-aliases.csv" ở thư mục chạy
    // backend. Đổi đường dẫn qua VIDEO_SLUG_ALIASES_FILE trong .env nếu để chỗ khác.
    @org.springframework.beans.factory.annotation.Value("${video.slug-aliases-file:slug-aliases.csv}")
    private String slugAliasesFile;

    // Slug video mặc định khi không tìm được video phù hợp (đứng im).
    private static final String FALLBACK_SLUG = "dung-im";

    /**
     * Nạp alias từ file CSV. Định dạng mỗi dòng: canonical,slug,aliases
     * - canonical: tên hiển thị (chỉ để người đọc, không dùng để so khớp).
     * - slug: PUBLIC ID THẬT trên Cloudinary, giữ NGUYÊN VĂN (ví dụ "nha_oktegb", có hậu tố).
     *         KHÔNG chuẩn hóa cột này vì Cloudinary tự thêm hậu tố ngẫu nhiên (_oktegb...).
     * - aliases: các từ đồng nghĩa, ngăn nhau bằng '|' hoặc ',' (ví dụ "siêng|siêng năng|cần cù").
     * Alias VÀ canonical được chuẩn hóa qua toSlug() làm KHÓA, map về public id (giá trị) đích.
     * Đọc một file CSV duy nhất cạnh backend; tự bỏ BOM nếu Excel chèn.
     */
    public void loadSlugAliases() {
        slugAliases.clear();
        List<String> lines = readAliasCsvLines();
        if (lines == null || lines.isEmpty()) {
            log.info("Không đọc được file alias '{}' — chạy không alias.", slugAliasesFile);
            return;
        }

        int rows = 0;
        boolean headerSkipped = false;
        for (String raw : lines) {
            // Bỏ BOM (﻿) mà Excel "CSV UTF-8" chèn ở đầu file, tránh dính vào ô đầu tiên.
            String line = raw.replace("﻿", "").trim();
            if (line.isEmpty() || line.startsWith("#")) continue;

            List<String> cols = parseCsvLine(line);
            if (!headerSkipped && !cols.isEmpty()
                    && cols.get(0).toLowerCase().startsWith("canonical")) {
                headerSkipped = true;
                continue;
            }
            if (cols.size() < 2) {
                log.warn("Bỏ qua dòng alias sai định dạng: '{}'", raw);
                continue;
            }

            // Cột 1 = public id thật, GIỮ NGUYÊN (chỉ trim), không chạy toSlug.
            String targetId = cols.get(1).trim();
            if (targetId.isEmpty()) {
                log.warn("Bỏ qua dòng alias thiếu slug đích: '{}'", raw);
                continue;
            }

            // canonical (cột 0) cũng được map về id đích để bắt trọn.
            addAlias(cols.get(0), targetId);
            // aliases (cột 2) ngăn bằng '|' hoặc ','.
            if (cols.size() >= 3) {
                for (String alias : cols.get(2).split("[|,]")) {
                    addAlias(alias, targetId);
                }
            }
            rows++;
        }
        log.info("Đã nạp {} video ({} alias) từ '{}'.", rows, slugAliases.size(), slugAliasesFile);
    }

    /** Chuẩn hóa 'from' làm khóa rồi map về targetId (public id thật). Bỏ qua nếu khóa rỗng. */
    private void addAlias(String from, String targetId) {
        String key = toSlug(from);
        if (key.isEmpty()) return;
        slugAliases.put(key, targetId);
    }

    /**
     * Parse một dòng CSV thành các cột, tôn trọng dấu ngoặc kép quanh ô chứa dấu phẩy.
     * Ví dụ: con mèo,con-meo_xtj4wo,"con mèo, mèo" -> 3 cột đúng.
     */
    private List<String> parseCsvLine(String line) {
        List<String> cols = new ArrayList<>();
        StringBuilder cur = new StringBuilder();
        boolean inQuotes = false;
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') {
                inQuotes = !inQuotes;
            } else if (c == ',' && !inQuotes) {
                cols.add(cur.toString());
                cur.setLength(0);
            } else {
                cur.append(c);
            }
        }
        cols.add(cur.toString());
        return cols;
    }

    /** Đọc các dòng file CSV alias (một file duy nhất cạnh backend). UTF-8. */
    private List<String> readAliasCsvLines() {
        try {
            java.nio.file.Path path = java.nio.file.Paths.get(slugAliasesFile);
            if (java.nio.file.Files.exists(path)) {
                return java.nio.file.Files.readAllLines(path, java.nio.charset.StandardCharsets.UTF_8);
            }
            log.warn("Không tìm thấy file alias '{}' (đường dẫn tuyệt đối: {}).",
                    slugAliasesFile, path.toAbsolutePath());
        } catch (Exception e) {
            log.warn("Lỗi đọc file alias '{}': {}", slugAliasesFile, e.getMessage());
        }
        return null;
    }

    // Cache kết quả kiểm tra tồn tại video trên Cloudinary (slug -> có/không) để tránh HEAD lặp.
    private final java.util.Map<String, Boolean> videoExistsCache =
            new java.util.concurrent.ConcurrentHashMap<>();

    /**
     * Chuẩn hóa một từ/cụm thành slug tên file: viết thường, bỏ dấu tiếng Việt,
     * khoảng trắng -> '-', loại ký tự lạ, gộp '-' thừa, cắt '-' ở đầu/cuối.
     * Ví dụ: "Cố gắng" -> "co-gang", "Cảm ơn" -> "cam-on".
     */
    private String toSlug(String input) {
        if (input == null) return "";
        String noAccent = stripVietnameseAccents(input).toLowerCase();
        return noAccent
                .replaceAll("[^a-z0-9\\s-]", " ") // bỏ ký tự không phải chữ/số
                .trim()
                .replaceAll("[\\s-]+", "-")       // khoảng trắng/gạch -> một '-'
                .replaceAll("^-+|-+$", "");        // cắt '-' thừa đầu/cuối
    }

    /**
     * Xác định URL video cho một từ:
     * 1) slug chuẩn hóa (ví dụ "con mèo" -> "con-meo") — nếu có video trên Cloudinary thì dùng.
     * 2) nếu không, tra alias trong CSV (từ đồng nghĩa -> public id) — nếu có video thì dùng.
     * 3) nếu vẫn không có, trả video mặc định "dung-im".
     * Không tự ghép URL cho slug không tồn tại (tránh link 404).
     */
    private String resolveAnimationUrl(String displayWord) {
        String slug = toSlug(displayWord);

        // Ứng viên theo thứ tự ưu tiên: slug gốc, rồi alias (nếu khác).
        List<String> candidates = new ArrayList<>();
        if (!slug.isEmpty()) candidates.add(slug);
        String alias = slugAliases.get(slug);
        if (alias != null && !alias.equals(slug)) candidates.add(alias);

        for (String candidate : candidates) {
            if (videoExists(candidate)) {
                return buildVideoUrl(candidate);
            }
        }

        // Không có video khớp -> dùng video đứng im mặc định.
        log.info("Không có video cho '{}' (slug='{}') -> fallback '{}'", displayWord, slug, FALLBACK_SLUG);
        return buildVideoUrl(FALLBACK_SLUG);
    }

    /** Ghép URL đầy đủ tới video: <base>/<slug>.mp4. Nếu chưa cấu hình Cloudinary thì serve local (dev). */
    private String buildVideoUrl(String slug) {
        if (cloudinaryConfigured()) {
            String base = cloudinaryVideoBaseUrl.replaceAll("/+$", ""); // bỏ '/' cuối nếu có
            return base + "/" + slug + ".mp4";
        }
        // Fallback dev: serve từ local static như trước.
        return "http://127.0.0.1:" + serverPort + "/assets/animations/" + slug + ".mp4";
    }

    private boolean cloudinaryConfigured() {
        return cloudinaryVideoBaseUrl != null
                && !cloudinaryVideoBaseUrl.isBlank()
                && !cloudinaryVideoBaseUrl.startsWith("${");
    }

    /**
     * Kiểm tra video của slug có tồn tại trên Cloudinary hay không (HEAD request, có cache).
     * Fallback slug ("dung-im") luôn coi là tồn tại để đảm bảo luôn có video trả về.
     * Khi chưa cấu hình Cloudinary (dev): không thể kiểm tra từ xa nên coi như tồn tại.
     */
    private boolean videoExists(String slug) {
        if (slug == null || slug.isEmpty()) return false;
        if (FALLBACK_SLUG.equals(slug)) return true;
        if (!cloudinaryConfigured()) return true; // dev: bỏ qua kiểm tra từ xa

        Boolean cached = videoExistsCache.get(slug);
        if (cached != null) return cached;

        boolean exists = false;
        try {
            HttpRequest headReq = HttpRequest.newBuilder()
                    .uri(URI.create(buildVideoUrl(slug)))
                    .method("HEAD", HttpRequest.BodyPublishers.noBody())
                    .timeout(Duration.ofSeconds(5))
                    .build();
            HttpResponse<Void> resp = httpClient.send(headReq, HttpResponse.BodyHandlers.discarding());
            exists = resp.statusCode() >= 200 && resp.statusCode() < 300;
        } catch (Exception e) {
            log.warn("Kiểm tra video '{}' thất bại, coi như không tồn tại: {}", slug, e.getMessage());
            exists = false;
        }
        videoExistsCache.put(slug, exists);
        return exists;
    }

    /**
     * Phát hiện text đã là tiếng Việt (có dấu tiếng Việt) để bỏ qua bước dịch AI.
     * Dựa vào sự xuất hiện của ký tự có dấu đặc trưng tiếng Việt.
     */
    private boolean isLikelyVietnamese(String text) {
        if (text == null || text.isBlank()) return true; // rỗng thì khỏi dịch
        return text.chars().anyMatch(c ->
                "àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ"
                        .indexOf(Character.toLowerCase(c)) >= 0);
    }

    // ===== Quản lý glossary thủ công (nguồn chính xác do người duyệt) =====

    public List<GlossaryTerm> listGlossary() {
        return glossaryTermRepository.findAll();
    }

    /** Thêm/cập nhật một cụm glossary. phrase được chuẩn hóa để so khớp ổn định. */
    public GlossaryTerm upsertGlossary(String phrase, List<String> glosses, String note) {
        String key = normalizeKey(phrase);
        GlossaryTerm existing = glossaryTermRepository.findByPhrase(key).orElse(null);
        GlossaryTerm toSave = GlossaryTerm.builder()
                .id(existing != null ? existing.getId() : null)
                .phrase(key)
                .glosses(glosses)
                .note(note)
                .updatedAt(LocalDateTime.now())
                .build();
        GlossaryTerm saved = glossaryTermRepository.save(toSave);
        // Đồng bộ vào cache để có hiệu lực ngay và xóa bản cache cũ (nếu có) cho cùng khóa.
        segmentCache.put(key, glosses);
        saveCache(key, glosses, "gemini"); // đánh dấu chất lượng cao để không bị Gemini nền ghi đè
        log.info("Glossary upsert: '{}' -> {}", key, glosses);
        return saved;
    }

    public void deleteGlossary(String id) {
        glossaryTermRepository.deleteById(id);
    }

    /** Seed một số cụm VSL phổ biến nếu glossary đang rỗng. */
    public void seedGlossaryIfEmpty() {
        if (glossaryTermRepository.count() > 0) return;
        Map<String, List<String>> seed = new LinkedHashMap<>();
        seed.put("xin chào", List.of("XIN-CHÀO"));
        seed.put("cảm ơn", List.of("CẢM-ƠN"));
        seed.put("xin lỗi", List.of("XIN-LỖI"));
        seed.put("tạm biệt", List.of("TẠM-BIỆT"));
        seed.put("bao nhiêu tuổi", List.of("HỎI", "TUỔI"));
        seed.put("trí tuệ nhân tạo", List.of("AI"));
        seed.put("hôm nay", List.of("HÔM-NAY"));
        seed.put("ngày mai", List.of("NGÀY-MAI"));
        seed.put("hôm qua", List.of("HÔM-QUA"));
        seed.put("cuộc sống hiện đại", List.of("CUỘC-SỐNG", "HIỆN-ĐẠI"));
        for (Map.Entry<String, List<String>> e : seed.entrySet()) {
            glossaryTermRepository.save(GlossaryTerm.builder()
                    .phrase(e.getKey())
                    .glosses(e.getValue())
                    .note("seed")
                    .updatedAt(LocalDateTime.now())
                    .build());
        }
        log.info("Seeded {} glossary terms.", seed.size());
    }

    /**
     * Một từ/cụm được coi là "có nghĩa" (giữ lại) nếu không rỗng và không phải stopword.
     * Từ viết tắt (toàn chữ HOA, ví dụ "AI", "GDP") luôn được giữ, kể cả khi bản chữ
     * thường của nó trùng một stopword (ví dụ "AI" -> "ai").
     */
    private boolean isMeaningfulWord(String word) {
        if (word == null) return false;
        String clean = word.trim().replaceAll("^[.,?!\\-\"]+|[.,?!\\-\"]+$", "");
        if (clean.isEmpty()) return false;
        if (isAcronym(clean)) return true;
        return !VIETNAMESE_STOPWORDS.contains(clean.toLowerCase());
    }

    /** Từ viết tắt: có ít nhất 2 ký tự và toàn bộ chữ cái đều viết HOA (AI, GDP, USA...). */
    private boolean isAcronym(String word) {
        if (word == null || word.length() < 2) return false;
        boolean hasLetter = false;
        for (char c : word.toCharArray()) {
            if (Character.isLetter(c)) {
                hasLetter = true;
                if (Character.isLowerCase(c)) return false;
            }
        }
        return hasLetter;
    }

    /** Bóc markdown fence ```json ... ``` hoặc ``` ... ``` quanh JSON nếu Gemini trả kèm. */
    private String stripMarkdownFence(String s) {
        if (s == null) return null;
        String t = s.trim();
        if (t.startsWith("```")) {
            int firstNewline = t.indexOf('\n');
            if (firstNewline != -1) {
                t = t.substring(firstNewline + 1);
            }
            if (t.endsWith("```")) {
                t = t.substring(0, t.length() - 3);
            }
        }
        return t.trim();
    }

    // Cụm từ ghép có nghĩa dùng cho bộ tách rule-based (fallback khi không có Gemini).
    private static final List<String> COMPOUND_WORDS = Arrays.asList(
            "trí tuệ nhân tạo", "cuộc sống hiện đại", "khoa học công nghệ", "công nghệ thông tin",
            "mạng xã hội", "học máy", "dữ liệu lớn", "xử lý ngôn ngữ",
            "xin chào", "mọi người", "chào mừng", "hôm nay", "ngày mai", "ngày hôm qua", "hôm qua",
            "tìm hiểu", "thay đổi", "phát triển", "cảm ơn", "xin lỗi", "tạm biệt",
            "chúng ta", "chúng tôi", "như thế nào", "bao nhiêu", "có thể", "không thể",
            // Cụm sinh hoạt / cảm xúc / thể thao thường gặp trong hội thoại
            "buồn ngủ", "buồn cười", "buồn bã", "vui vẻ", "mệt mỏi", "đói bụng", "khát nước",
            "đá bóng", "bóng đá", "trận đấu", "xem phim", "nghe nhạc", "chơi game",
            "đi học", "đi làm", "đi chơi", "về nhà", "ăn cơm", "uống nước", "ngủ dậy",
            "hạnh phúc", "yêu thương", "gia đình", "bạn bè", "thầy cô", "học sinh", "sinh viên",
            "bây giờ", "lúc nãy", "sắp tới", "vừa rồi", "thỉnh thoảng", "thường xuyên"
    );

    /**
     * Bộ tách rule-based (không cần AI): greedy match cụm từ ghép trước, rồi các từ đơn,
     * lọc stopword, giữ nguyên từ viết tắt. Kết quả xấp xỉ Gemini cho câu đơn giản.
     */
    public List<String> ruleBasedSegment(String text) {
        List<String> result = new ArrayList<>();
        if (text == null || text.trim().isEmpty()) return result;

        // Chuẩn hóa: bỏ dấu câu cuối cụm nhưng giữ chữ hoa để nhận diện acronym.
        String cleaned = filterBracketedContent(text).replaceAll("[.,;:!?]", " ").replaceAll("\\s+", " ").trim();
        String lower = cleaned.toLowerCase();

        List<String> sortedCompounds = new ArrayList<>(COMPOUND_WORDS);
        sortedCompounds.sort((a, b) -> b.length() - a.length());

        int i = 0;
        String[] tokens = cleaned.split(" ");
        String[] lowerTokens = lower.split(" ");

        while (i < tokens.length) {
            boolean matched = false;
            for (String compound : sortedCompounds) {
                String[] compTokens = compound.split(" ");
                if (i + compTokens.length <= lowerTokens.length) {
                    boolean allMatch = true;
                    for (int k = 0; k < compTokens.length; k++) {
                        if (!lowerTokens[i + k].equals(compTokens[k])) {
                            allMatch = false;
                            break;
                        }
                    }
                    if (allMatch) {
                        result.add(compound);
                        i += compTokens.length;
                        matched = true;
                        break;
                    }
                }
            }
            if (!matched) {
                String token = tokens[i];
                if (isMeaningfulWord(token)) {
                    // Giữ chữ hoa nếu là acronym, còn lại về chữ thường.
                    result.add(isAcronym(token) ? token : token.toLowerCase());
                }
                i++;
            }
        }
        return result;
    }

    private String stripVietnameseAccents(String str) {
        if (str == null) return null;
        String normalized = java.text.Normalizer.normalize(str, java.text.Normalizer.Form.NFD);
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
        String temp = pattern.matcher(normalized).replaceAll("");
        return temp.replace('đ', 'd').replace('Đ', 'D');
    }
}