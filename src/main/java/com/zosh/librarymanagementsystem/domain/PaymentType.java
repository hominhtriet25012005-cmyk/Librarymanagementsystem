package com.zosh.librarymanagementsystem.domain;

public enum PaymentType {
    FINE, MEMBERSHIP,
    LOST_BOOK_PENALTY,

    /** Thanh toán khoản phạt làm hư hỏng sách. */
    DAMAGED_BOOK_PENALTY,

    /** Hoàn tiền cho người dùng. */
    REFUND,
}
