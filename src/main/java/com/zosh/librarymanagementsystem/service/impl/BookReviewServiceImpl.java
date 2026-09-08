package com.zosh.librarymanagementsystem.service.impl;

import com.zosh.librarymanagementsystem.domain.BookLoanStatus;
import com.zosh.librarymanagementsystem.exception.LibraryOperationException;
import com.zosh.librarymanagementsystem.mapper.BookReviewMapper;
import com.zosh.librarymanagementsystem.modal.Book;
import com.zosh.librarymanagementsystem.modal.BookReview;
import com.zosh.librarymanagementsystem.modal.User;
import com.zosh.librarymanagementsystem.payload.dto.BookReviewDTO;
import com.zosh.librarymanagementsystem.payload.request.CreateReviewRequest;
import com.zosh.librarymanagementsystem.payload.request.UpdateReviewRequest;
import com.zosh.librarymanagementsystem.payload.response.PageResponse;
import com.zosh.librarymanagementsystem.repository.BookLoanRepository;
import com.zosh.librarymanagementsystem.repository.BookRepository;
import com.zosh.librarymanagementsystem.repository.BookReviewRepository;
import com.zosh.librarymanagementsystem.service.BookReviewService;
import com.zosh.librarymanagementsystem.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookReviewServiceImpl implements BookReviewService {

    private final BookReviewRepository bookReviewRepository;
    private final UserService userService;
    private final BookRepository bookRepository;
    private final BookReviewMapper bookReviewMapper;
    private final BookLoanRepository bookLoanRepository;

    @Override
    @Transactional
    public BookReviewDTO createReview(CreateReviewRequest request) {
        // 1. Lấy người dùng đang đăng nhập.
        User user = userService.getCurrentUser();

        // 2. Kiểm tra sách tồn tại.
        Book book = bookRepository.findById(request.getBookId())
                .orElseThrow(() -> new LibraryOperationException("Không tìm thấy sách"));

        // 3. Mỗi người dùng chỉ được đánh giá một lần cho mỗi sách.
        if (bookReviewRepository.existsByUserIdAndBookId(user.getId(), book.getId())) {
            throw new LibraryOperationException("Bạn đã đánh giá cuốn sách này");
        }

        // 4. Chỉ người đã mượn và trả sách mới được đánh giá.
        boolean hasReadBook = hasUserReadBook(user.getId(), book.getId());
        if (!hasReadBook) {
            throw new LibraryOperationException("Bạn cần đọc và trả sách trước khi đánh giá");
        }

        // 5. Tạo đánh giá.
        BookReview bookReview = new BookReview();
        bookReview.setUser(user);
        bookReview.setBook(book);
        bookReview.setRating(request.getRating());
        bookReview.setReviewText(request.getReviewText());
        bookReview.setTitle(request.getTitle());
        BookReview savedBookReview = bookReviewRepository.save(bookReview);

        return bookReviewMapper.toDTO(savedBookReview);
    }


    @Override
    @Transactional
    public BookReviewDTO updateReview(Long reviewId, UpdateReviewRequest request) {
        // 1. Lấy người dùng đang đăng nhập.
        User user = userService.getCurrentUser();

        // 2. Tìm đánh giá cần sửa.
        BookReview bookReview = bookReviewRepository.findById(reviewId)
                .orElseThrow(() -> new LibraryOperationException("Không tìm thấy đánh giá"));

        // 3. Chỉ chủ đánh giá mới được chỉnh sửa.
        if (!bookReview.getUser().getId().equals(user.getId())) {
            throw new LibraryOperationException("Bạn chỉ có thể sửa đánh giá của chính mình");
        }

        // 4. Cập nhật nội dung đánh giá.
        bookReview.setReviewText(request.getReviewText());
        bookReview.setTitle(request.getTitle());
        bookReview.setRating(request.getRating());

        BookReview savedBookReview = bookReviewRepository.save(bookReview);

        return bookReviewMapper.toDTO(savedBookReview);
    }

    @Override
    @Transactional
    public void deleteReview(Long reviewId) {
        User currentUser = userService.getCurrentUser();

        // 1. Tìm đánh giá cần xóa.
        BookReview bookReview = bookReviewRepository.findById(reviewId)
                .orElseThrow(() -> new LibraryOperationException("Không tìm thấy đánh giá có ID " + reviewId));

        // 2. Chỉ chủ đánh giá mới được xóa.
        if (!bookReview.getUser().getId().equals(currentUser.getId())) {
            throw new LibraryOperationException("Bạn chỉ có thể xóa đánh giá của chính mình");
        }


        bookReviewRepository.delete(bookReview);
    }

    @Override
    public PageResponse<BookReviewDTO> getReviewsByBookId(
            Long id,
            int page,
            int size) {
        Book book = bookRepository.findById(id).orElseThrow(
                () -> new LibraryOperationException("Không tìm thấy sách có ID " + id)
        );

        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100),
                Sort.by("createdAt").descending());
        Page<BookReview> reviewPage = bookReviewRepository.findByBook(book, pageable);
        return convertToPageResponse(reviewPage);
    }

    private PageResponse<BookReviewDTO> convertToPageResponse(Page<BookReview> reviewPage) {
        List<BookReviewDTO> reviewDTOs = reviewPage.getContent()
                .stream()
                .map(bookReviewMapper::toDTO)
                .collect(Collectors.toList());

        return new PageResponse<>(
                reviewDTOs,
                reviewPage.getNumber(),
                reviewPage.getSize(),
                reviewPage.getTotalElements(),
                reviewPage.getTotalPages(),
                reviewPage.isLast(),
                reviewPage.isFirst(),
                reviewPage.isEmpty()
        );
    }


    private boolean hasUserReadBook(Long userId, Long bookId) {
        return bookLoanRepository.existsByUserIdAndBookIdAndStatus(
                userId, bookId, BookLoanStatus.RETURNED);
    }
}
