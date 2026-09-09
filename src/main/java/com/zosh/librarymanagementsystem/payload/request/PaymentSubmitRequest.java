package com.zosh.librarymanagementsystem.payload.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PaymentSubmitRequest {

    /** Mã giao dịch ngân hàng hoặc ghi chú tùy chọn của người chuyển khoản. */
    @Size(max = 100, message = "Mã tham chiếu không được vượt quá 100 ký tự")
    private String payerReference;
}
