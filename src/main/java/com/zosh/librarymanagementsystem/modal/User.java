package com.zosh.librarymanagementsystem.modal;

import com.zosh.librarymanagementsystem.domain.Authprovider;
import com.zosh.librarymanagementsystem.domain.UserRole;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String fullName;

    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Authprovider authProvider = Authprovider.LOCAL;

    @Builder.Default
    private Boolean verified = false;

    private String googleId;

    private String profileImage;

    private String password;

    private LocalDateTime lastLogin;

    @CreationTimestamp
    private LocalDateTime createdAt;
    @UpdateTimestamp
    private LocalDateTime updatedAt;

}
