package com.zosh.librarymanagementsystem.payload.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class WishlistDTO {

    private Long id;
    private Long userId;
    private String userFullName;
    private BookDTO book;
    private LocalDateTime addedAt;
    private String notes;
}
