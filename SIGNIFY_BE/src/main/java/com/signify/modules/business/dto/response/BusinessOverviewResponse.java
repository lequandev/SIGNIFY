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
public class BusinessOverviewResponse {
    String organizationId;
    String organizationName;
    String role;
    String status;
    String subscriptionId;
    String packageName;
    String planType;
    LocalDateTime expiresAt;
    long memberCount;
    int maxAccounts;
    boolean canManageMembers;
}
