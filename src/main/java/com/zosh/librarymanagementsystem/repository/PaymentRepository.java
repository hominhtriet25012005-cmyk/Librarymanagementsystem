package com.zosh.librarymanagementsystem.repository;

import com.zosh.librarymanagementsystem.modal.Payment;
import com.zosh.librarymanagementsystem.domain.PaymentStatus;
import com.zosh.librarymanagementsystem.domain.PaymentType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.Collection;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByGatewayPaymentId(String gatewayPaymentId);

    Page<Payment> findByUserId(Long userId, Pageable pageable);

    Optional<Payment> findFirstByFineIdAndStatusInOrderByCreatedAtDesc(
            Long fineId, Collection<PaymentStatus> statuses);

    @Query("""
            SELECT p FROM Payment p
            WHERE (:status IS NULL OR p.status = :status)
              AND (:paymentType IS NULL OR p.paymentType = :paymentType)
            """)
    Page<Payment> findAllWithFilters(
            @Param("status") PaymentStatus status,
            @Param("paymentType") PaymentType paymentType,
            Pageable pageable);
}
