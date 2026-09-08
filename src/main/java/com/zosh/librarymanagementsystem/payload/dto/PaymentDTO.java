package com.zosh.librarymanagementsystem.payload.dto;

import com.zosh.librarymanagementsystem.domain.PaymentGateway;
import com.zosh.librarymanagementsystem.domain.PaymentStatus;
import com.zosh.librarymanagementsystem.domain.PaymentType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class PaymentDTO {

    private Long id;

    @NotNull(message = "ID người dùng là bắt buộc")
    private Long userId;

    private String userName;

    private String userEmail;

    private Long bookLoanId;

    private Long subscriptionId;

    @NotNull(message = "Loại thanh toán là bắt buộc")
    private PaymentType paymentType;

    private PaymentStatus status;

    @NotNull(message = "Cổng thanh toán là bắt buộc")
    private PaymentGateway gateway;

    @NotNull(message = "Số tiền là bắt buộc")
    @Positive(message = "Số tiền phải lớn hơn 0")
    private Long amount;

    @Size(min = 3, max = 3, message = "Mã tiền tệ phải có đúng 3 ký tự")
    private String currency;

    private String transactionId;

    private String gatewayPaymentId;

    private String gatewayOrderId;

    private String gatewaySignature;

    private String description;

    private String failureReason;

    private Integer retryCount;

    private LocalDateTime initiatedAt;

    private LocalDateTime completedAt;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
