package com.zosh.librarymanagementsystem.domain;

public enum BookLoanType {
    /** Mượn sách lần đầu. */
    CHECKOUT,

    /** Gia hạn ngày trả sách. */
    RENEWAL,

    /** Trả sách. */
    RETURN
}
