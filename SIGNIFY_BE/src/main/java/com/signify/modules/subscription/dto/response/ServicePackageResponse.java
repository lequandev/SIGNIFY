package com.signify.modules.subscription.dto.response;

import com.signify.modules.subscription.model.ServicePackage;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ServicePackageResponse {
    String id;
    String planType;
    String name;
    String description;
    String price;
    String duration;
    Integer durationDays;
    Integer aiLimitPerDay;
    String buttonText;
    Boolean isRecommended;
    String badge;
    List<ServicePackage.Feature> features;
}
