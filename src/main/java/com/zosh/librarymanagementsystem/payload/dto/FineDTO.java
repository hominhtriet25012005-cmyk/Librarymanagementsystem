package com.zosh.librarymanagementsystem.payload.dto;

import com.zosh.librarymanagementsystem.domain.FineStatus;
import com.zosh.librarymanagementsystem.domain.FineType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FineDTO {

    private Long id;

    @NotNull(message = "ID phiếu mượn là bắt buộc")
    private Long bookLoanId;

    private String bookTitle;

    private String bookIsbn;

    @NotNull(message = "ID người dùng là bắt buộc")
    private Long userId;

    private String userName;

    private String userEmail;

    @NotNull(message = "Loại tiền phạt là bắt buộc")
    private FineType type;

    @NotNull(message = "Số tiền phạt là bắt buộc")
    @PositiveOrZero(message = "Số tiền phạt không được âm")
    private Long amount;

    @PositiveOrZero(message = "Số tiền đã thanh toán không được âm")
    private Long amountPaid;

    private Long amountOutstanding;

    @NotNull(message = "Trạng thái tiền phạt là bắt buộc")
    private FineStatus status;

    private String reason;

    private String notes;

    // Thông tin miễn phạt.
    private Long waivedByUserId;

    private String waivedByUserName;

    private LocalDateTime waivedAt;

    private String waiverReason;

    // Thông tin thanh toán.
    private LocalDateTime paidAt;

    private Long processedByUserId;

    private String processedByUserName;

    private String transactionId;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
