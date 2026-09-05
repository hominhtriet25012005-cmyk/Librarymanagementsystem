package com.zosh.librarymanagementsystem.controller;

import com.zosh.librarymanagementsystem.payload.dto.UserDTO;
import com.zosh.librarymanagementsystem.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;

    @GetMapping("/list")
    public ResponseEntity<List<UserDTO>> getALLUsers() {
            return ResponseEntity.ok(
                    userService.getAllUsers()
            );
    }

    @GetMapping("/profile")
    public ResponseEntity<UserDTO> getUserProfile() throws Exception {
        return ResponseEntity.ok(
                com.zosh.librarymanagementsystem.mapper.UserMapper.toDTO(
                        userService.getCurrentUser()
                )
        );
    }
}
