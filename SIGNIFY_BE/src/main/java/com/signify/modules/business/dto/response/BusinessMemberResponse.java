package com.signify.modules.business.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BusinessMemberResponse {
    String id;
    String userId;
    String fullName;
    String email;
    String avatarUrl;
    String userStatus;
    String role;
    String status;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
