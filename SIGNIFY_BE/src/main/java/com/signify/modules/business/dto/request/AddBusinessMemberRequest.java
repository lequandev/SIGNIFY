package com.signify.modules.business.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AddBusinessMemberRequest {
    @NotBlank(message = "Email thành viên không được để trống.")
    @Email(message = "Email thành viên không hợp lệ.")
    private String email;
}
