package com.signify.modules.school.model;

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
@Document(collection = "school_invitations")
public class SchoolInvitation {
    @Id
    String id;

    @Indexed
    String schoolId;

    String inviterUserId;
    String fullName;

    @Indexed
    String email;

    String role;

    @Indexed(unique = true)
    String token;

    String status;
    LocalDateTime expiresAt;
    String acceptedUserId;
    LocalDateTime acceptedAt;

    @CreatedDate
    LocalDateTime createdAt;
}
