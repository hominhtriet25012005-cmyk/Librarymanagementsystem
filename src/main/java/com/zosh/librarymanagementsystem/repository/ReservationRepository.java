package com.zosh.librarymanagementsystem.repository;

import com.zosh.librarymanagementsystem.domain.ReservationStatus;
import com.zosh.librarymanagementsystem.modal.Reservation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    /** Lấy hàng chờ của một cuốn sách theo thứ tự đặt trước. */
    @Query("SELECT r FROM Reservation r WHERE r.book.id = :bookId " +
            "AND r.status = 'PENDING' ORDER BY r.reservedAt ASC")
    List<Reservation> findPendingReservationsByBook(@Param("bookId") Long bookId);

    /** Lấy người đầu tiên đang chờ một cuốn sách. */
    Optional<Reservation> findFirstByBookIdAndStatusOrderByReservedAtAsc(
            Long bookId,
            ReservationStatus status
    );

    /** Kiểm tra người dùng đã có đặt chỗ đang hoạt động cho sách hay chưa. */
    @Query("SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END FROM Reservation r " +
            "WHERE r.user.id = :userId AND r.book.id = :bookId " +
            "AND (r.status = 'PENDING' OR r.status = 'AVAILABLE')")
    boolean hasActiveReservation(@Param("userId") Long userId, @Param("bookId") Long bookId);

    /** Đếm số đặt chỗ đang hoạt động của người dùng. */
    @Query("SELECT COUNT(r) FROM Reservation r WHERE r.user.id = :userId " +
            "AND (r.status = 'PENDING' OR r.status = 'AVAILABLE')")
    long countActiveReservationsByUser(@Param("userId") Long userId);

    /** Đếm số người đang chờ một cuốn sách. */
    @Query("SELECT COUNT(r) FROM Reservation r WHERE r.book.id = :bookId " +
            "AND r.status = 'PENDING'")
    long countPendingReservationsByBook(@Param("bookId") Long bookId);

    /** Đếm số bản sách đang được giữ cho người đã đến lượt. */
    long countByBookIdAndStatus(Long bookId, ReservationStatus status);

    /** Tìm đặt chỗ đã quá thời hạn nhận sách. */
    @Query("SELECT r FROM Reservation r WHERE r.status = 'AVAILABLE' " +
            "AND r.availableUntil < :currentDateTime")
    List<Reservation> findExpiredReservations(@Param("currentDateTime") LocalDateTime currentDateTime);

    /** Tìm đặt chỗ đang hoạt động theo người dùng và sách. */
    @Query("SELECT r FROM Reservation r WHERE r.user.id = :userId AND r.book.id = :bookId " +
            "AND (r.status = 'PENDING' OR r.status = 'AVAILABLE')")
    Optional<Reservation> findActiveReservationByUserAndBook(
            @Param("userId") Long userId,
            @Param("bookId") Long bookId
    );

    /** Tìm đặt chỗ bằng các bộ lọc tùy chọn. */
    @Query("SELECT r FROM Reservation r WHERE " +
            "(:userId IS NULL OR r.user.id = :userId) AND " +
            "(:bookId IS NULL OR r.book.id = :bookId) AND " +
            "(:status IS NULL OR r.status = :status) AND " +
            "(:activeOnly = false OR (r.status = 'PENDING' OR r.status = 'AVAILABLE'))")
    Page<Reservation> searchReservationsWithFilters(
            @Param("userId") Long userId,
            @Param("bookId") Long bookId,
            @Param("status") ReservationStatus status,
            @Param("activeOnly") boolean activeOnly,
            Pageable pageable
    );
}
