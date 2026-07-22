package com.signify.modules.assignment.model;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Document(collection = "assignment_progress")
@CompoundIndex(name = "assignment_student_unique", def = "{ 'assignmentId': 1, 'studentId': 1 }", unique = true)
public class AssignmentProgress {
    @Id
    String id;

    @Indexed
    String assignmentId;

    @Indexed
    String studentId;

    String youtubeVideoId;
    String status;
    Integer watchedSeconds;
    LocalDateTime startedAt;
    LocalDateTime completedAt;
    LocalDateTime updatedAt;
}
