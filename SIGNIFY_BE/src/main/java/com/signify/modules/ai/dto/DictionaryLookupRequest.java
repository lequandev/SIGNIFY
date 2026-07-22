package com.signify.modules.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class DictionaryLookupRequest {
    @NotBlank(message = "Video ID is required")
    String videoId;

    String aiProcessingId;

    @NotEmpty(message = "Words list cannot be empty")
    List<String> words;

    String text; // Optional full sentence for AI processing
}
