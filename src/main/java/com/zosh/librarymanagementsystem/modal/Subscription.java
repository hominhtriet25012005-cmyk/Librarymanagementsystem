package com.zosh.librarymanagementsystem.modal;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Entity
@Table(name = "subscriptions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Subscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(optional = false)
    @JoinColumn(name = "plan_id", nullable = false)
    private SubscriptionPlan plan;

    @Column(nullable = false, length = 100)
    private String planName;

    @Column(nullable = false, length = 100)
    private String planCode;

    @Column(nullable = false)
    private Long price;

    @Column(nullable = false, length = 3)
    private String currency;

    @Column(nullable = false)
    private Integer maxBooksAllowed;

    @Column(nullable = false)
    private Integer maxDaysPerBook;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(nullable = false)
    @Builder.Default
    private Boolean autoRenew = false;

    private LocalDateTime cancelledAt;

    @Column(columnDefinition = "TEXT")
    private String cancellationReason;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(nullable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public boolean isValid() {
        if (!Boolean.TRUE.equals(isActive) || startDate == null || endDate == null) {
            return false;
        }

        LocalDate today = LocalDate.now();
        return !today.isBefore(startDate) && !today.isAfter(endDate);
    }

    public boolean isExpired() {
        return endDate != null && LocalDate.now().isAfter(endDate);
    }

    public long getDaysRemaining() {
        if (endDate == null || isExpired()) {
            return 0;
        }
        return ChronoUnit.DAYS.between(LocalDate.now(), endDate);
    }

    public void initializeFromPlan() {
        if (plan != null) {
            this.planName = plan.getName();
            this.planCode = plan.getPlanCode();
            this.price = plan.getPrice();
            this.currency = plan.getCurrency();
            this.maxBooksAllowed = plan.getMaxBooksAllowed();
            this.maxDaysPerBook = plan.getMaxDaysPerBook();
            if (startDate==null) {
                this.startDate = LocalDate.now();
            }
            calculateEndDate();
        }
    }

    public void calculateEndDate() {
        if (startDate != null && plan != null && plan.getDurationDays() != null) {
            this.endDate = startDate.plusDays(plan.getDurationDays());
        }
    }
}
