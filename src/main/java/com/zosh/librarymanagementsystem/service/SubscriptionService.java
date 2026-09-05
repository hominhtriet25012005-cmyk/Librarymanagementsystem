package com.zosh.librarymanagementsystem.service;

import com.zosh.librarymanagementsystem.payload.dto.SubscriptionDTO;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface SubscriptionService {

    SubscriptionDTO subscribe(SubscriptionDTO subscriptionDTO) throws Exception;

    SubscriptionDTO getUsersActiveSubscription();

    SubscriptionDTO cancelSubscription(Long subscriptionId, String reason);

    SubscriptionDTO activateSubscription(Long subscriptionId, Long paymentId);

    List<SubscriptionDTO> getAllSubscriptions(Pageable pageable);

    void  deactivateExpiredSubscriptions() throws Exception;
}
