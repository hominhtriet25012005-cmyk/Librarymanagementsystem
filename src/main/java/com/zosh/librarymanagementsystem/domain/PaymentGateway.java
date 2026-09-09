package com.zosh.librarymanagementsystem.domain;

public enum PaymentGateway {
    RAZORPAY,

    /** Chuyển khoản ngân hàng bằng mã VietQR và được quản trị viên đối soát. */
    VIETQR,

    /** Cổng Stripe, dành cho việc bổ sung sau. */
    STRIPE,
}
