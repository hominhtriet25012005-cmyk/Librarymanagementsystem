package com.zosh.librarymanagementsystem.domain;

public enum FineType {

    OVERDUE,

    /** Phạt do làm hư hỏng sách. */
    DAMAGE,

    /** Phạt do làm mất sách, thường theo chi phí thay thế. */
    LOSS,

    /** Phí xử lý hoặc phí hành chính. */
    PROCESSING
}
