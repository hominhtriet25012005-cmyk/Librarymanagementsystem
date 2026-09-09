package com.zosh.librarymanagementsystem.service;

import com.zosh.librarymanagementsystem.payload.dto.UserDTO;
import com.zosh.librarymanagementsystem.modal.User;
import com.zosh.librarymanagementsystem.payload.request.UserAdminUpdateRequest;
import com.zosh.librarymanagementsystem.payload.request.UserSearchRequest;
import com.zosh.librarymanagementsystem.payload.response.PageResponse;
import com.zosh.librarymanagementsystem.payload.response.UserStatsResponse;

import java.util.List;

public interface UserService {

   User getCurrentUser();
   List<UserDTO> getAllUsers();

   User findById(Long id);

   PageResponse<UserDTO> searchUsers(UserSearchRequest request);

   UserStatsResponse getUserStats();

   UserDTO updateUserAccess(Long userId, UserAdminUpdateRequest request);
}
