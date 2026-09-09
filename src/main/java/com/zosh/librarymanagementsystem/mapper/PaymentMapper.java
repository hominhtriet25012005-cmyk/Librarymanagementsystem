package com.zosh.librarymanagementsystem.mapper;

import com.zosh.librarymanagementsystem.modal.Payment;
import com.zosh.librarymanagementsystem.payload.dto.PaymentDTO;
import org.springframework.stereotype.Component;

@Component
public class PaymentMapper {
    public PaymentDTO toDTO(Payment payment) {
        if (payment == null) {
            return null;
        }

        PaymentDTO dto = new PaymentDTO();
        dto.setId(payment.getId());

        // Thông tin người thanh toán.
        if (payment.getUser() != null) {
            dto.setUserId(payment.getUser().getId());
            dto.setUserName(payment.getUser().getFullName());
            dto.setUserEmail(payment.getUser().getEmail());
        }

        // Tiền phạt luôn gắn với phiếu mượn tương ứng.
        if (payment.getFine() != null && payment.getFine().getBookLoan() != null) {
            dto.setBookLoanId(payment.getFine().getBookLoan().getId());
        }
        if (payment.getFine() != null) {
            dto.setFineId(payment.getFine().getId());
        }

        // Thông tin gói thành viên.
        if (payment.getSubscription() != null) {
            dto.setSubscriptionId(payment.getSubscription().getId());
        }

        dto.setPaymentType(payment.getPaymentType());
        dto.setStatus(payment.getStatus());
        dto.setGateway(payment.getGateway());
        dto.setAmount(payment.getAmount());
        dto.setCurrency(payment.getCurrency());
        dto.setTransactionId(payment.getTransactionId());
        dto.setGatewayPaymentId(payment.getGatewayPaymentId());
        dto.setPayerReference(payment.getPayerReference());
        dto.setGatewayOrderId(payment.getGatewayOrderId());
        dto.setGatewaySignature(payment.getGatewaySignature());
        dto.setDescription(payment.getDescription());
        dto.setFailureReason(payment.getFailureReason());
        dto.setInitiatedAt(payment.getInitiatedAt());
        dto.setCompletedAt(payment.getCompletedAt());
        dto.setSubmittedAt(payment.getSubmittedAt());
        if (payment.getReviewedBy() != null) {
            dto.setReviewedById(payment.getReviewedBy().getId());
            dto.setReviewedByName(payment.getReviewedBy().getFullName());
        }
        dto.setReviewedAt(payment.getReviewedAt());
        dto.setCreatedAt(payment.getCreatedAt());
        dto.setUpdatedAt(payment.getUpdatedAt());

        return dto;

    }
}
