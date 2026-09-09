package com.zosh.librarymanagementsystem.service.impl;

import com.zosh.librarymanagementsystem.domain.BookLoanStatus;
import com.zosh.librarymanagementsystem.domain.ReservationStatus;
import com.zosh.librarymanagementsystem.domain.UserRole;
import com.zosh.librarymanagementsystem.exception.LibraryOperationException;
import com.zosh.librarymanagementsystem.mapper.ReservationMapper;
import com.zosh.librarymanagementsystem.modal.Book;
import com.zosh.librarymanagementsystem.modal.Reservation;
import com.zosh.librarymanagementsystem.modal.User;
import com.zosh.librarymanagementsystem.payload.dto.ReservationDTO;
import com.zosh.librarymanagementsystem.payload.request.CheckoutRequest;
import com.zosh.librarymanagementsystem.payload.request.ReservationRequest;
import com.zosh.librarymanagementsystem.payload.request.ReservationSearchRequest;
import com.zosh.librarymanagementsystem.payload.response.PageResponse;
import com.zosh.librarymanagementsystem.repository.BookLoanRepository;
import com.zosh.librarymanagementsystem.repository.BookRepository;
import com.zosh.librarymanagementsystem.repository.ReservationRepository;
import com.zosh.librarymanagementsystem.service.BookLoanService;
import com.zosh.librarymanagementsystem.service.ReservationService;
import com.zosh.librarymanagementsystem.service.UserService;
import com.zosh.librarymanagementsystem.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReservationServiceImpl implements ReservationService {

    private final BookLoanRepository bookLoanRepository;
    private final UserService userService;
    private final BookRepository bookRepository;
    private final ReservationRepository reservationRepository;
    private final ReservationMapper reservationMapper;
    private final BookLoanService bookLoanService;
    private final EmailService emailService;

    private static final int MAX_RESERVATIONS = 5;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ReservationDTO createReservation(ReservationRequest reservationRequest) {
        User user = userService.getCurrentUser();
        return createReservationForUser(reservationRequest, user.getId());
    }

    @Override
    @Transactional
    public ReservationDTO createReservationForUser(
            ReservationRequest reservationRequest,
            Long userId) {
        boolean alreadyHasLoan = bookLoanRepository.hasActiveCheckout(
                userId, reservationRequest.getBookId());
        if (alreadyHasLoan) {
            throw new LibraryOperationException("Người dùng đang mượn cuốn sách này");
        }

        // 1. Kiểm tra đúng người dùng được truyền vào.
        User user = userService.findById(userId);

        // 2. Kiểm tra sách tồn tại.
        Book book = bookRepository.findByIdForUpdate(reservationRequest.getBookId())
                .orElseThrow(() -> new LibraryOperationException("Không tìm thấy sách"));
        if (!Boolean.TRUE.equals(book.getActive())) {
            throw new LibraryOperationException("Sách đang ngừng hoạt động nên không thể đặt trước");
        }

        // 3. Không tạo hai đặt chỗ đang hoạt động cho cùng một sách.
        if (reservationRepository.hasActiveReservation(userId, book.getId())) {
            throw new LibraryOperationException("Người dùng đã đặt chỗ cuốn sách này");
        }

        // 4. Sách còn sẵn thì người dùng có thể mượn trực tiếp.
        long heldCopies = reservationRepository.countByBookIdAndStatus(
                book.getId(), ReservationStatus.AVAILABLE);
        if (book.getAvailableCopies() > heldCopies) {
            throw new LibraryOperationException("Sách đang có sẵn, không cần đặt chỗ");
        }

        // 5. Giới hạn số đặt chỗ đang hoạt động của một người dùng.

        long activeReservations = reservationRepository
                .countActiveReservationsByUser(userId);

        if (activeReservations >= MAX_RESERVATIONS) {
            throw new LibraryOperationException("Bạn chỉ được có tối đa " + MAX_RESERVATIONS + " đặt chỗ đang hoạt động");
        }

        // 6. Tạo đặt chỗ và xếp cuối hàng chờ.
        Reservation reservation = new Reservation();
        reservation.setUser(user);
        reservation.setBook(book);
        reservation.setStatus(ReservationStatus.PENDING);
        reservation.setReservedAt(LocalDateTime.now());
        reservation.setNotificationSent(false);
        reservation.setNotes(reservationRequest.getNotes());

        long pendingCount = reservationRepository.countPendingReservationsByBook(
                book.getId()
        );
        reservation.setQueuePosition((int) pendingCount + 1);

        Reservation savedReservation = reservationRepository.save(reservation);

        return reservationMapper.toDTO(savedReservation);
    }

    @Override
    @Transactional
    public ReservationDTO cancelReservation(Long reservationId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new LibraryOperationException("Không tìm thấy đặt chỗ có ID " + reservationId));

        // Người dùng chỉ được hủy đặt chỗ của mình; quản trị viên có thể hủy mọi đặt chỗ.
        User currentUser = userService.getCurrentUser();
        if (
                !reservation.getUser().getId().equals(currentUser.getId())
                        && currentUser.getRole() != UserRole.ROLE_ADMIN
        ) {
            throw new LibraryOperationException("Bạn chỉ có thể hủy đặt chỗ của chính mình");
        }

        if (!reservation.canBeCancelled()) {
            throw new LibraryOperationException("Không thể hủy đặt chỗ ở trạng thái " + reservation.getStatus());
        }

        boolean wasAvailable = reservation.getStatus() == ReservationStatus.AVAILABLE;
        reservation.setStatus(ReservationStatus.CANCELLED);
        reservation.setCancelledAt(LocalDateTime.now());

        Reservation savedReservation = reservationRepository.save(reservation);

        refreshQueue(reservation.getBook().getId());
        if (wasAvailable && reservation.getBook().getAvailableCopies() > 0) {
            promoteNextReservation(reservation.getBook().getId());
        }

        return reservationMapper.toDTO(savedReservation);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ReservationDTO fulfillReservation(Long reservationId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new LibraryOperationException("Không tìm thấy đặt chỗ có ID " + reservationId));

        if (reservation.hasExpired()) {
            throw new LibraryOperationException(
                    "Đặt chỗ đã quá hạn nhận sách; hãy cập nhật danh sách hết hạn trước khi giao sách");
        }
        if (reservation.getStatus() != ReservationStatus.AVAILABLE
                || reservation.getBook().getAvailableCopies() <= 0) {
            throw new LibraryOperationException("Đặt chỗ chưa sẵn sàng để nhận sách; trạng thái hiện tại: " + reservation.getStatus());
        }

        reservation.setStatus(ReservationStatus.FULFILLED);
        reservation.setFulfilledAt(LocalDateTime.now());

        Reservation savedReservation = reservationRepository.save(reservation);

        CheckoutRequest request = new CheckoutRequest();
        request.setBookId(reservation.getBook().getId());
        request.setNotes("Quản trị viên giao sách từ hàng chờ đặt chỗ");

        bookLoanService.checkoutBookForUser(reservation.getUser().getId(), request);

        refreshQueue(reservation.getBook().getId());
        if (reservation.getBook().getAvailableCopies() > 0) {
            promoteNextReservation(reservation.getBook().getId());
        }

        return reservationMapper.toDTO(savedReservation);
    }

    @Override
    @Transactional
    public int expireReservations() {
        List<Reservation> expiredReservations = reservationRepository
                .findExpiredReservations(LocalDateTime.now());

        for (Reservation reservation : expiredReservations) {
            reservation.setStatus(ReservationStatus.EXPIRED);
            reservation.setCancelledAt(LocalDateTime.now());
            reservationRepository.save(reservation);
            refreshQueue(reservation.getBook().getId());
            if (reservation.getBook().getAvailableCopies() > 0) {
                promoteNextReservation(reservation.getBook().getId());
            }
        }
        return expiredReservations.size();
    }

    @Override
    public PageResponse<ReservationDTO> getMyReservations(ReservationSearchRequest searchRequest) {
        User user = userService.getCurrentUser();
        if (searchRequest == null) {
            searchRequest = new ReservationSearchRequest();
        }
        searchRequest.setUserId(user.getId());
        return searchReservations(searchRequest);
    }

    @Override
    public PageResponse<ReservationDTO> searchReservations(ReservationSearchRequest searchRequest) {
        if (searchRequest == null) {
            searchRequest = new ReservationSearchRequest();
        }
        Pageable pageable = createPageable(searchRequest);

        Page<Reservation> reservationPage = reservationRepository
                .searchReservationsWithFilters(
                searchRequest.getUserId(),
                searchRequest.getBookId(),
                searchRequest.getStatus(),
                searchRequest.getActiveOnly() != null ? searchRequest.getActiveOnly() : false,
                pageable
        );

        return buildPageResponse(reservationPage);
    }

    private PageResponse<ReservationDTO> buildPageResponse(Page<Reservation> reservationPage) {
        List<ReservationDTO> dtos = reservationPage.getContent().stream()
                .map(reservationMapper::toDTO)
                .toList();

        PageResponse<ReservationDTO> response = new PageResponse<>();
        response.setContent(dtos);
        response.setPageNumber(reservationPage.getNumber());
        response.setPageSize(reservationPage.getSize());
        response.setTotalElements(reservationPage.getTotalElements());
        response.setTotalPages(reservationPage.getTotalPages());
        response.setLast(reservationPage.isLast());
        response.setFirst(reservationPage.isFirst());
        response.setEmpty(reservationPage.isEmpty());

        return response;
    }

    private Pageable createPageable(ReservationSearchRequest searchRequest) {
        List<String> allowedSortFields = List.of(
                "reservedAt", "availableAt", "availableUntil", "queuePosition", "status", "createdAt"
        );
        String sortBy = allowedSortFields.contains(searchRequest.getSortBy())
                ? searchRequest.getSortBy()
                : "reservedAt";
        Sort sort = "ASC".equalsIgnoreCase(searchRequest.getSortDirection())
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        int page = Math.max(searchRequest.getPage(), 0);
        int size = Math.min(Math.max(searchRequest.getSize(), 1), 100);
        return PageRequest.of(page, size, sort);
    }

    private void refreshQueue(Long bookId) {
        List<Reservation> pending = reservationRepository.findPendingReservationsByBook(bookId);
        for (int index = 0; index < pending.size(); index++) {
            pending.get(index).setQueuePosition(index + 1);
        }
        reservationRepository.saveAll(pending);
    }

    private void promoteNextReservation(Long bookId) {
        Book book = bookRepository.findByIdForUpdate(bookId)
                .orElseThrow(() -> new LibraryOperationException("Không tìm thấy sách"));
        long heldCopies = reservationRepository.countByBookIdAndStatus(
                bookId, ReservationStatus.AVAILABLE);
        if (book.getAvailableCopies() <= heldCopies) {
            return;
        }
        reservationRepository.findFirstByBookIdAndStatusOrderByReservedAtAsc(
                        bookId, ReservationStatus.PENDING)
                .ifPresent(next -> {
                    LocalDateTime now = LocalDateTime.now();
                    next.setStatus(ReservationStatus.AVAILABLE);
                    next.setAvailableAt(now);
                    next.setAvailableUntil(now.plusHours(48));
                    next.setQueuePosition(null);
                    notifyReservation(next);
                    reservationRepository.save(next);
                    refreshQueue(bookId);
                });
    }

    private void notifyReservation(Reservation reservation) {
        try {
            emailService.sendEmail(
                    reservation.getUser().getEmail(),
                    "Sách đặt chỗ đã sẵn sàng",
                    "Sách " + reservation.getBook().getTitle()
                            + " đã sẵn sàng. Vui lòng đến nhận trong vòng 48 giờ.");
            reservation.setNotificationSent(true);
        } catch (RuntimeException e) {
            reservation.setNotificationSent(false);
            log.warn("Không thể gửi email thông báo đặt chỗ {}: {}",
                    reservation.getId(), e.getMessage());
        }
    }

}
