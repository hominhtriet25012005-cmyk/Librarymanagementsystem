package com.zosh.librarymanagementsystem.payload.request;

import com.zosh.librarymanagementsystem.domain.ReservationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReservationSearchRequest {

    // Bộ lọc người dùng và sách.
    private Long userId;

    private Long bookId;

    // Bộ lọc trạng thái.
    private ReservationStatus status;

    // Chỉ lấy đặt chỗ đang hoạt động (PENDING hoặc AVAILABLE).
    private Boolean activeOnly;

    // Phân trang.
    @Builder.Default
    private int page = 0;
    @Builder.Default
    private int size = 20;

    // Sắp xếp.
    @Builder.Default
    private String sortBy = "reservedAt"; // reservedAt, availableAt, queuePosition hoặc status.
    @Builder.Default
    private String sortDirection = "DESC"; // ASC hoặc DESC.

}
