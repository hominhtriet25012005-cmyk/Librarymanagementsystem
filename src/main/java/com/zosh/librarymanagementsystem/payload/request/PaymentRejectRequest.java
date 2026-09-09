package com.zosh.librarymanagementsystem.payload.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PaymentRejectRequest {

    @NotBlank(message = "Lý do từ chối là bắt buộc")
    @Size(max = 1000, message = "Lý do từ chối không được vượt quá 1000 ký tự")
    private String reason;
}
