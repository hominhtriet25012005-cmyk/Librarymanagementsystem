package com.zosh.librarymanagementsystem.payload.dto;

import com.zosh.librarymanagementsystem.domain.UserRole;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserDTO {
    private Long id;

    @NotNull(message = "email is required")
    private String email;

    @NotNull(message = "password is required")
    private String password;
    private String phone;

    @NotNull(message = "fullName is required")
    private String fullName;
    private String username;
    private UserRole role;

    private LocalDateTime lastLogin;




}
