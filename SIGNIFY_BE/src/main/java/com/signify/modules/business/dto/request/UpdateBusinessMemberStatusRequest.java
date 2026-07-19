package com.signify.modules.business.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateBusinessMemberStatusRequest {
    @NotBlank(message = "Trạng thái không được để trống.")
    private String status;
}
