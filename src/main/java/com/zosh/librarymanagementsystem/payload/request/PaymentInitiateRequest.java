package com.zosh.librarymanagementsystem.payload.request;

import com.zosh.librarymanagementsystem.domain.PaymentGateway;
import com.zosh.librarymanagementsystem.domain.PaymentType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PaymentInitiateRequest {


    @NotNull(message = "ID người dùng là bắt buộc")
    private Long userId;

    private Long bookLoanId; // Chỉ dùng cho thanh toán liên quan đến phiếu mượn.

    @NotNull(message = "Loại thanh toán là bắt buộc")
    private PaymentType paymentType;

    @NotNull(message = "Cổng thanh toán là bắt buộc")
    private PaymentGateway gateway; // Hiện backend hỗ trợ RAZORPAY.

    @NotNull(message = "Số tiền là bắt buộc")
    @Positive(message = "Số tiền phải lớn hơn 0")
    private Long amount;

    @Size(min = 3, max = 3, message = "Mã tiền tệ phải có đúng 3 ký tự, ví dụ INR")
    @Builder.Default
    private String currency = "INR";

    @Size(max =  500, message = "Mô tả không được vượt quá 500 ký tự")
    private  String description;

    private Long fineId;
    private Long subscriptionId;

    // Đường dẫn điều hướng sau khi thanh toán.
    @Size(max = 500, message = "Đường dẫn thành công không được vượt quá 500 ký tự")
    private String successUrl;

    @Size(max = 500, message = "Đường dẫn hủy không được vượt quá 500 ký tự")
    private String cancelUrl;

}
