package com.zosh.librarymanagementsystem.service;

import com.zosh.librarymanagementsystem.payload.dto.WishlistDTO;
import com.zosh.librarymanagementsystem.payload.response.PageResponse;

public interface WishlistService {

    WishlistDTO addToWishlist(Long bookId, String notes);
    void removeFromWishlist(Long bookId);
    PageResponse<WishlistDTO> getMyWishlist(int page, int size);
}
