package com.signify.modules.ai.model;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Cache bền kết quả tách gloss theo câu/cụm đã chuẩn hóa.
 * id = text đã chuẩn hóa (trim + lowercase) để tra O(1) theo khóa chính.
 * source: "gemini" | "rule" — để biết có thể nâng cấp lên gemini sau không.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Document(collection = "gloss_cache")
public class GlossCacheEntry {
    @Id
    String id; // normalized text

    List<String> glosses;

    String source; // "gemini" | "rule"

    LocalDateTime updatedAt;
}
