package com.signify.modules.payment.dto.request;

import lombok.Data;

@Data
public class CreatePaymentRequest {
    private String packageId;
    private String name;
}
