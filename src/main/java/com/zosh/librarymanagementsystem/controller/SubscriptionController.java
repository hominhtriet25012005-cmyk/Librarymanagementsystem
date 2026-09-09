package com.zosh.librarymanagementsystem.controller;

import com.zosh.librarymanagementsystem.exception.SubscriptionException;
import com.zosh.librarymanagementsystem.payload.dto.SubscriptionDTO;
import com.zosh.librarymanagementsystem.payload.request.SubscriptionSearchRequest;
import com.zosh.librarymanagementsystem.payload.response.ApiResponse;
import com.zosh.librarymanagementsystem.payload.response.PageResponse;
import com.zosh.librarymanagementsystem.payload.response.PaymentInitiateResponse;
import com.zosh.librarymanagementsystem.payload.response.SubscriptionStatsResponse;
import com.zosh.librarymanagementsystem.service.SubscriptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    @GetMapping("/my")
    public ResponseEntity<PageResponse<SubscriptionDTO>> getMySubscriptions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(subscriptionService.getMySubscriptions(page, size));
    }

    @GetMapping({"/admin", "/admin/"})
    public ResponseEntity<PageResponse<SubscriptionDTO>> getAllSubscriptions(
            @RequestParam(required = false) String searchTerm,
            @RequestParam(required = false) Long planId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection) {
        SubscriptionSearchRequest request = new SubscriptionSearchRequest();
        request.setSearchTerm(searchTerm);
        request.setPlanId(planId);
        request.setStatus(status);
        request.setPage(page);
        request.setSize(size);
        request.setSortBy(sortBy);
        request.setSortDirection(sortDirection);
        return ResponseEntity.ok(subscriptionService.searchSubscriptions(request));
    }

    @GetMapping("/admin/stats")
    public ResponseEntity<SubscriptionStatsResponse> getSubscriptionStats() {
        return ResponseEntity.ok(subscriptionService.getSubscriptionStats());
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
