package com.zosh.librarymanagementsystem.configration;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;

import javax.crypto.SecretKey;
import java.util.Collection;
import java.util.Date;
import java.util.HashSet;
import java.util.Set;
import java.nio.charset.StandardCharsets;

@Service
public class JwtProvider {
    private final SecretKey key;

    public JwtProvider(@Value("${jwt.secret:library-management-dev-secret-key-change-before-production-2026}")
                       String secret) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(Authentication authentication) {
        Collection <? extends GrantedAuthority> authorities = authentication
                .getAuthorities();

        String roles = populateAuthorities(authorities);
        return Jwts.builder().issuedAt(new Date())
                .expiration(new Date(new Date().getTime() + 86400000L))
                .claim("email", authentication.getName())
                .claim("authorities", roles)
                .signWith(key)
                .compact();

    }

    public String getEmailFromJwtToken(String jwt) {
        return String.valueOf(parseClaims(jwt).get("email"));
    }

    public Claims parseClaims(String jwt) {
        if (jwt != null && jwt.startsWith("Bearer ")) {
            jwt = jwt.substring(7);
        }
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(jwt)
                .getPayload();
    }

    private String populateAuthorities(Collection<? extends GrantedAuthority> authorities) {
        Set<String> auths= new HashSet<>();

        for (GrantedAuthority authority: authorities) {
            auths.add(authority.getAuthority());
        }
        return String.join(",", auths);
    }


}
