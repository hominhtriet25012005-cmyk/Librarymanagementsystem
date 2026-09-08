package com.zosh.librarymanagementsystem.service.impl;

import com.zosh.librarymanagementsystem.mapper.WishlistMapper;
import com.zosh.librarymanagementsystem.exception.LibraryOperationException;
import com.zosh.librarymanagementsystem.modal.Book;
import com.zosh.librarymanagementsystem.modal.User;
import com.zosh.librarymanagementsystem.modal.Wishlist;
import com.zosh.librarymanagementsystem.payload.dto.WishlistDTO;
import com.zosh.librarymanagementsystem.payload.response.PageResponse;
import com.zosh.librarymanagementsystem.repository.BookRepository;
import com.zosh.librarymanagementsystem.repository.WishlistRepository;
import com.zosh.librarymanagementsystem.service.UserService;
import com.zosh.librarymanagementsystem.service.WishlistService;
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
public class WishlistServiceImpl implements WishlistService {

    private final WishlistRepository wishlistRepository;
    private final UserService userService;
    private final BookRepository bookRepository;
    private final WishlistMapper wishlistMapper;

    @Override
    @Transactional
    public WishlistDTO addToWishlist(Long bookId, String notes) {
        User user = userService.getCurrentUser();

        // 1. Kiểm tra sách tồn tại.
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new LibraryOperationException("Không tìm thấy sách"));

        // 2. Không thêm trùng một cuốn sách vào danh sách yêu thích.
        if (wishlistRepository.existsByUserIdAndBookId(user.getId(), bookId)) {
            throw new LibraryOperationException("Sách đã có trong danh sách yêu thích của bạn");
        }

        // 3. Tạo mục yêu thích.
        Wishlist wishlist = new Wishlist();
        wishlist.setUser(user);
        wishlist.setBook(book);
        wishlist.setNotes(notes);
        Wishlist saved = wishlistRepository.save(wishlist);
        return wishlistMapper.toDTO(saved);
    }

    @Override
    @Transactional
    public void removeFromWishlist(Long bookId) {
        User user = userService.getCurrentUser();

        Wishlist wishlist = wishlistRepository.findByUserIdAndBookId(
                user.getId(),
                bookId
        );

        if (wishlist == null) {
            throw new LibraryOperationException("Sách không có trong danh sách yêu thích của bạn");
        }

        wishlistRepository.delete(wishlist);
    }

    @Override
    public PageResponse<WishlistDTO> getMyWishlist(int page, int size) {
        Long userId = userService.getCurrentUser().getId();
        Pageable pageable = PageRequest.of(Math.max(page, 0),
                Math.min(Math.max(size, 1), 100), Sort.by("addedAt").descending());

        Page<Wishlist> wishlistPage = wishlistRepository.findByUserId(userId, pageable);
        return convertToPageResponse(wishlistPage);
    }

    private PageResponse<WishlistDTO> convertToPageResponse(Page<Wishlist> wishlistPage) {
        List<WishlistDTO> wishlistDTOs = wishlistPage.getContent()
                .stream()
                .map(wishlistMapper::toDTO)
                .collect(Collectors.toList());

        return new PageResponse<>(
                wishlistDTOs,
                wishlistPage.getNumber(),
                wishlistPage.getSize(),
                wishlistPage.getTotalElements(),
                wishlistPage.getTotalPages(),
                wishlistPage.isLast(),
                wishlistPage.isFirst(),
                wishlistPage.isEmpty()
        );
    }
}
