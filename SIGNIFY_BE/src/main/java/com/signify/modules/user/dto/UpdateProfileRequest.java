package com.signify.modules.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateProfileRequest {
    @NotBlank(message = "Họ và tên không được để trống")
    @Size(min = 2, max = 100, message = "Họ và tên phải từ 2-100 ký tự")
    String fullName;

    @Pattern(regexp = "^(\\+?84|0)?[0-9]{9,10}$|^$", message = "Số điện thoại không hợp lệ")
    @Size(max = 15, message = "Số điện thoại không được quá 15 ký tự")
    String phoneNumber;

    @Size(max = 200, message = "Địa chỉ không được quá 200 ký tự")
    String address;
}
