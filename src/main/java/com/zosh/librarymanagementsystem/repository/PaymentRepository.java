package com.zosh.librarymanagementsystem.repository;

import com.zosh.librarymanagementsystem.modal.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByGatewayPaymentId(String gatewayPaymentId);
}
