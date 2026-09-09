package com.zosh.librarymanagementsystem.payload.request;

import com.zosh.librarymanagementsystem.domain.UserRole;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UserAdminUpdateRequest {

    @NotNull(message = "Vai trò là bắt buộc")
    private UserRole role;

    @NotNull(message = "Trạng thái xác minh là bắt buộc")
    private Boolean verified;
}
