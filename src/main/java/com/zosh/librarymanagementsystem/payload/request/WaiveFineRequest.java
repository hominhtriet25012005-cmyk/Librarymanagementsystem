package com.zosh.librarymanagementsystem.payload.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WaiveFineRequest {

    @NotNull(message = "ID khoản phạt là bắt buộc")
    private Long fineId;

    @NotBlank(message = "Lý do miễn phạt là bắt buộc")
    private String reason;
}
