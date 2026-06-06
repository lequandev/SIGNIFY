package com.signify.modules.subscription.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PackageRequest {
    String name;
    String description;
    BigDecimal price;
    Integer durationDays;
    Integer aiLimitPerDay;
    String planType;
}
