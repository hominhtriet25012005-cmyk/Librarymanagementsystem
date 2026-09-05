package com.zosh.librarymanagementsystem.payload.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GenreDTO {
    private Long id;

    @NotBlank(message = "Mã thể loại là bắt buộc")
    private String code;

    @NotBlank(message = "Tên thể loại là bắt buộc")
    private String name;

    @Size(max = 500,message = "Mô tả không được vượt quá 500 ký tự")
    private String description;

    @Min(value = 0, message = "Thứ tự hiển thị không được âm")
    @Builder.Default
    private Integer displayOrder=0;

    private Boolean active;

    private Long parentGenreId;

    private String parentGenreName;

    private List<GenreDTO> subGenre;

    private Long bookCount;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

}
