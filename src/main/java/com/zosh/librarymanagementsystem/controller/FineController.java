package com.zosh.librarymanagementsystem.controller;

import com.zosh.librarymanagementsystem.domain.FineStatus;
import com.zosh.librarymanagementsystem.domain.FineType;
import com.zosh.librarymanagementsystem.payload.dto.FineDTO;
import com.zosh.librarymanagementsystem.payload.request.CreateFineRequest;
import com.zosh.librarymanagementsystem.payload.request.WaiveFineRequest;
import com.zosh.librarymanagementsystem.payload.response.PageResponse;
import com.zosh.librarymanagementsystem.payload.response.PaymentInitiateResponse;
import com.zosh.librarymanagementsystem.service.FineService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/fines")
public class FineController {

    private final FineService fineService;

    @PostMapping
    public ResponseEntity<?> createFine(
            @Valid @RequestBody CreateFineRequest fineRequest
    ) {
        FineDTO fineDTO = fineService.createFine(fineRequest);
        return ResponseEntity.ok(fineDTO);
    }

    @PostMapping("/{id}/pay")
    public ResponseEntity<?> payFine(
            @PathVariable Long id
    ) {
        PaymentInitiateResponse res = fineService.payFine(id);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/waive")
    public ResponseEntity<?> waiveFine(
            @Valid @RequestBody WaiveFineRequest waiveFineRequest
    ) {
        FineDTO fineDTO = fineService.waiveFine(waiveFineRequest);
        return ResponseEntity.ok(fineDTO);
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyFines(
            @RequestParam(required = false) FineStatus status,
            @RequestParam(required = false) FineType type) {

        List<FineDTO> fines = fineService.getMyFines(status, type);
        return ResponseEntity.ok(fines);
    }

    @GetMapping
    public ResponseEntity<?> getAllFines(
            @RequestParam(required = false) FineStatus status,
            @RequestParam(required = false) FineType type,
            @RequestParam(required = false) Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        PageResponse<FineDTO> fines = fineService
                .getAllFines(status, type, userId, page, size);
        return ResponseEntity.ok(fines);
    }
}
