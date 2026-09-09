package com.zosh.librarymanagementsystem.service.impl;

import com.zosh.librarymanagementsystem.domain.UserRole;
import com.zosh.librarymanagementsystem.modal.User;
import com.zosh.librarymanagementsystem.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializationComponent implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${library.admin.initialize:true}")
    private boolean initializeAdmin;

    @Value("${library.admin.email:admin@gmail.com}")
    private String adminEmail;

    @Value("${library.admin.password:admin123}")
    private String adminPassword;

    @Value("${library.admin.full-name:Library Admin}")
    private String adminFullName;

    @Override
    public void run(String... args) {
        if (initializeAdmin) {
            initializeAdminUser();
        }
    }

    private void  initializeAdminUser() {
         if (userRepository.findByEmail(adminEmail)==null) {
             User user = User.builder()
                     .password(passwordEncoder.encode(adminPassword))
                     .email(adminEmail)
                     .fullName(adminFullName)
                     .role(UserRole.ROLE_ADMIN)
                     .verified(true)
                     .build();

             userRepository.save(user);
         }
    }

}
