package com.signify.modules.auth.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AuthResponse {
    String _id; // Matches Node.js return field _id
    String fullName;
    String email;
    String role;
    String token;
}
