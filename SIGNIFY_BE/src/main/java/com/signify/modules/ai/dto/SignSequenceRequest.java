package com.signify.modules.ai.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SignSequenceRequest {
    String videoId;
    String videoUrl;
    String title;
    String signLanguageText;
}
