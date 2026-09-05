package com.zosh.librarymanagementsystem.modal;

import jakarta.persistence.*;
import jakarta.validation.constraints.Positive;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "subscription_plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String planCode;

    @Column(nullable = false, length = 100)
    private String name;


    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private Integer durationDays;

    @Column(nullable = false)
    @Positive(message = "Giá gói phải lớn hơn 0")
    private Long price;

    @Builder.Default
    private String currency="INR";

    @Column(nullable = false)
    @Positive(message = "Số sách tối đa phải lớn hơn 0")
    private Integer maxBooksAllowed;

    @Column(nullable = false)
    @Positive(message = "Số ngày mượn tối đa phải lớn hơn 0")
    private Integer maxDaysPerBook;

    @Builder.Default
    private Integer displayOrder=0;

    @Builder.Default
    private Boolean isActive=true;
    @Builder.Default
    private Boolean isFeatured=false;

    private String badgeText;

    private String adminNotes;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    private String createdBy;
    private String updatedBy;

}
