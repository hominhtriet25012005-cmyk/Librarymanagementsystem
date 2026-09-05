package com.zosh.librarymanagementsystem.service.impl;

import com.zosh.librarymanagementsystem.domain.UserRole;
import com.zosh.librarymanagementsystem.modal.User;
import com.zosh.librarymanagementsystem.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializationComponent implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        initializeAdminUser();
    }

    private void  initializeAdminUser() {
         String adminEmail = "admin@gmail.com";
         String adminPassword = "admin123";

         if (userRepository.findByEmail(adminEmail)==null) {
             User user = User.builder()
                     .password(passwordEncoder.encode(adminPassword))
                     .email(adminEmail)
                     .fullName("Code With Zosh")
                     .role(UserRole.ROLE_ADMIN)
                     .build();

             User admin = userRepository.save(user);
         }
    }

}
