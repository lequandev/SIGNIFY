package com.signify.modules.school.dto.response;

import com.signify.modules.school.model.School;
import com.signify.modules.school.model.SchoolMembership;
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
public class SchoolEntitlementContext {
    School school;
    SchoolMembership membership;
    Subscription subscription;
    ServicePackage servicePackage;
}
