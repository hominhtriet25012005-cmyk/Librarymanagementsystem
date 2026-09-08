package com.zosh.librarymanagementsystem.service;

import com.zosh.librarymanagementsystem.payload.dto.BookReviewDTO;
import com.zosh.librarymanagementsystem.payload.request.CreateReviewRequest;
import com.zosh.librarymanagementsystem.payload.request.UpdateReviewRequest;
import com.zosh.librarymanagementsystem.payload.response.PageResponse;

public interface BookReviewService {

    BookReviewDTO createReview(CreateReviewRequest request);

    BookReviewDTO updateReview(Long reviewId, UpdateReviewRequest request);

    void deleteReview(Long reviewId);

    PageResponse<BookReviewDTO> getReviewsByBookId(Long id, int page, int size);
}
