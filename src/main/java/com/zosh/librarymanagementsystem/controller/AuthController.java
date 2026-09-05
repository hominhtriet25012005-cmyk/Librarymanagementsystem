package com.zosh.librarymanagementsystem.controller;

import com.zosh.librarymanagementsystem.exception.UserException;
import com.zosh.librarymanagementsystem.payload.dto.UserDTO;
import com.zosh.librarymanagementsystem.payload.request.ForgotPasswordRequest;
import com.zosh.librarymanagementsystem.payload.request.LoginRequest;
import com.zosh.librarymanagementsystem.payload.request.ResetPasswordRequest;
import com.zosh.librarymanagementsystem.payload.response.ApiResponse;
import com.zosh.librarymanagementsystem.payload.response.AuthResponse;
import com.zosh.librarymanagementsystem.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signupHandler (
            @Valid @RequestBody UserDTO req
            ) throws UserException {
        AuthResponse res = authService.signup(req);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> loginHandler (
            @Valid @RequestBody LoginRequest req
    ) throws UserException {
        AuthResponse res = authService.login(req.getEmail(), req.getPassword());
        return ResponseEntity.ok(res);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request
    ) throws  UserException {
        authService.createPasswordResetToken(request.getEmail());

        ApiResponse res = new ApiResponse(
                "Đã gửi đường dẫn đặt lại mật khẩu đến email của bạn.", true
        );
        return ResponseEntity.ok(res);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request
    ) throws UserException {
        authService.resetPassword(request.getToken(), request.getPassword());

        ApiResponse res = new ApiResponse(
                "Đặt lại mật khẩu thành công", true
        );
        return ResponseEntity.ok(res);
    }
}
