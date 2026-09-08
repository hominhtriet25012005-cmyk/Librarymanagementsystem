package com.zosh.librarymanagementsystem.modal;

import com.zosh.librarymanagementsystem.domain.BookLoanStatus;
import com.zosh.librarymanagementsystem.domain.BookLoanType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "book_loans", indexes = {
        @Index(name = "idx_book_loan_user_status", columnList = "user_id,status"),
        @Index(name = "idx_book_loan_book_status", columnList = "book_id,status"),
        @Index(name = "idx_book_loan_due_date", columnList = "due_date")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookLoan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JoinColumn(name = "user_id", nullable = false)
    @ManyToOne(optional = false)
    private User user;

    @JoinColumn(name = "book_id", nullable = false)
    @ManyToOne(optional = false)
    private Book book;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BookLoanType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BookLoanStatus status;

    @Column(nullable = false)
    private LocalDate checkoutDate;

    @Column(nullable = false)
    private LocalDate dueDate;

    private LocalDate returnDate;

    @Column(nullable = false)
    @Builder.Default
    private Integer renewalCount = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer maxRenewals = 2;

    // Tiền phạt được quản lý trong thực thể Fine và liên kết qua phiếu mượn.

    @Column(length = 500)
    private String notes;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isOverdue = false;

    @Column(nullable = false)
    @Builder.Default
    private Integer overdueDays = 0;

    @Column(nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    @Column(nullable = false)
    @org.hibernate.annotations.UpdateTimestamp
    private LocalDateTime updatedAt;

    public boolean isActive() {
        return status == BookLoanStatus.CHECKED_OUT
                || status == BookLoanStatus.OVERDUE;
    }

    public boolean canRenew() {
        return status == BookLoanStatus.CHECKED_OUT
                && !Boolean.TRUE.equals(isOverdue)
                && renewalCount != null
                && maxRenewals != null
                && renewalCount < maxRenewals;
    }
}
