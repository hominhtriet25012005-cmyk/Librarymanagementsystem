package com.zosh.librarymanagementsystem.exception;

/** Lỗi nghiệp vụ chung của các module mượn sách, đặt chỗ, đánh giá và tiền phạt. */
public class LibraryOperationException extends RuntimeException {

    public LibraryOperationException(String message) {
        super(message);
    }
}
