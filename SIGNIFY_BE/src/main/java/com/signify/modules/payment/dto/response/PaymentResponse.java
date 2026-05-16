package com.signify.modules.payment.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PaymentResponse {
    private String checkoutUrl;
    private String qrCode;
    private Long orderCode;
    private String accountName;
    private String accountNumber;
    private Integer amount;
    private String description;
}
