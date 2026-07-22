package com.signify.modules.assignment.model;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Document(collection = "assignments")
public class Assignment {
    @Id
    String id;

    @Indexed
    String classId;

    @Indexed
    String teacherId;

    String youtubeVideoId;
    String title;
    String description;
    LocalDateTime dueDate;
    String status;

    @CreatedDate
    LocalDateTime createdAt;
}
