package com.zosh.librarymanagementsystem.domain;

public enum FineStatus {

    PENDING,

    /** Khoản phạt đã được thanh toán một phần. */
    PARTIALLY_PAID,

    /** Khoản phạt đã được thanh toán đủ. */
    PAID,

    /** Khoản phạt đã được quản trị viên miễn. */
    WAIVED
}
