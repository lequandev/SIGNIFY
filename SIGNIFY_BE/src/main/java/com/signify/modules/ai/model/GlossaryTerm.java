package com.signify.modules.ai.model;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Từ điển gloss VSL do người duyệt (nguồn CHÍNH XÁC nhất).
 * phrase = cụm tiếng Việt đã chuẩn hóa (lowercase); glosses = chuỗi ký hiệu tương ứng.
 * Ví dụ: phrase="bao nhiêu tuổi", glosses=["HỎI-TUỔI"].
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Document(collection = "glossary_terms")
public class GlossaryTerm {
    @Id
    String id;

    String phrase; // chuẩn hóa lowercase, dùng để so khớp

    List<String> glosses;

    String note; // ghi chú tùy chọn của người duyệt

    LocalDateTime updatedAt;
}
