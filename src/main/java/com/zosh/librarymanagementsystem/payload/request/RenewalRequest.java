package com.zosh.librarymanagementsystem.payload.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RenewalRequest {

    @NotNull(message = "ID phiếu mượn là bắt buộc")
    private Long bookLoanId;

    @Min(value = 1, message = "Số ngày gia hạn phải lớn hơn hoặc bằng 1")
    private Integer extensionDays = 14; // Mặc định gia hạn 14 ngày.

    private String notes;
}
