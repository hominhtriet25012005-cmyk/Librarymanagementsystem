package com.zosh.librarymanagementsystem.payload.response;

import com.zosh.librarymanagementsystem.domain.PaymentGateway;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PaymentInitiateResponse {

    private Long paymentId;

    /** ID đăng ký thành viên nếu đây là thanh toán gói. */
    private Long subscriptionId;

    /** ID khoản phạt nếu đây là thanh toán tiền phạt. */
    private Long fineId;

    private PaymentGateway gateway;

    private String transactionId;

    private String razorpayOrderId;

    private Long amount;

    private String description;

    private String checkoutUrl;

    private String message;

    private  Boolean success;
}
