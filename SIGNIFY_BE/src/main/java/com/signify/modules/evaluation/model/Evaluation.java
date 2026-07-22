package com.signify.modules.evaluation.model;

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
@Document(collection = "evaluations")
public class Evaluation {
    @Id
    String id;

    @Indexed
    String schoolId;

    @Indexed
    String classId;

    @Indexed
    String studentId;

    String teacherId;
    Double score;
    String comment;

    @CreatedDate
    LocalDateTime createdAt;
}
