package com.signify.modules.entitlement.exception;

import com.signify.modules.entitlement.dto.AiUsageSummaryResponse;
import lombok.Getter;

@Getter
public class AiUsageException extends RuntimeException {
    private final String code;
    private final AiUsageSummaryResponse usage;

    public AiUsageException(String code, String message, AiUsageSummaryResponse usage) {
        super(message);
        this.code = code;
        this.usage = usage;
    }
}
