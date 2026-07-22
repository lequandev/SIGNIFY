package com.signify.modules.youtube.controller;

import com.signify.modules.youtube.dto.SaveScriptsRequest;
import com.signify.modules.youtube.dto.SaveVideoInfoRequest;
import com.signify.modules.youtube.dto.VideoInfoResponse;
import com.signify.modules.youtube.service.YoutubeVideoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/youtube")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.POST, RequestMethod.GET, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class YoutubeController {

    private final YoutubeVideoService youtubeVideoService;

    /**
     * Endpoint gọi từ Extension khi user mở 1 video YouTube.
     * HTTP Method: POST
     * Endpoint: /api/youtube/video-info
     * Request Body: { "videoId": "...", "videoUrl": "...", "title": "..." }
     */
    @PostMapping("/video-info")
    public ResponseEntity<VideoInfoResponse> saveVideoInfo(@Valid @RequestBody SaveVideoInfoRequest request) {
        String userId = getCurrentUserId();
        VideoInfoResponse response = youtubeVideoService.processOrGetVideoInfo(request, userId);
        return ResponseEntity.ok(response);
    }

    /**
     * Lấy thông tin video và scripts đã lưu cache (nếu có).
     */
    @GetMapping("/video-info/{videoId}")
    public ResponseEntity<?> getVideoInfo(@PathVariable String videoId) {
        return youtubeVideoService.getVideoInfoByVideoId(videoId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * Lưu/Cập nhật các scripts đã cào và rút gọn sang ngôn ngữ ký hiệu.
     */
    @PostMapping("/save-scripts")
    public ResponseEntity<VideoInfoResponse> saveScripts(@Valid @RequestBody SaveScriptsRequest request) {
        VideoInfoResponse response = youtubeVideoService.saveScripts(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Endpoint dành cho Admin quản lý danh sách video đã xem và lọc theo period (day, month, year, all).
     */
    @GetMapping("/admin/videos")
    public ResponseEntity<Map<String, Object>> getAdminVideos(
            @RequestParam(defaultValue = "all") String period,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Map<String, Object> result = youtubeVideoService.getAdminVideoStatsAndList(period, search, page, size);
        return ResponseEntity.ok(result);
    }

    /**
     * Endpoint Xóa video khỏi hệ thống
     */
    @DeleteMapping("/admin/videos/{id}")
    public ResponseEntity<Void> deleteVideo(@PathVariable String id) {
        youtubeVideoService.deleteVideo(id);
        return ResponseEntity.noContent().build();
    }

    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return auth.getName();
        }
        return null;
    }
}
