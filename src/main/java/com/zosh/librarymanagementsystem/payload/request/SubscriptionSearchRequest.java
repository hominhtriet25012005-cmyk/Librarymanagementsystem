package com.zosh.librarymanagementsystem.payload.request;

import lombok.Data;

@Data
public class SubscriptionSearchRequest {

    private String searchTerm;
    private Long planId;
    private String status;
    private int page = 0;
    private int size = 10;
    private String sortBy = "createdAt";
    private String sortDirection = "DESC";
}
