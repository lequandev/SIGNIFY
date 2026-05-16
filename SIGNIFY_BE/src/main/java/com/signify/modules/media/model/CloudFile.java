package com.signify.modules.media.model;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Document(collection = "cloud_files")
public class CloudFile {
    @Id
    String id;

    String processId;

    String publicId;

    String fileUrl;

    String resourceType;

    @CreatedDate
    LocalDateTime uploadedAt;
}
