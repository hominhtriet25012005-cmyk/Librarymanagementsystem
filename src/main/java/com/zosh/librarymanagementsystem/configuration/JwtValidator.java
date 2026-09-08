package com.zosh.librarymanagementsystem.configuration;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;

import java.io.IOException;
import java.util.List;
import org.springframework.http.HttpStatus;

@Component
@RequiredArgsConstructor
public class JwtValidator extends OncePerRequestFilter {

    private final JwtProvider jwtProvider;
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String jwt = request.getHeader(JwtConstant.JWT_HEADER);

        // Chỉ xử lý header đúng dạng: Authorization: Bearer <token>.
        if (jwt != null && jwt.startsWith("Bearer ")) {
            jwt=jwt.substring(7);

            try {
                Claims claims = jwtProvider.parseClaims(jwt);

                String email = String.valueOf(claims.get("email"));
                String authorities = String.valueOf(claims.get("authorities"));

                List<GrantedAuthority> authorityList= AuthorityUtils
                        .commaSeparatedStringToAuthorityList(authorities);
                Authentication auth = new UsernamePasswordAuthenticationToken(
                        email, null, authorityList);
                SecurityContextHolder.getContext().setAuthentication(auth);


            } catch (Exception e) {
                SecurityContextHolder.clearContext();
                response.sendError(HttpStatus.UNAUTHORIZED.value(), "JWT không hợp lệ hoặc đã hết hạn");
                return;
            }
        }
        filterChain.doFilter(request, response);
    }
}
