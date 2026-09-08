package com.zosh.librarymanagementsystem.service;

import com.zosh.librarymanagementsystem.payload.dto.SubscriptionDTO;
import com.zosh.librarymanagementsystem.payload.response.PaymentInitiateResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface SubscriptionService {

    PaymentInitiateResponse subscribe(SubscriptionDTO subscriptionDTO);

    SubscriptionDTO getUsersActiveSubscription();

    SubscriptionDTO getUsersActiveSubscription(Long userId);

    SubscriptionDTO cancelSubscription(Long subscriptionId, String reason);

    SubscriptionDTO activateSubscription(Long subscriptionId, Long paymentId);

    List<SubscriptionDTO> getAllSubscriptions(Pageable pageable);

    void deactivateExpiredSubscriptions();
}
