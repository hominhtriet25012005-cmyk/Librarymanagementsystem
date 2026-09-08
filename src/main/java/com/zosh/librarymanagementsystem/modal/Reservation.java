package com.zosh.librarymanagementsystem.modal;

import com.zosh.librarymanagementsystem.domain.ReservationStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "reservations", indexes = {
        @Index(name = "idx_reservation_book_status_time", columnList = "book_id,status,reserved_at"),
        @Index(name = "idx_reservation_user_status", columnList = "user_id,status")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(optional = false)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ReservationStatus status = ReservationStatus.PENDING;

    @Column(name = "reserved_at", nullable = false)
    private LocalDateTime reservedAt;

    private LocalDateTime availableAt;

    private LocalDateTime availableUntil;

    @Column(name = "fulfilled_at")
    private LocalDateTime fulfilledAt;

    /** Thời điểm đặt chỗ bị hủy hoặc hết hạn. */
    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    /** Vị trí trong hàng chờ của cuốn sách. */
    @Column(name = "queue_position")
    private Integer queuePosition;

    /** Đã gửi thông báo khi sách sẵn sàng hay chưa. */
    @Column(name = "notification_sent", nullable = false)
    @Builder.Default
    private Boolean notificationSent = false;

    /** Ghi chú hoặc lý do hủy. */
    @Column(columnDefinition = "TEXT")
    private String notes;

    /** Thời điểm tạo bản ghi. */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /** Thời điểm cập nhật bản ghi gần nhất. */
    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public boolean canBeCancelled() {
        return status == ReservationStatus.PENDING
                || status == ReservationStatus.AVAILABLE;
    }

    /** Kiểm tra đặt chỗ đã quá hạn nhận sách hay chưa. */
    public boolean hasExpired() {
        return status == ReservationStatus.AVAILABLE
                && availableUntil != null
                && LocalDateTime.now().isAfter(availableUntil);
    }

}
