package com.zosh.librarymanagementsystem.payload.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookReviewDTO {

    private Long id;

    @NotNull(message = "ID người dùng là bắt buộc")
    private Long userId;

    private String userName;

    @NotNull(message = "ID sách là bắt buộc")
    private Long bookId;

    private String bookTitle;

    @NotNull(message = "Điểm đánh giá là bắt buộc")
    @Min(value = 1, message = "Điểm đánh giá phải từ 1 trở lên")
    @Max(value = 5, message = "Điểm đánh giá không được vượt quá 5")
    private Integer rating;

    @NotBlank(message = "Nội dung đánh giá là bắt buộc")
    @Size(min = 10, max = 2000, message = "Nội dung đánh giá phải có từ 10 đến 2.000 ký tự")
    private String reviewText;

    @Size(max = 200, message = "Tiêu đề đánh giá không được vượt quá 200 ký tự")
    private String title;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
}
