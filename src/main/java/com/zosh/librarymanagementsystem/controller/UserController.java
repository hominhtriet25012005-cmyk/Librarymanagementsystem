package com.zosh.librarymanagementsystem.controller;

import com.zosh.librarymanagementsystem.domain.UserRole;
import com.zosh.librarymanagementsystem.payload.dto.UserDTO;
import com.zosh.librarymanagementsystem.payload.request.UserAdminUpdateRequest;
import com.zosh.librarymanagementsystem.payload.request.UserSearchRequest;
import com.zosh.librarymanagementsystem.payload.response.PageResponse;
import com.zosh.librarymanagementsystem.payload.response.UserStatsResponse;
import com.zosh.librarymanagementsystem.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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
    public ResponseEntity<UserDTO> getUserProfile() {
        return ResponseEntity.ok(
                com.zosh.librarymanagementsystem.mapper.UserMapper.toDTO(
                        userService.getCurrentUser()
                )
        );
    }

    @GetMapping("/admin")
    public ResponseEntity<PageResponse<UserDTO>> searchUsers(
            @RequestParam(required = false) String searchTerm,
            @RequestParam(required = false) UserRole role,
            @RequestParam(required = false) Boolean verified,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection) {
        UserSearchRequest request = new UserSearchRequest();
        request.setSearchTerm(searchTerm);
        request.setRole(role);
        request.setVerified(verified);
        request.setPage(page);
        request.setSize(size);
        request.setSortBy(sortBy);
        request.setSortDirection(sortDirection);
        return ResponseEntity.ok(userService.searchUsers(request));
    }

    @GetMapping("/admin/stats")
    public ResponseEntity<UserStatsResponse> getUserStats() {
        return ResponseEntity.ok(userService.getUserStats());
    }

    @PutMapping("/admin/{userId}")
    public ResponseEntity<UserDTO> updateUserAccess(
            @PathVariable Long userId,
            @Valid @RequestBody UserAdminUpdateRequest request) {
        return ResponseEntity.ok(userService.updateUserAccess(userId, request));
    }
}
