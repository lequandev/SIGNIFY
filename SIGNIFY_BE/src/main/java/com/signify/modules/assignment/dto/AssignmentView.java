package com.signify.modules.assignment.dto;

import com.signify.modules.assignment.model.Assignment;
import com.signify.modules.assignment.model.AssignmentProgress;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AssignmentView {
    String id;
    String classId;
    String teacherId;
    String youtubeVideoId;
    String title;
    String description;
    LocalDateTime dueDate;
    String status;
    String progressStatus;
    Integer watchedSeconds;
    LocalDateTime startedAt;
    LocalDateTime completedAt;
    LocalDateTime createdAt;

    public static AssignmentView from(Assignment assignment, AssignmentProgress progress) {
        return AssignmentView.builder()
                .id(assignment.getId())
                .classId(assignment.getClassId())
                .teacherId(assignment.getTeacherId())
                .youtubeVideoId(assignment.getYoutubeVideoId())
                .title(assignment.getTitle())
                .description(assignment.getDescription())
                .dueDate(assignment.getDueDate())
                .status(assignment.getStatus())
                .progressStatus(progress != null ? progress.getStatus() : null)
                .watchedSeconds(progress != null ? progress.getWatchedSeconds() : null)
                .startedAt(progress != null ? progress.getStartedAt() : null)
                .completedAt(progress != null ? progress.getCompletedAt() : null)
                .createdAt(assignment.getCreatedAt())
                .build();
    }
}
