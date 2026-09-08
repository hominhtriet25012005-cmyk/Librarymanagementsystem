package com.zosh.librarymanagementsystem.payload.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CheckoutRequest {

    @NotNull(message = "ID sách là bắt buộc")
    private Long bookId;

    @Min(value = 1, message = "Số ngày mượn phải lớn hơn hoặc bằng 1")
    private Integer checkoutDays = 14; // Mặc định mượn 14 ngày.

    private String notes;
}
