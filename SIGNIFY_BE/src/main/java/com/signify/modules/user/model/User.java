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

    @Indexed(unique = true, sparse = true, name = "email_unique_sparse")
    String email;

    @Indexed(unique = true, sparse = true, name = "username_unique_sparse")
    String username;

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

    /**
     * True when the account was provisioned with a temporary password
     * (e.g. student accounts created by a teacher) and the user must
     * change it on first login.
     */
    Boolean mustChangePassword;

    @CreatedDate
    LocalDateTime createdAt;
}
