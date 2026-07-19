package com.signify.modules.user.model;

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
@Document(collection = "users")
public class User {
    @Id
    String id;

    @Indexed(unique = true)
    String email;

    String passwordHash;

    String fullName;

    String phoneNumber;

    String address;

    String avatarUrl;

    String verificationToken;

    Boolean isVerified;

    String googleId;

    String role;

    String status;

    @CreatedDate
    LocalDateTime createdAt;
}
