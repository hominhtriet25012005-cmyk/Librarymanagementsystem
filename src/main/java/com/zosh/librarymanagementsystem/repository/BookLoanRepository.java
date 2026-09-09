package com.zosh.librarymanagementsystem.repository;

import com.zosh.librarymanagementsystem.domain.BookLoanStatus;
import com.zosh.librarymanagementsystem.modal.BookLoan;
import com.zosh.librarymanagementsystem.modal.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface BookLoanRepository extends JpaRepository<BookLoan, Long> {

    Page<BookLoan> findByUserId(Long userId, Pageable pageable);
    Page<BookLoan> findByStatusAndUser(BookLoanStatus status, User user, Pageable pageable);
    Page<BookLoan> findByStatus(BookLoanStatus status, Pageable pageable);
    Page<BookLoan> findByBookId(Long bookId, Pageable pageable);

    List<BookLoan> findByBookId(Long bookId);


    @Query(" select case when count(bl) > 0 then true else false end from BookLoan bl " +
            " where bl.user.id =:userId and bl.book.id=:bookId "+
            " and (bl.status = 'CHECKED_OUT' OR bl.status= 'OVERDUE')"
    )
    boolean hasActiveCheckout(
            @Param("userId") Long userId,
            @Param("bookId") Long bookId
    );

    @Query("SELECT COUNT(bl) FROM BookLoan bl WHERE bl.user.id = :userId " +
            "AND (bl.status = 'CHECKED_OUT' OR bl.status = 'OVERDUE')")
    long countActiveBookLoansByUser(@Param("userId") Long userId);

    @Query("SELECT COUNT(bl) FROM BookLoan bl WHERE bl.user.id = :userId " +
            "AND bl.status = 'OVERDUE' ")
    long countOverdueBookLoansByUser(@Param("userId") Long userId);

    @Query("SELECT bl FROM BookLoan bl WHERE bl.dueDate < :currentDate " +
            "AND (bl.status = 'CHECKED_OUT' OR bl.status = 'OVERDUE')")
    Page<BookLoan> findOverdueBookLoans(@Param("currentDate")
                                        LocalDate currentDate,
                                        Pageable pageable);

    @Query("SELECT bl FROM BookLoan bl WHERE bl.checkoutDate BETWEEN :startDate AND :endDate")
    Page<BookLoan> findBookLoansByDateRange(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            Pageable pageable
    );

    @Query("SELECT DISTINCT bl FROM BookLoan bl JOIN Fine f ON f.bookLoan = bl " +
            "WHERE f.status = 'PENDING' OR f.status = 'PARTIALLY_PAID'")
    Page<BookLoan> findBookLoansWithUnpaidFines(Pageable pageable);

    /**
     * Tìm phiếu mượn bằng nhiều điều kiện cùng lúc cho màn hình quản trị.
     * Tham số rỗng được bỏ qua, nhờ vậy frontend không phải chọn một bộ lọc ưu tiên.
     */
    @Query("SELECT bl FROM BookLoan bl WHERE " +
            "(:userId IS NULL OR bl.user.id = :userId) AND " +
            "(:bookId IS NULL OR bl.book.id = :bookId) AND " +
            "(:status IS NULL OR bl.status = :status) AND " +
            "(:overdueOnly = false OR (bl.dueDate < :currentDate " +
            "AND (bl.status = 'CHECKED_OUT' OR bl.status = 'OVERDUE'))) AND " +
            "(:unpaidFinesOnly = false OR EXISTS (SELECT f.id FROM Fine f " +
            "WHERE f.bookLoan = bl AND (f.status = 'PENDING' OR f.status = 'PARTIALLY_PAID'))) AND " +
            "(:startDate IS NULL OR bl.checkoutDate >= :startDate) AND " +
            "(:endDate IS NULL OR bl.checkoutDate <= :endDate)")
    Page<BookLoan> searchBookLoans(
            @Param("userId") Long userId,
            @Param("bookId") Long bookId,
            @Param("status") BookLoanStatus status,
            @Param("overdueOnly") boolean overdueOnly,
            @Param("unpaidFinesOnly") boolean unpaidFinesOnly,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("currentDate") LocalDate currentDate,
            Pageable pageable
    );

    boolean existsByUserIdAndBookIdAndStatus(Long userId, Long bookId, BookLoanStatus status);
}
