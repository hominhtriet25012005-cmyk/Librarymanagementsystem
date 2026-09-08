package com.zosh.librarymanagementsystem.domain;

public enum BookLoanStatus {
    /** Sách đang được người dùng mượn. */
    CHECKED_OUT,

    /** Sách đã được trả, phiếu mượn hoàn tất. */
    RETURNED,

    /** Phiếu mượn đã quá hạn nhưng sách chưa được trả. */
    OVERDUE,

    /** Người dùng làm mất sách. */
    LOST,

    /** Sách bị hư hỏng trong thời gian mượn. */
    DAMAGED
}
