package com.zosh.librarymanagementsystem.payload.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PaymentConfirmRequest {

    @NotBlank(message = "Mã giao dịch ngân hàng là bắt buộc")
    @Size(max = 100, message = "Mã giao dịch ngân hàng không được vượt quá 100 ký tự")
    private String bankTransactionId;
}
