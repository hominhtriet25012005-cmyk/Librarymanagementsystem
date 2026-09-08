package com.zosh.librarymanagementsystem.event.listener;

import com.zosh.librarymanagementsystem.modal.Payment;
import com.zosh.librarymanagementsystem.service.SubscriptionService;
import com.zosh.librarymanagementsystem.service.FineService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PaymentEventListener {

    private final SubscriptionService subscriptionService;
    private final FineService fineService;

    @EventListener
    @Transactional
    public void  handlePaymentSuccess(Payment payment) {
        switch (payment.getPaymentType()) {
            case FINE :
                if (payment.getFine() != null) {
                    fineService.markFineAsPaid(payment.getFine().getId(),
                            payment.getAmount(), payment.getGatewayPaymentId());
                }
                break;
            case LOST_BOOK_PENALTY:
            case DAMAGED_BOOK_PENALTY:
                break;

            case MEMBERSHIP:
                subscriptionService
                        .activateSubscription(payment.getSubscription().getId(),
                                payment.getId());
        }
    }
}
