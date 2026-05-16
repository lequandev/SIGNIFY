package com.signify.modules.subscription.model;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Document(collection = "packages")
public class ServicePackage {
    @Id
    String id;

    String planType; // individual, business

    String name;

    String description;

    String price; // Storing as String to handle "Liên hệ" and formatting like "39,000"

    String duration; // tháng, 6 tháng, năm, báo giá

    Integer durationDays; // Internal calculation for subscription expiry

    Integer aiLimitPerDay;

    String buttonText;

    Boolean isRecommended;

    String badge;

    List<Feature> features;

    @CreatedDate
    LocalDateTime createdAt;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class Feature {
        String icon;
        String text;
    }
}
