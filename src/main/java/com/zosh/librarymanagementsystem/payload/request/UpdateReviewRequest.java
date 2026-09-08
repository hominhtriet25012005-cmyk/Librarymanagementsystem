package com.zosh.librarymanagementsystem.payload.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateReviewRequest {

    @NotNull(message = "Điểm đánh giá là bắt buộc")
    @Min(value = 1, message = "Điểm đánh giá phải từ 1 trở lên")
    @Max(value = 5, message = "Điểm đánh giá không được vượt quá 5")
    private Integer rating;

    @NotBlank(message = "Nội dung đánh giá là bắt buộc")
    @Size(min = 10, max = 2000, message = "Nội dung đánh giá phải có từ 10 đến 2.000 ký tự")
    private String reviewText;

    @Size(max = 200, message = "Tiêu đề đánh giá không được vượt quá 200 ký tự")
    private String title;
}
