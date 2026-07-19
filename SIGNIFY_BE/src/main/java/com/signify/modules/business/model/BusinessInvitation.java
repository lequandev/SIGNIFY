package com.signify.modules.business.model;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Document(collection = "business_invitations")
@CompoundIndex(name = "organization_email_status_idx", def = "{ 'organizationId': 1, 'email': 1, 'status': 1 }")
public class BusinessInvitation {
    @Id
    String id;

    @Indexed
    String organizationId;

    @Indexed
    String email;

    @Indexed
    String invitedByUserId;

    @Indexed(unique = true)
    String token;

    String role;

    String status;

    LocalDateTime expiresAt;

    LocalDateTime acceptedAt;

    @CreatedDate
    LocalDateTime createdAt;

    @LastModifiedDate
    LocalDateTime updatedAt;
}
