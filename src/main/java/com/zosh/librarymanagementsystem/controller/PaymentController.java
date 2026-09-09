package com.zosh.librarymanagementsystem.controller;

import com.zosh.librarymanagementsystem.payload.dto.PaymentDTO;
import com.zosh.librarymanagementsystem.payload.request.PaymentVerifyRequest;
import com.zosh.librarymanagementsystem.payload.request.PaymentConfirmRequest;
import com.zosh.librarymanagementsystem.payload.request.PaymentRejectRequest;
import com.zosh.librarymanagementsystem.payload.request.PaymentSubmitRequest;
import com.zosh.librarymanagementsystem.domain.PaymentStatus;
import com.zosh.librarymanagementsystem.domain.PaymentType;
import com.zosh.librarymanagementsystem.service.PaymentService;
import com.zosh.librarymanagementsystem.payload.response.PaymentInitiateResponse;
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

    /** Bạn đọc xác nhận đã thực hiện chuyển khoản để đưa giao dịch vào hàng chờ đối soát. */
    @PostMapping("/{paymentId}/submit")
    public ResponseEntity<PaymentDTO> submitBankTransfer(
            @PathVariable Long paymentId,
            @Valid @RequestBody PaymentSubmitRequest request) {
        return ResponseEntity.ok(paymentService.submitBankTransfer(paymentId, request));
    }

    @GetMapping("/{paymentId}/instructions")
    public ResponseEntity<PaymentInitiateResponse> getPaymentInstructions(
            @PathVariable Long paymentId) {
        return ResponseEntity.ok(paymentService.getPaymentInstructions(paymentId));
    }

    /** Quản trị viên xác nhận đã nhận đúng số tiền trên tài khoản ngân hàng. */
    @PostMapping("/admin/{paymentId}/confirm")
    public ResponseEntity<PaymentDTO> confirmBankTransfer(
            @PathVariable Long paymentId,
            @Valid @RequestBody PaymentConfirmRequest request) {
        return ResponseEntity.ok(paymentService.confirmBankTransfer(paymentId, request));
    }

    /** Quản trị viên từ chối giao dịch không thể đối chiếu. */
    @PostMapping("/admin/{paymentId}/reject")
    public ResponseEntity<PaymentDTO> rejectBankTransfer(
            @PathVariable Long paymentId,
            @Valid @RequestBody PaymentRejectRequest request) {
        return ResponseEntity.ok(paymentService.rejectBankTransfer(paymentId, request));
    }

    @GetMapping("/my")
    public ResponseEntity<Page<PaymentDTO>> getMyPayments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.max(1, Math.min(size, 100)),
                Sort.by("createdAt").descending());
        return ResponseEntity.ok(paymentService.getMyPayments(pageable));
    }

    @GetMapping
    public ResponseEntity<?> getAllPayments (
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir,
            @RequestParam(required = false) PaymentStatus status,
            @RequestParam(required = false) PaymentType paymentType) {

        page = Math.max(page, 0);
        size = Math.max(1, Math.min(size, 100));

        List<String> allowedSortFields = List.of(
                "createdAt", "updatedAt", "initiatedAt", "submittedAt", "reviewedAt",
                "completedAt", "amount", "status"
        );
        if (!allowedSortFields.contains(sortBy)) {
            sortBy = "createdAt";
        }

        Sort sort = sortDir.equalsIgnoreCase("DESC")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<PaymentDTO> payments = paymentService.getAllPayments(status, paymentType, pageable);
        return ResponseEntity.ok(payments);
    }

}
