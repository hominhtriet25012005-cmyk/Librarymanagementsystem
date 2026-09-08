package com.zosh.librarymanagementsystem.payload.dto;

import com.zosh.librarymanagementsystem.domain.ReservationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;


@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReservationDTO {

    private Long id;

    // Thông tin người đặt chỗ.
    private Long userId;
    private String userName;
    private String userEmail;

    // Thông tin sách.
    private Long bookId;
    private String bookTitle;
    private String bookIsbn;
    private String bookAuthor;
    private Boolean isBookAvailable;

    // Chi tiết đặt chỗ.
    private ReservationStatus status;
    private LocalDateTime reservedAt;
    private LocalDateTime availableAt;
    private LocalDateTime availableUntil;
    private LocalDateTime fulfilledAt;
    private LocalDateTime cancelledAt;
    private Integer queuePosition;
    private Boolean notificationSent;
    private String notes;

    // Thời điểm tạo và cập nhật.
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Các trường được tính từ trạng thái hiện tại.
    private boolean isExpired;
    private boolean canBeCancelled;
    private Long hoursUntilExpiry; // Số giờ còn lại để đến nhận sách.
}
