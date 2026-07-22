package com.signify.modules.admin.dto.response;

import com.signify.modules.user.model.User;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AdminUserResponse {
    String id;
    String email;
    String username;
    String fullName;
    String avatarUrl;
    String role;
    String status;
    Boolean isVerified;
    Boolean mustChangePassword;
    LocalDateTime createdAt;

    public static AdminUserResponse from(User user) {
        return AdminUserResponse.builder()
                .id(user.getId()).email(user.getEmail()).username(user.getUsername()).fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl()).role(user.getRole()).status(user.getStatus())
                .isVerified(user.getIsVerified()).mustChangePassword(user.getMustChangePassword())
                .createdAt(user.getCreatedAt()).build();
    }
}
