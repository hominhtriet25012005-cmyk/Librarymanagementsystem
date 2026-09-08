package com.zosh.librarymanagementsystem.payload.request;

import com.zosh.librarymanagementsystem.domain.BookLoanStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CheckinRequest {

    @NotNull(message = "ID phiếu mượn là bắt buộc")
    private Long bookLoanId;

    private BookLoanStatus condition = BookLoanStatus.RETURNED; // Có thể là RETURNED, LOST hoặc DAMAGED.

    private String notes;
}
