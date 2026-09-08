package com.zosh.librarymanagementsystem.event.publisher;

import com.zosh.librarymanagementsystem.modal.Payment;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PaymentPublisher {

    private final ApplicationEventPublisher applicationEventPublisher;

    public void publishPaymentSuccessEvent(Payment payment) {
        applicationEventPublisher.publishEvent(payment);
    }
}
