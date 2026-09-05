package com.zosh.librarymanagementsystem.service;

import com.zosh.librarymanagementsystem.payload.dto.UserDTO;
import com.zosh.librarymanagementsystem.modal.User;

import java.util.List;

public interface UserService {

   User getCurrentUser();
   public List<UserDTO> getAllUsers();
}
