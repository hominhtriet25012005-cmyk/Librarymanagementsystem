package com.zosh.librarymanagementsystem.service;

import com.zosh.librarymanagementsystem.domain.FineStatus;
import com.zosh.librarymanagementsystem.domain.FineType;
import com.zosh.librarymanagementsystem.payload.dto.FineDTO;
import com.zosh.librarymanagementsystem.payload.request.CreateFineRequest;
import com.zosh.librarymanagementsystem.payload.request.WaiveFineRequest;
import com.zosh.librarymanagementsystem.payload.response.PageResponse;
import com.zosh.librarymanagementsystem.payload.response.PaymentInitiateResponse;

import java.util.List;

public interface FineService {

    FineDTO createFine(CreateFineRequest createFineRequest);

    PaymentInitiateResponse payFine(Long fineId);

    void markFineAsPaid(Long fineId, Long amount, String transactionId);

    FineDTO waiveFine(WaiveFineRequest waiveFineRequest);

    List<FineDTO> getMyFines(FineStatus status, FineType type);

    PageResponse<FineDTO> getAllFines(
            FineStatus status,
            FineType type,
            Long userId,
            int page,
            int size
    );
}
