package com.zosh.librarymanagementsystem.payload.request;

import com.zosh.librarymanagementsystem.domain.UserRole;
import lombok.Data;

@Data
public class UserSearchRequest {

    private String searchTerm;
    private UserRole role;
    private Boolean verified;
    private int page = 0;
    private int size = 10;
    private String sortBy = "createdAt";
    private String sortDirection = "DESC";
}
