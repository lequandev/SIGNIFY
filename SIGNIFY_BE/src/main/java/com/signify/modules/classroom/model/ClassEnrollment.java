package com.signify.modules.classroom.model;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * Enrollment linking a student to a class.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Document(collection = "class_enrollments")
@CompoundIndex(name = "class_student_unique", def = "{ 'classId': 1, 'studentId': 1 }", unique = true)
public class ClassEnrollment {
    @Id
    String id;

    @Indexed
    String classId;

    @Indexed
    String studentId;

    /** ACTIVE | REMOVED */
    String status;

    @CreatedDate
    LocalDateTime createdAt;
}
