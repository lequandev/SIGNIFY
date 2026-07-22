package com.signify.modules.youtube.service;

import com.signify.modules.youtube.dto.SaveVideoInfoRequest;
import com.signify.modules.youtube.dto.VideoInfoResponse;
import com.signify.modules.youtube.model.YoutubeVideo;
import com.signify.modules.youtube.repository.YoutubeVideoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class YoutubeVideoServiceTest {

    @Mock
    private YoutubeVideoRepository repository;

    private YoutubeVideoService service;

    @BeforeEach
    void setUp() {
        service = new YoutubeVideoService(repository);
        when(repository.save(any(YoutubeVideo.class))).thenAnswer(invocation -> {
            YoutubeVideo video = invocation.getArgument(0);
            video.setId("youtube-video-1");
            return video;
        });
    }

    @Test
    void metadataOnlyDoesNotCreateAiSignLanguageFromTitle() {
        when(repository.findByVideoId("video-1")).thenReturn(Optional.empty());
        SaveVideoInfoRequest request = SaveVideoInfoRequest.builder()
                .videoId("video-1")
                .videoUrl("https://www.youtube.com/watch?v=video-1")
                .title("Tiêu đề không phải phụ đề")
                .build();

        VideoInfoResponse response = service.processOrGetVideoInfo(request, "user-1");

        assertNull(response.getSignLanguage());
        assertFalse(response.getIsProcessed());
        assertFalse(response.getHasCachedScripts());
    }

    @Test
    void explicitAiResultMarksVideoAsProcessed() {
        when(repository.findByVideoId("video-2")).thenReturn(Optional.empty());
        SaveVideoInfoRequest request = SaveVideoInfoRequest.builder()
                .videoId("video-2")
                .title("Video có kết quả AI")
                .signLanguage("học sinh, đi học")
                .build();

        VideoInfoResponse response = service.processOrGetVideoInfo(request, "user-1");

        assertEquals("học sinh, đi học", response.getSignLanguage());
        assertTrue(response.getIsProcessed());
        assertTrue(response.getHasCachedScripts());
    }
}
