package com.zosh.librarymanagementsystem.payload.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class BookDTO {

    private Long id;

    @NotBlank(message = "ISBN là bắt buộc")
    private String isbn;

    @NotBlank(message = "Tên sách là bắt buộc")
    @Size(max = 255, message = "Tên sách không được vượt quá 255 ký tự")
    private String title;

    @NotBlank(message = "Tác giả là bắt buộc")
    @Size(max = 255, message = "Tên tác giả không được vượt quá 255 ký tự")
    private String author;

    @NotNull(message = "Thể loại là bắt buộc")
    private Long genreId;

    private String genreName;

    private String genreCode;

    @Size(max = 100, message = "Tên nhà xuất bản không được vượt quá 100 ký tự")
    private String publisher;

    private LocalDate publicationDate;

    @Size(max = 20, message = "Ngôn ngữ không được vượt quá 20 ký tự")
    private String language;

    @Min(value = 1, message = "Số trang phải từ 1 trở lên")
    @Max(value = 50000, message = "Số trang không được vượt quá 50000")
    private Integer pages;

    @Size(max = 2000, message = "Mô tả không được vượt quá 2000 ký tự")
    private String description;

    @Min(value = 0, message = "Tổng số bản không được âm")
    @NotNull(message = "Tổng số bản là bắt buộc")
    private Integer totalCopies;

    @Min(value = 0, message = "Số bản có sẵn không được âm")
    @NotNull(message = "Số bản có sẵn là bắt buộc")
    private Integer availableCopies;

    private BigDecimal price;

    @Size(max = 500, message = "URL ảnh bìa không được vượt quá 500 ký tự")
    private String coverImageUrl;

    private Boolean alreadyHaveLoan;
    private Boolean alreadyHaveReservation;

    private Boolean active;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

}
