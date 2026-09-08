package com.zosh.librarymanagementsystem.payload.request;

import com.zosh.librarymanagementsystem.domain.FineType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateFineRequest {

    @NotNull(message = "ID phiếu mượn là bắt buộc")
    private Long bookLoanId;

    @NotNull(message = "Loại tiền phạt là bắt buộc")
    private FineType type;

    @NotNull(message = "Số tiền phạt là bắt buộc")
    @Positive(message = "Số tiền phạt phải lớn hơn 0")
    private Long amount;

    private String reason;

    private String notes;
}
