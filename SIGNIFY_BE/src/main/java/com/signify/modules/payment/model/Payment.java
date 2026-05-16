package com.signify.modules.payment.model;

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
@Document(collection = "payments")
public class Payment {
    @Id
    String id;

    String userId;

    String subscriptionId;

    BigDecimal amount;

    String paymentMethod;

    String transactionCode; // ID returned by PayOS

    Long orderCode; // Required by PayOS

    String status;

    @CreatedDate
    LocalDateTime paidAt;
}
