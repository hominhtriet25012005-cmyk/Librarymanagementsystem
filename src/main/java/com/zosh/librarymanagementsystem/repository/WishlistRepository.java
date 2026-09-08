package com.zosh.librarymanagementsystem.repository;

import com.zosh.librarymanagementsystem.modal.Wishlist;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WishlistRepository extends JpaRepository<Wishlist, Long> {

    Page<Wishlist> findByUserId(Long userId, Pageable pageable);
    Wishlist findByUserIdAndBookId(Long userId, Long BookId);
    boolean existsByUserIdAndBookId(Long userId, Long BookId);
}
