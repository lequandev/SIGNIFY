package com.signify.modules.auth.model;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Document(collection = "sessions")
public class Session {
    @Id
    String id;

    String userId;

    String accessToken;

    String refreshToken;

    LocalDateTime expiresAt;

    @CreatedDate
    LocalDateTime createdAt;
}
