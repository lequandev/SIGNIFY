package com.signify.modules.school.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SchoolInvitationResponse {
    String id;
    String email;
    String fullName;
    String role;
    String status;
    LocalDateTime expiresAt;
}
