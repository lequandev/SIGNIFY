package com.signify.modules.subscription.model;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDateTime;

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

    String name;

    String description;

    BigDecimal price;

    Integer durationDays;

    Integer aiLimitPerDay;

    @CreatedDate
    LocalDateTime createdAt;
}
