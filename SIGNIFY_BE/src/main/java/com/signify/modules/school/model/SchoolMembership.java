package com.signify.modules.school.model;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * Membership linking a user to a school with a role
 * (SCHOOL_ADMIN / TEACHER / STUDENT).
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Document(collection = "school_memberships")
@CompoundIndex(name = "school_user_unique", def = "{ 'schoolId': 1, 'userId': 1 }", unique = true)
public class SchoolMembership {
    @Id
    String id;

    @Indexed
    String schoolId;

    @Indexed
    String userId;

    String role;

    String status;

    @CreatedDate
    LocalDateTime createdAt;

    @LastModifiedDate
    LocalDateTime updatedAt;
}
