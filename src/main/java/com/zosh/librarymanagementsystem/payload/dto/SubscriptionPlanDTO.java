package com.zosh.librarymanagementsystem.payload.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.time.LocalDateTime;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionPlanDTO {

    private Long id;

    @NotBlank(message = "Mã gói thành viên là bắt buộc")
    private String planCode;

    @NotBlank(message = "Tên gói thành viên là bắt buộc")
    private String name;

    private String description;

    @NotNull(message = "Thời hạn gói là bắt buộc")
    @Positive(message = "Thời hạn gói phải lớn hơn 0")
    private Integer durationDays;

    @NotNull(message = "Giá gói là bắt buộc")
    @Positive(message = "Giá gói phải lớn hơn 0")
    private Long price;

    private String currency;

    @NotNull(message = "Số sách tối đa là bắt buộc")
    @Positive(message = "Số sách tối đa phải lớn hơn 0")
    private Integer maxBooksAllowed;

    @NotNull(message = "Số ngày mượn tối đa là bắt buộc")
    @Positive(message = "Số ngày mượn tối đa phải lớn hơn 0")
    private Integer maxDaysPerBook;

    private Integer displayOrder;
    private Boolean isActive;
    private Boolean isFeatured;
    private String badgeText;
    private String adminNotes;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;
}
