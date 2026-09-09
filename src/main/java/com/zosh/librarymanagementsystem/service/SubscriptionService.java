package com.zosh.librarymanagementsystem.service;

import com.zosh.librarymanagementsystem.payload.dto.SubscriptionDTO;
import com.zosh.librarymanagementsystem.payload.request.SubscriptionSearchRequest;
import com.zosh.librarymanagementsystem.payload.response.PageResponse;
import com.zosh.librarymanagementsystem.payload.response.PaymentInitiateResponse;
import com.zosh.librarymanagementsystem.payload.response.SubscriptionStatsResponse;

public interface SubscriptionService {

    PaymentInitiateResponse subscribe(SubscriptionDTO subscriptionDTO);

    SubscriptionDTO getUsersActiveSubscription();

    SubscriptionDTO getUsersActiveSubscription(Long userId);

    SubscriptionDTO cancelSubscription(Long subscriptionId, String reason);

    SubscriptionDTO activateSubscription(Long subscriptionId, Long paymentId);

    PageResponse<SubscriptionDTO> getMySubscriptions(int page, int size);

    PageResponse<SubscriptionDTO> searchSubscriptions(SubscriptionSearchRequest request);

    SubscriptionStatsResponse getSubscriptionStats();

    void deactivateExpiredSubscriptions();
}
