package com.signify.modules.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LoginRequest {

    String identifier;

    // Backward compatibility for older web/mobile clients.
    String email;

    @NotBlank(message = "Password is required")
    String password;

    public String resolveIdentifier() {
        return identifier != null && !identifier.isBlank() ? identifier : email;
    }
}
