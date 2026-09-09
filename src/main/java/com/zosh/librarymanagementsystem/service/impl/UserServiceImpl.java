package com.zosh.librarymanagementsystem.service.impl;

import com.zosh.librarymanagementsystem.domain.UserRole;
import com.zosh.librarymanagementsystem.mapper.UserMapper;
import com.zosh.librarymanagementsystem.modal.User;
import com.zosh.librarymanagementsystem.payload.dto.UserDTO;
import com.zosh.librarymanagementsystem.payload.request.UserAdminUpdateRequest;
import com.zosh.librarymanagementsystem.payload.request.UserSearchRequest;
import com.zosh.librarymanagementsystem.payload.response.PageResponse;
import com.zosh.librarymanagementsystem.payload.response.UserStatsResponse;
import com.zosh.librarymanagementsystem.repository.UserRepository;
import com.zosh.librarymanagementsystem.service.UserService;
import com.zosh.librarymanagementsystem.exception.UserException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl  implements UserService {

    private static final List<String> ALLOWED_SORT_FIELDS = List.of(
            "id", "fullName", "email", "role", "verified", "lastLogin", "createdAt"
    );

    private final UserRepository userRepository;

    @Override
    public User getCurrentUser() {
        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            throw new UserException("Bạn cần đăng nhập để thực hiện thao tác này");
        }
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email);
        if (user==null) {
            throw new UserException("Không tìm thấy người dùng có email: " + email);
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

    @Override
    public User findById(Long id) {
        return userRepository.findById(id).orElseThrow(
                () -> new UserException("Không tìm thấy người dùng có ID " + id)
        );
    }

    @Override
    public PageResponse<UserDTO> searchUsers(UserSearchRequest request) {
        String sortBy = ALLOWED_SORT_FIELDS.contains(request.getSortBy())
                ? request.getSortBy()
                : "createdAt";
        Sort.Direction direction = "ASC".equalsIgnoreCase(request.getSortDirection())
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(
                Math.max(request.getPage(), 0),
                Math.min(Math.max(request.getSize(), 1), 100),
                Sort.by(direction, sortBy)
        );
        String searchTerm = request.getSearchTerm() == null || request.getSearchTerm().isBlank()
                ? null
                : request.getSearchTerm().trim();
        Page<User> users = userRepository.searchUsers(
                searchTerm, request.getRole(), request.getVerified(), pageable
        );

        return new PageResponse<>(
                users.getContent().stream().map(UserMapper::toDTO).toList(),
                users.getNumber(),
                users.getSize(),
                users.getTotalElements(),
                users.getTotalPages(),
                users.isLast(),
                users.isFirst(),
                users.isEmpty()
        );
    }

    @Override
    public UserStatsResponse getUserStats() {
        long totalUsers = userRepository.count();
        long totalReaders = userRepository.countByRole(UserRole.ROLE_USER);
        long totalAdmins = userRepository.countByRole(UserRole.ROLE_ADMIN);
        long totalVerified = userRepository.countByVerifiedTrue();
        return new UserStatsResponse(
                totalUsers,
                totalReaders,
                totalAdmins,
                totalVerified,
                totalUsers - totalVerified
        );
    }

    @Override
    @Transactional
    public UserDTO updateUserAccess(Long userId, UserAdminUpdateRequest request) {
        User currentAdmin = getCurrentUser();
        User targetUser = findById(userId);

        // Không cho quản trị viên tự hạ quyền vì thao tác này có thể làm mất quyền quản trị.
        if (currentAdmin.getId().equals(targetUser.getId())
                && targetUser.getRole() == UserRole.ROLE_ADMIN
                && request.getRole() != UserRole.ROLE_ADMIN) {
            throw new UserException("Bạn không thể tự hạ quyền quản trị của chính mình");
        }

        targetUser.setRole(request.getRole());
        targetUser.setVerified(request.getVerified());
        return UserMapper.toDTO(userRepository.save(targetUser));
    }
}
