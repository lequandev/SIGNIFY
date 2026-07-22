package com.signify.modules.school.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SchoolOverviewResponse {
    String schoolId;
    String schoolName;
    String role;
    String status;
    String subscriptionId;
    String packageName;
    String planType;
    LocalDateTime expiresAt;
    long memberCount;
    long teacherCount;
    long studentCount;
    boolean canManageMembers;
}
