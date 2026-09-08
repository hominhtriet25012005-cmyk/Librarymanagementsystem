package com.zosh.librarymanagementsystem.payload.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentVerifyRequest {

    @NotBlank(message = "Mã thanh toán Razorpay là bắt buộc")
    private String razorpayPaymentId;

    // Dành cho Stripe nếu cổng này được bổ sung sau.
    private String stripePaymentIntentId;
    private String stripePaymentIntentStatus;
}
