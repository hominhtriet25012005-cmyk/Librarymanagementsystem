package com.zosh.librarymanagementsystem.service.impl;

import com.zosh.librarymanagementsystem.mapper.UserMapper;
import com.zosh.librarymanagementsystem.modal.User;
import com.zosh.librarymanagementsystem.payload.dto.UserDTO;
import com.zosh.librarymanagementsystem.repository.UserRepository;
import com.zosh.librarymanagementsystem.service.UserService;
import com.zosh.librarymanagementsystem.exception.UserException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl  implements UserService {

    private final UserRepository userRepository;

    @Override
    public User getCurrentUser() {
        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            throw new UserException("Authentication is required");
        }
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email);
        if (user==null) {
            throw new UserException("User not found with email: " + email);
        }
        return user;
    }

    @Override
    public List<UserDTO> getAllUsers() {
        List<User> users = userRepository.findAll();

        return users.stream().map(
                UserMapper::toDTO
        ).collect(Collectors.toList());
    }
}
