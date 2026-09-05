package com.zosh.librarymanagementsystem.payload.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LoginRequest {

    @NotNull(message = "user name or email")
    private String email;

    @NotNull(message = "password is required")
    private String password;
}
