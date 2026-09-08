package com.zosh.librarymanagementsystem.controller;

import com.zosh.librarymanagementsystem.payload.dto.BookReviewDTO;
import com.zosh.librarymanagementsystem.payload.request.CreateReviewRequest;
import com.zosh.librarymanagementsystem.payload.request.UpdateReviewRequest;
import com.zosh.librarymanagementsystem.payload.response.ApiResponse;
import com.zosh.librarymanagementsystem.payload.response.PageResponse;
import com.zosh.librarymanagementsystem.service.BookReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/reviews")
public class BookReviewController {

    private final BookReviewService bookReviewService;

    @PostMapping
    public ResponseEntity<?> createReview(
            @Valid @RequestBody CreateReviewRequest request
            ) {
        BookReviewDTO reviewDTO = bookReviewService.createReview(request);
        return ResponseEntity.ok(reviewDTO);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateReview(
            @PathVariable Long id,
            @Valid @RequestBody UpdateReviewRequest request
    ) {
        BookReviewDTO reviewDTO = bookReviewService.updateReview(id, request);
        return ResponseEntity.ok(reviewDTO);
    }

    @DeleteMapping("/{reviewId}")
    public ResponseEntity<?> deleteReview(@PathVariable Long reviewId) {

        bookReviewService.deleteReview(reviewId);
        return ResponseEntity.ok(
                new ApiResponse("Đã xóa đánh giá thành công", true));

    }

    @GetMapping("/book/{bookId}")
    public ResponseEntity<PageResponse<BookReviewDTO>> getReviewsByBook(
            @PathVariable Long bookId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<BookReviewDTO> reviews = bookReviewService
                .getReviewsByBookId(
                        bookId, page, size);
        return ResponseEntity.ok(reviews);
    }

}
