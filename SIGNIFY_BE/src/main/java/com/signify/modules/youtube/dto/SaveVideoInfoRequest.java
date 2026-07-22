package com.signify.modules.youtube.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;
import java.util.Map;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SaveVideoInfoRequest {
    @NotBlank(message = "videoId không được để trống")
    String videoId;

    String videoUrl;

    String title;

    String signLanguage;

    List<Map<String, Object>> signLanguageScripts;
}
