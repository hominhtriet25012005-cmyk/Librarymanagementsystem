package com.zosh.librarymanagementsystem.service;

import com.zosh.librarymanagementsystem.configuration.JwtProvider;
import com.zosh.librarymanagementsystem.domain.UserRole;
import com.zosh.librarymanagementsystem.exception.UserException;
import com.zosh.librarymanagementsystem.modal.PasswordResetToken;
import com.zosh.librarymanagementsystem.modal.User;
import com.zosh.librarymanagementsystem.payload.dto.UserDTO;
import com.zosh.librarymanagementsystem.payload.response.AuthResponse;
import com.zosh.librarymanagementsystem.repository.PasswordResetTokenRepository;
import com.zosh.librarymanagementsystem.repository.UserRepository;
import com.zosh.librarymanagementsystem.service.impl.AuthServiceImpl;
import com.zosh.librarymanagementsystem.service.impl.CustomUserServiceImplementation;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtProvider jwtProvider;
    @Mock private CustomUserServiceImplementation customUserServiceImplementation;
    @Mock private PasswordResetTokenRepository passwordResetTokenRepository;
    @Mock private EmailService emailService;

    @InjectMocks
    private AuthServiceImpl authService;

    @AfterEach
    void xoaSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void dangKyTaoNguoiDungVaTraJwt() {
        UserDTO request = new UserDTO();
        request.setEmail("ban.doc@example.com");
        request.setPassword("matkhau123");
        request.setFullName("Bạn Đọc");
        request.setPhone("0900000000");

        when(userRepository.findByEmail(request.getEmail())).thenReturn(null);
        when(passwordEncoder.encode(request.getPassword())).thenReturn("mat-khau-da-ma-hoa");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(10L);
            return user;
        });
        when(jwtProvider.generateToken(any())).thenReturn("jwt-test");

        AuthResponse response = authService.signup(request);

        assertEquals("jwt-test", response.getJwt());
        assertEquals(UserRole.ROLE_USER, response.getUser().getRole());
        assertNull(response.getUser().getPassword());
        verify(passwordEncoder).encode("matkhau123");
    }

    @Test
    void khongChoDangKyEmailDaTonTai() {
        UserDTO request = new UserDTO();
        request.setEmail("da-co@example.com");
        when(userRepository.findByEmail(request.getEmail())).thenReturn(new User());

        UserException error = assertThrows(UserException.class,
                () -> authService.signup(request));

        assertTrue(error.getMessage().contains("đã được đăng ký"));
        verify(userRepository, never()).save(any());
    }

    @Test
    void tokenResetHetHanBiXoaVaKhongDoiMatKhau() {
        User user = User.builder().id(1L).password("cu").build();
        PasswordResetToken token = PasswordResetToken.builder()
                .token("expired-token")
                .user(user)
                .expiryDate(LocalDateTime.now().minusMinutes(1))
                .build();
        when(passwordResetTokenRepository.findByToken("expired-token"))
                .thenReturn(Optional.of(token));

        UserException error = assertThrows(UserException.class,
                () -> authService.resetPassword("expired-token", "matkhaumoi"));

        assertTrue(error.getMessage().contains("hết hạn"));
        verify(passwordResetTokenRepository).delete(token);
        verify(userRepository, never()).save(any());
    }
}
