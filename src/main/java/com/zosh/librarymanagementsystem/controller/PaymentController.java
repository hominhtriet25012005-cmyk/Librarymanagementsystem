package com.zosh.librarymanagementsystem.controller;

import com.zosh.librarymanagementsystem.payload.dto.PaymentDTO;
import com.zosh.librarymanagementsystem.payload.request.PaymentVerifyRequest;
import com.zosh.librarymanagementsystem.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(
            @Valid @RequestBody PaymentVerifyRequest request) {
        PaymentDTO payment = paymentService.verifyPayment(request);
        return ResponseEntity.ok(payment);
    }

    @GetMapping
    public ResponseEntity<?> getAllPayments (
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {

        page = Math.max(page, 0);
        size = Math.max(1, Math.min(size, 100));

        List<String> allowedSortFields = List.of(
                "createdAt", "updatedAt", "initiatedAt", "completedAt", "amount", "status"
        );
        if (!allowedSortFields.contains(sortBy)) {
            sortBy = "createdAt";
        }

        Sort sort = sortDir.equalsIgnoreCase("DESC")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<PaymentDTO> payments = paymentService.getAllPayments(pageable);
        return ResponseEntity.ok(payments);
    }

}
