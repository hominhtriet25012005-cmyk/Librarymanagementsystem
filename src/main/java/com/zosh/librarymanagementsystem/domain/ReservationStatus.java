package com.zosh.librarymanagementsystem.domain;

public enum ReservationStatus {

    /** Đang chờ sách có bản trống. */
    PENDING,

    /** Sách đã sẵn sàng để người dùng đến nhận. */
    AVAILABLE,

    /** Người dùng đã nhận cuốn sách được giữ chỗ. */
    FULFILLED,

    /** Người dùng hoặc quản trị viên đã hủy đặt chỗ. */
    CANCELLED,

    /** Đặt chỗ hết hạn vì người dùng không nhận sách đúng thời hạn. */
    EXPIRED

}
