package com.zosh.librarymanagementsystem.payload.dto;

import com.zosh.librarymanagementsystem.domain.AuthProvider;
import com.zosh.librarymanagementsystem.domain.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserDTO {
    private Long id;

    @NotBlank(message = "Email là bắt buộc")
    @Email(message = "Email không đúng định dạng")
    @Size(max = 150, message = "Email không được vượt quá 150 ký tự")
    private String email;

    @NotBlank(message = "Mật khẩu là bắt buộc")
    @Size(min = 8, message = "Mật khẩu phải có ít nhất 8 ký tự")
    private String password;
    @Size(max = 30, message = "Số điện thoại không được vượt quá 30 ký tự")
    private String phone;

    @NotBlank(message = "Họ tên là bắt buộc")
    @Size(max = 150, message = "Họ tên không được vượt quá 150 ký tự")
    private String fullName;
    private String username;
    private UserRole role;
    private AuthProvider authProvider;
    private Boolean verified;
    private LocalDateTime lastLogin;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
