package com.zosh.librarymanagementsystem.controller;

import com.zosh.librarymanagementsystem.exception.SubscriptionException;
import com.zosh.librarymanagementsystem.payload.dto.SubscriptionDTO;
import com.zosh.librarymanagementsystem.payload.response.ApiResponse;
import com.zosh.librarymanagementsystem.payload.response.PaymentInitiateResponse;
import com.zosh.librarymanagementsystem.service.SubscriptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/subscriptions")
public class SubscriptionController {
    private final SubscriptionService subscriptionService;

    @PostMapping("/subscribe")
    public ResponseEntity<?> subscribe(
            @Valid @RequestBody SubscriptionDTO subscription
            ) {
        PaymentInitiateResponse dto = subscriptionService.subscribe(subscription);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/user/active")
    public ResponseEntity<?> getUsersSubscriptions() {
        SubscriptionDTO dto = subscriptionService
                .getUsersActiveSubscription();
        return ResponseEntity.ok(dto);
    }

    @GetMapping({"/admin", "/admin/"})
    public ResponseEntity<?> getAllSubscriptions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        page = Math.max(page, 0);
        size = Math.max(1, Math.min(size, 100));
        Pageable pageable = PageRequest.of(page,size);
        List<SubscriptionDTO> dtoList = subscriptionService.getAllSubscriptions(pageable);
        return ResponseEntity.ok(dtoList);
    }

    @PostMapping("/admin/deactivate-expired")
    public ResponseEntity<?> deactivateExpiredSubscriptions() {
        subscriptionService.deactivateExpiredSubscriptions();
        ApiResponse res = new ApiResponse("Đã vô hiệu hóa các gói hết hạn", true);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/cancel/{subscriptionId}")
    public ResponseEntity<?> cancelSubscription(
            @PathVariable Long subscriptionId,
            @RequestParam(required = false) String reason) throws SubscriptionException {
            SubscriptionDTO subscription = subscriptionService
                    .cancelSubscription(subscriptionId, reason);
            return ResponseEntity.ok(subscription);
    }

    @PostMapping("/admin/activate/{subscriptionId}")
    public ResponseEntity<?> activateSubscription(
            @PathVariable Long subscriptionId,
            @RequestParam Long paymentId) throws SubscriptionException {
        SubscriptionDTO subscription = subscriptionService
                .activateSubscription(subscriptionId, paymentId);
        return ResponseEntity.ok(subscription);
    }

}
