package com.signify.modules.youtube.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
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
public class SaveScriptsRequest {
    @NotBlank(message = "videoId không được để trống")
    String videoId;

    @NotEmpty(message = "signLanguageScripts không được để trống")
    List<Map<String, Object>> signLanguageScripts;
}
