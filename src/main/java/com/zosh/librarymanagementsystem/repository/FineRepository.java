package com.zosh.librarymanagementsystem.repository;


import com.zosh.librarymanagementsystem.domain.FineStatus;
import com.zosh.librarymanagementsystem.domain.FineType;
import com.zosh.librarymanagementsystem.modal.Fine;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FineRepository extends JpaRepository<Fine, Long> {

    @Query("""
        SELECT f FROM Fine f
        WHERE (:userId IS NULL OR f.user.id = :userId)
        AND (:status IS NULL OR f.status = :status)
        AND (:type IS NULL OR f.type = :type)
        ORDER BY f.createdAt DESC
        """)
    Page<Fine> findAllWithFilters(
            @Param("userId") Long userId,
            @Param("status") FineStatus status,
            @Param("type") FineType type,
            Pageable pageable
    );

    List<Fine> findByUserId(Long userId);

    List<Fine> findByUserIdAndType(Long userId, FineType type);

    List<Fine> findByBookLoanId(Long bookLoanId);

    Optional<Fine> findByBookLoanIdAndType(Long bookLoanId, FineType type);


}
