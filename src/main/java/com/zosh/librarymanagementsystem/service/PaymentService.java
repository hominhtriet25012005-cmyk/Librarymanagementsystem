package com.zosh.librarymanagementsystem.service;

import com.zosh.librarymanagementsystem.payload.dto.PaymentDTO;
import com.zosh.librarymanagementsystem.payload.request.PaymentInitiateRequest;
import com.zosh.librarymanagementsystem.payload.request.PaymentVerifyRequest;
import com.zosh.librarymanagementsystem.payload.response.PaymentInitiateResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface PaymentService {

    PaymentInitiateResponse initiatePayment(PaymentInitiateRequest req);

    PaymentDTO verifyPayment(PaymentVerifyRequest req);

    Page<PaymentDTO> getAllPayments(Pageable pageable);
}
