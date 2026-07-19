package com.signify.modules.entitlement.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RecordUsageRequest {
    @NotNull(message = "Số giây sử dụng là bắt buộc")
    @Min(value = 1, message = "Số giây sử dụng phải lớn hơn 0")
    @Max(value = 7200, message = "Mỗi lần ghi nhận không được vượt quá 2 giờ")
    Long usedSeconds;
}
