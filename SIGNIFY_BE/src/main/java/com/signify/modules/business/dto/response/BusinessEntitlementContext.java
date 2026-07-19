package com.signify.modules.business.dto.response;

import com.signify.modules.business.model.BusinessMembership;
import com.signify.modules.business.model.BusinessOrganization;
import com.signify.modules.subscription.model.ServicePackage;
import com.signify.modules.subscription.model.Subscription;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BusinessEntitlementContext {
    BusinessOrganization organization;
    BusinessMembership membership;
    Subscription subscription;
    ServicePackage servicePackage;
}
