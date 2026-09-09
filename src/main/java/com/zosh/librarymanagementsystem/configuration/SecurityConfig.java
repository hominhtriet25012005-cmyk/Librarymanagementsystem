package com.zosh.librarymanagementsystem.configuration;

import jakarta.servlet.http.HttpServletRequest;
import org.jspecify.annotations.Nullable;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.http.HttpMethod;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import lombok.RequiredArgsConstructor;

import java.util.Arrays;
import java.util.Collections;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtValidator jwtValidator;

    @Value("${app.cors.allowed-origins:http://localhost:5173}")
    private String allowedOrigins;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        return http
                .sessionManagement(managment -> managment.sessionCreationPolicy(
                        SessionCreationPolicy.STATELESS
                ))

                .authorizeHttpRequests(Authorize -> Authorize
                        // API quản trị gói phải được xét trước API tra cứu công khai.
                        .requestMatchers("/api/subscription-plan/admin", "/api/subscription-plan/admin/**")
                        .hasRole("ADMIN")
                        .requestMatchers("/api/subscriptions/admin", "/api/subscriptions/admin/**")
                        .hasRole("ADMIN")
                        .requestMatchers("/api/payments/admin/**")
                        .hasRole("ADMIN")
                        // Các API tra cứu công khai phục vụ trang danh mục sách.
                        .requestMatchers(HttpMethod.GET,
                                "/api/books/**", "/api/genres/**", "/api/subscription-plan",
                                "/api/reviews/book/**")
                        .permitAll()

                        // Nghiệp vụ mượn/trả và tra cứu toàn hệ thống dành cho quản trị viên.
                        .requestMatchers(HttpMethod.POST,
                                "/api/book-loans/checkout/user/**",
                                "/api/book-loans/checkin",
                                "/api/book-loans/search",
                                "/api/book-loans/admin/**")
                        .hasRole("ADMIN")

                        // Quản trị đặt chỗ hộ, giao sách và tra cứu toàn bộ hàng chờ.
                        .requestMatchers(HttpMethod.POST,
                                "/api/reservations/user/**", "/api/reservations/*/fulfill")
                        .hasRole("ADMIN")
                        .requestMatchers("/api/reservations/admin/**")
                        .hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/reservations")
                        .hasRole("ADMIN")

                        // Tạo/miễn phạt, xem toàn bộ phạt và xem toàn bộ thanh toán là quyền quản trị.
                        .requestMatchers(HttpMethod.POST, "/api/fines", "/api/fines/waive")
                        .hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/fines", "/api/payments")
                        .hasRole("ADMIN")
                        .requestMatchers("/api/user/list").hasRole("ADMIN")
                        .requestMatchers("/api/user/admin", "/api/user/admin/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/books/admin/**", "/api/genres/**")
                        .hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/books/**", "/api/genres/**")
                        .hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/books/**", "/api/genres/**")
                        .hasRole("ADMIN")
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/**").authenticated()
                        .anyRequest().permitAll()

                )
                .addFilterBefore(jwtValidator, BasicAuthenticationFilter.class)
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .build();
    }

    private CorsConfigurationSource corsConfigurationSource() {

        return new CorsConfigurationSource() {
            @Override
            public @Nullable CorsConfiguration getCorsConfiguration(HttpServletRequest request) {
                CorsConfiguration cfg = new CorsConfiguration();
                cfg.setAllowCredentials(true);
                cfg.setAllowedOrigins(Arrays.stream(allowedOrigins.split(","))
                        .map(String::trim)
                        .filter(origin -> !origin.isBlank())
                        .toList());
                cfg.setAllowedMethods(Collections.singletonList("*"));
                cfg.setAllowedHeaders(Collections.singletonList("*"));
                cfg.setExposedHeaders(Collections.singletonList("Authorization"));
                cfg.setMaxAge(360L);
                return cfg;
            }
        };
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return  new BCryptPasswordEncoder();
    }


}
