package com.zosh.librarymanagementsystem.service;

import com.zosh.librarymanagementsystem.payload.dto.PaymentDTO;
import com.zosh.librarymanagementsystem.payload.request.PaymentInitiateRequest;
import com.zosh.librarymanagementsystem.payload.request.PaymentConfirmRequest;
import com.zosh.librarymanagementsystem.payload.request.PaymentRejectRequest;
import com.zosh.librarymanagementsystem.payload.request.PaymentSubmitRequest;
import com.zosh.librarymanagementsystem.payload.request.PaymentVerifyRequest;
import com.zosh.librarymanagementsystem.payload.response.PaymentInitiateResponse;
import com.zosh.librarymanagementsystem.domain.PaymentStatus;
import com.zosh.librarymanagementsystem.domain.PaymentType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface PaymentService {

    PaymentInitiateResponse initiatePayment(PaymentInitiateRequest req);

    PaymentDTO verifyPayment(PaymentVerifyRequest req);

    PaymentDTO submitBankTransfer(Long paymentId, PaymentSubmitRequest req);

    PaymentInitiateResponse getPaymentInstructions(Long paymentId);

    PaymentDTO confirmBankTransfer(Long paymentId, PaymentConfirmRequest req);

    PaymentDTO rejectBankTransfer(Long paymentId, PaymentRejectRequest req);

    Page<PaymentDTO> getMyPayments(Pageable pageable);

    Page<PaymentDTO> getAllPayments(PaymentStatus status, PaymentType paymentType, Pageable pageable);
}
