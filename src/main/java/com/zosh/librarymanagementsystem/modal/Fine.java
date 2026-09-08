package com.zosh.librarymanagementsystem.modal;

import com.zosh.librarymanagementsystem.domain.FineStatus;
import com.zosh.librarymanagementsystem.domain.FineType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "fines", indexes = {
        @Index(name = "idx_fine_user_status", columnList = "user_id,status"),
        @Index(name = "idx_fine_book_loan", columnList = "book_loan_id")
}, uniqueConstraints = @UniqueConstraint(
        name = "uk_fine_book_loan_type", columnNames = {"book_loan_id", "type"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Fine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(optional = false)
    @JoinColumn(name = "book_loan_id", nullable = false)
    private BookLoan bookLoan;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private FineType type;

    @Column(nullable = false)
    private Long amount;

    @Column(nullable = false)
    @Builder.Default
    private Long amountPaid = 0L;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FineStatus status;

    @Column(length = 500)
    private String reason;

    @Column(length = 1000)
    private String notes;

    @ManyToOne
    private User waivedBy;

    @Column(name = "waived_at")
    private LocalDateTime waivedAt;

    @Column(name = "waiver_reason", length = 500)
    private String waiverReason;

    // Thông tin thanh toán tiền phạt.
    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "processed_by_user_id")
    private User processedBy;

    @Column(name = "transaction_id", length = 100)
    private String transactionId;

    @Column(nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    @Column(nullable = false)
    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public void applyPayment(Long paymentAmount) {
        if (paymentAmount == null || paymentAmount <= 0) {
            throw new IllegalArgumentException("Số tiền thanh toán phải lớn hơn 0");
        }
        long currentPaid = amountPaid == null ? 0L : amountPaid;
        long newPaid = Math.addExact(currentPaid, paymentAmount);
        if (newPaid > amount) {
            throw new IllegalArgumentException("Số tiền thanh toán vượt quá tiền phạt còn lại");
        }
        this.amountPaid = newPaid;
        this.status = newPaid == amount ? FineStatus.PAID : FineStatus.PARTIALLY_PAID;
        if (this.status == FineStatus.PAID) {
            this.paidAt = LocalDateTime.now();
        }
    }

    public void waive(User admin, String reason) {
        this.status = FineStatus.WAIVED;
        this.waivedBy = admin;
        this.waivedAt = LocalDateTime.now();
        this.waiverReason = reason;
    }

    public long getAmountOutstanding() {
        long paid = amountPaid == null ? 0L : amountPaid;
        return Math.max(amount - paid, 0L);
    }
}
