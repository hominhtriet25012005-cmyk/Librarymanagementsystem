package com.zosh.librarymanagementsystem.service.impl;

import com.zosh.librarymanagementsystem.domain.BookLoanStatus;
import com.zosh.librarymanagementsystem.domain.BookLoanType;
import com.zosh.librarymanagementsystem.domain.ReservationStatus;
import com.zosh.librarymanagementsystem.domain.UserRole;
import com.zosh.librarymanagementsystem.domain.FineStatus;
import com.zosh.librarymanagementsystem.domain.FineType;
import com.zosh.librarymanagementsystem.exception.BookException;
import com.zosh.librarymanagementsystem.exception.LibraryOperationException;
import com.zosh.librarymanagementsystem.mapper.BookLoanMapper;
import com.zosh.librarymanagementsystem.modal.Book;
import com.zosh.librarymanagementsystem.modal.BookLoan;
import com.zosh.librarymanagementsystem.modal.User;
import com.zosh.librarymanagementsystem.modal.Reservation;
import com.zosh.librarymanagementsystem.modal.Fine;
import com.zosh.librarymanagementsystem.payload.dto.BookLoanDTO;
import com.zosh.librarymanagementsystem.payload.dto.SubscriptionDTO;
import com.zosh.librarymanagementsystem.payload.request.BookLoanSearchRequest;
import com.zosh.librarymanagementsystem.payload.request.CheckinRequest;
import com.zosh.librarymanagementsystem.payload.request.CheckoutRequest;
import com.zosh.librarymanagementsystem.payload.request.RenewalRequest;
import com.zosh.librarymanagementsystem.payload.response.PageResponse;
import com.zosh.librarymanagementsystem.repository.BookLoanRepository;
import com.zosh.librarymanagementsystem.repository.BookRepository;
import com.zosh.librarymanagementsystem.repository.ReservationRepository;
import com.zosh.librarymanagementsystem.repository.FineRepository;
import com.zosh.librarymanagementsystem.service.BookLoanService;
import com.zosh.librarymanagementsystem.service.SubscriptionService;
import com.zosh.librarymanagementsystem.service.UserService;
import com.zosh.librarymanagementsystem.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookLoanServiceImpl implements BookLoanService {

    private final BookLoanRepository bookLoanRepository;
    private final UserService userService;
    private final SubscriptionService subscriptionService;
    private final BookRepository bookRepository;
    private final BookLoanMapper bookLoanMapper;
    private final ReservationRepository reservationRepository;
    private final FineRepository fineRepository;
    private final EmailService emailService;

    @Value("${library.fine.overdue-per-day:10}")
    private long overdueFinePerDay;

    @Override
    @Transactional
    public BookLoanDTO checkoutBook(CheckoutRequest checkoutRequest) {

        User user = userService.getCurrentUser();
       return checkoutBookForUser(user.getId(), checkoutRequest);
    }

    @Override
    @Transactional
    public BookLoanDTO checkoutBookForUser(Long userId, CheckoutRequest checkoutRequest) {
        // 1. Kiểm tra người dùng tồn tại.
        User user = userService.findById(userId);

        // 2. Kiểm tra người dùng có gói thành viên còn hiệu lực.
        SubscriptionDTO subscription = subscriptionService
                .getUsersActiveSubscription(user.getId());

        // 3. Kiểm tra sách tồn tại, đang hoạt động và còn bản để mượn.
        Book book = bookRepository.findByIdForUpdate(checkoutRequest.getBookId())
                .orElseThrow(() -> new BookException(
                        "Không tìm thấy sách có ID " + checkoutRequest.getBookId()));
        if (!Boolean.TRUE.equals(book.getActive())) {
            throw new BookException("Sách đang ngừng hoạt động");
        }
        if (book.getAvailableCopies() == null || book.getAvailableCopies() <= 0) {
            throw new BookException("Sách hiện không còn bản có sẵn");
        }
        long heldCopies = reservationRepository.countByBookIdAndStatus(
                book.getId(), ReservationStatus.AVAILABLE);
        if (book.getAvailableCopies() <= heldCopies) {
            throw new BookException("Các bản sách còn lại đang được giữ cho người đã đặt chỗ");
        }

        // 4. Không cho mượn trùng một đầu sách khi khoản mượn cũ còn hiệu lực.
        if (bookLoanRepository.hasActiveCheckout(userId, book.getId())) {
            throw new BookException("Bạn đang mượn cuốn sách này");
        }

        // 5. Áp dụng giới hạn số sách từ gói thành viên.
        long activeCheckouts = bookLoanRepository.countActiveBookLoansByUser(userId);
        int maxBookAllowed = subscription.getMaxBooksAllowed();

        if (activeCheckouts >= maxBookAllowed) {
            throw new BookException("Bạn đã mượn đủ số sách tối đa của gói thành viên");
        }

        // 6. Người dùng phải trả sách quá hạn trước khi mượn thêm.
        long overdueCount = bookLoanRepository.countOverdueBookLoansByUser(userId);
        if (overdueCount > 0) {
            throw new BookException("Vui lòng trả sách quá hạn trước khi mượn thêm");
        }

        // 7. Số ngày mượn không được vượt quá quyền lợi của gói thành viên.
        int requestedDays = checkoutRequest.getCheckoutDays() == null
                ? subscription.getMaxDaysPerBook()
                : checkoutRequest.getCheckoutDays();
        if (requestedDays <= 0) {
            throw new BookException("Số ngày mượn phải lớn hơn 0");
        }
        int checkoutDays = Math.min(requestedDays, subscription.getMaxDaysPerBook());

        // 8. Tạo phiếu mượn.
        BookLoan bookLoan = BookLoan
                .builder()
                .user(user)
                .book(book)
                .type(BookLoanType.CHECKOUT)
                .status(BookLoanStatus.CHECKED_OUT)
                .dueDate(LocalDate.now().plusDays(checkoutDays))
                .checkoutDate(LocalDate.now())
                .renewalCount(0)
                .maxRenewals(2)
                .notes(checkoutRequest.getNotes())
                .isOverdue(false)
                .overdueDays(0)
                .build();

        // 9. Trừ số bản sách có sẵn.
        book.setAvailableCopies(book.getAvailableCopies()-1);
        bookRepository.save(book);


        // 10. Lưu phiếu mượn và trả DTO cho API.
        BookLoan savedBookLoan = bookLoanRepository.save(bookLoan);

        return toDTOWithFine(savedBookLoan);
    }

    @Override
    @Transactional
    public BookLoanDTO checkinBook(CheckinRequest checkinRequest) {

        // 1. Kiểm tra phiếu mượn tồn tại.
        BookLoan bookLoan = bookLoanRepository.findById(checkinRequest.getBookLoanId())
                .orElseThrow(() -> new LibraryOperationException("Không tìm thấy phiếu mượn"));

        // 2. Không xử lý lại phiếu mượn đã đóng.
        if (!bookLoan.isActive()) {
            throw new BookException("Phiếu mượn không còn hoạt động");
        }

        // 3. Ghi nhận ngày trả thực tế.
        bookLoan.setReturnDate(LocalDate.now());

        // 4. Kiểm tra tình trạng sách khi trả.
        BookLoanStatus condition = checkinRequest.getCondition();
        if (condition == null) {
            condition = BookLoanStatus.RETURNED;
        }
        if (condition != BookLoanStatus.RETURNED
                && condition != BookLoanStatus.LOST
                && condition != BookLoanStatus.DAMAGED) {
            throw new LibraryOperationException(
                    "Trạng thái trả sách chỉ có thể là RETURNED, LOST hoặc DAMAGED");
        }
        bookLoan.setStatus(condition);

        // 5. Lưu số ngày quá hạn trước khi đóng phiếu mượn.
        int overdueDays = calculateOverdueDate(bookLoan.getDueDate(), LocalDate.now());
        bookLoan.setOverdueDays(overdueDays);
        bookLoan.setIsOverdue(overdueDays > 0);

        // Mỗi phiếu mượn chỉ có một khoản phạt quá hạn; số tiền tính theo ngày trả thực tế.
        if (overdueDays > 0) {
            Fine overdueFine = fineRepository
                    .findByBookLoanIdAndType(bookLoan.getId(), FineType.OVERDUE)
                    .orElseGet(() -> Fine.builder()
                            .bookLoan(bookLoan)
                            .user(bookLoan.getUser())
                            .type(FineType.OVERDUE)
                            .status(FineStatus.PENDING)
                            .amountPaid(0L)
                            .reason("Trả sách quá hạn " + overdueDays + " ngày")
                            .build());
            if (overdueFine.getStatus() == FineStatus.PENDING) {
                overdueFine.setAmount(Math.multiplyExact((long) overdueDays, overdueFinePerDay));
                fineRepository.save(overdueFine);
            }
        }

        // 6. Lưu ghi chú trả sách.
        bookLoan.setNotes(checkinRequest.getNotes() == null
                ? "Người dùng đã trả sách"
                : checkinRequest.getNotes());

        // 7. Hoàn lại số bản có sẵn, trừ trường hợp làm mất sách.
        if (condition != BookLoanStatus.LOST) {
            Book book = bookRepository.findByIdForUpdate(bookLoan.getBook().getId())
                    .orElseThrow(() -> new BookException("Không tìm thấy sách của phiếu mượn"));
            book.setAvailableCopies(book.getAvailableCopies() + 1);
            bookRepository.save(book);


            // Nếu có hàng chờ, đánh dấu người đầu tiên có thể đến nhận sách trong 48 giờ.
            reservationRepository.findFirstByBookIdAndStatusOrderByReservedAtAsc(
                            book.getId(), ReservationStatus.PENDING)
                    .ifPresent(nextReservation -> {
                        LocalDateTime now = LocalDateTime.now();
                        nextReservation.setStatus(ReservationStatus.AVAILABLE);
                        nextReservation.setAvailableAt(now);
                        nextReservation.setAvailableUntil(now.plusHours(48));
                        nextReservation.setQueuePosition(null);
                        notifyReservation(nextReservation);
                        reservationRepository.save(nextReservation);
                        refreshReservationQueue(book.getId());
                    });
        }

        // 8. Lưu phiếu mượn đã hoàn tất.
    BookLoan savedBookLoan = bookLoanRepository.save(bookLoan);
     return toDTOWithFine(savedBookLoan);

    }

    @Override
    @Transactional
    public BookLoanDTO renewCheckout(RenewalRequest renewalRequest) {

        // 1. Kiểm tra phiếu mượn tồn tại và thuộc người đang thao tác.
        BookLoan bookLoan = bookLoanRepository.findById(renewalRequest.getBookLoanId())
                .orElseThrow(() -> new LibraryOperationException("Không tìm thấy phiếu mượn"));

        User currentUser = userService.getCurrentUser();
        if (!bookLoan.getUser().getId().equals(currentUser.getId())
                && currentUser.getRole() != UserRole.ROLE_ADMIN) {
            throw new LibraryOperationException("Bạn chỉ có thể gia hạn phiếu mượn của chính mình");
        }

        // 2. Chỉ gia hạn phiếu còn hiệu lực, chưa quá hạn và chưa hết lượt.
        if (!bookLoan.canRenew()) {
            throw new BookException("Phiếu mượn không đủ điều kiện gia hạn");
        }

        if (reservationRepository.findFirstByBookIdAndStatusOrderByReservedAtAsc(
                bookLoan.getBook().getId(), ReservationStatus.PENDING).isPresent()) {
            throw new BookException("Không thể gia hạn vì đang có người đặt chỗ cuốn sách này");
        }

        SubscriptionDTO subscription = subscriptionService
                .getUsersActiveSubscription(bookLoan.getUser().getId());
        int extensionDays = renewalRequest.getExtensionDays() == null
                ? subscription.getMaxDaysPerBook()
                : renewalRequest.getExtensionDays();
        if (extensionDays <= 0 || extensionDays > subscription.getMaxDaysPerBook()) {
            throw new BookException("Số ngày gia hạn phải từ 1 đến "
                    + subscription.getMaxDaysPerBook());
        }

        // 3. Cập nhật hạn trả và số lần gia hạn.
        bookLoan.setDueDate(bookLoan.getDueDate()
                .plusDays(extensionDays));

        bookLoan.setRenewalCount(bookLoan.getRenewalCount() + 1);
        bookLoan.setType(BookLoanType.RENEWAL);
        bookLoan.setNotes(renewalRequest.getNotes() == null
                ? "Người dùng đã gia hạn sách"
                : renewalRequest.getNotes());

        BookLoan savedBookLoan = bookLoanRepository.save(bookLoan);

        return toDTOWithFine(savedBookLoan);
    }

    @Override
    public PageResponse<BookLoanDTO> getMyBookLoans(BookLoanStatus status, int page, int size) {
        User currentUser = userService.getCurrentUser();
        Page<BookLoan> bookLoanPage;
        page = Math.max(page, 0);
        size = Math.min(Math.max(size, 1), 100);

        if (status != null) {
            // Có trạng thái: lọc theo trạng thái và xếp theo hạn trả.
            Pageable pageable = PageRequest.of(page, size, Sort.by("dueDate").ascending());
            bookLoanPage = bookLoanRepository.findByStatusAndUser(
                    status, currentUser, pageable);
        } else {
            // Không có trạng thái: trả toàn bộ lịch sử, mới nhất trước.
            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            bookLoanPage = bookLoanRepository.findByUserId(currentUser.getId(), pageable);
        }
        return convertToPageResponse(bookLoanPage);
    }

    @Override
    public PageResponse<BookLoanDTO> getBookLoans(BookLoanSearchRequest request) {
        if (request == null) {
            request = new BookLoanSearchRequest();
        }
        // 1. Tạo thông tin phân trang và sắp xếp từ yêu cầu tìm kiếm.
        Pageable pageable = createPageable(
                request.getPage(),
                request.getSize(),
                request.getSortBy(),
                request.getSortDirection()
        );

        // 2. Ghép tất cả điều kiện được gửi từ frontend vào cùng một truy vấn.
        Page<BookLoan> bookLoanPage = bookLoanRepository.searchBookLoans(
                request.getUserId(),
                request.getBookId(),
                request.getStatus(),
                Boolean.TRUE.equals(request.getOverdueOnly()),
                Boolean.TRUE.equals(request.getUnpaidFinesOnly()),
                request.getStartDate(),
                request.getEndDate(),
                LocalDate.now(),
                pageable
        );

        // 3. Chuyển entity sang DTO và đóng gói thông tin phân trang.
        return convertToPageResponse(bookLoanPage);
    }

    @Override
    @Transactional
    public int updateOverdueBookLoan() {
        Pageable pageable = PageRequest.of(0, 1000); // Xử lý tối đa 1.000 phiếu mỗi lần chạy.
        Page<BookLoan> overduePage = bookLoanRepository
                .findOverdueBookLoans(LocalDate.now(), pageable);

        int updateCount = 0;
        for (BookLoan bookLoan : overduePage.getContent()) {
            int overdueDays = calculateOverdueDate(bookLoan.getDueDate(), LocalDate.now());
            boolean statusChanged = bookLoan.getStatus() == BookLoanStatus.CHECKED_OUT;
            boolean daysChanged = bookLoan.getOverdueDays() == null
                    || bookLoan.getOverdueDays() != overdueDays;

            // Cập nhật cả phiếu mới quá hạn lẫn số ngày của phiếu đã quá hạn từ trước.
            if (statusChanged || daysChanged || !Boolean.TRUE.equals(bookLoan.getIsOverdue())) {
                bookLoan.setStatus(BookLoanStatus.OVERDUE);
                bookLoan.setIsOverdue(true);
                bookLoan.setOverdueDays(overdueDays);
                bookLoanRepository.save(bookLoan);
                updateCount++;
            }
        }
        return updateCount;
    }

    private Pageable createPageable(Integer page,
                                    Integer size,
                                    String sortBy,
                                    String sortDirection
    ) {
        page = page == null ? 0 : Math.max(page, 0);
        size = size == null ? 20 : size;
        size = Math.min(size, 100);
        size = Math.max(size, 1);

        List<String> allowedSortFields = List.of(
                "createdAt", "updatedAt", "checkoutDate", "dueDate", "returnDate", "status"
        );
        if (!allowedSortFields.contains(sortBy)) {
            sortBy = "createdAt";
        }

        Sort sort = "ASC".equalsIgnoreCase(sortDirection)
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        return PageRequest.of(page, size, sort);
    }


    private PageResponse<BookLoanDTO> convertToPageResponse(Page<BookLoan> bookLoanPage) {
        List<BookLoanDTO> bookLoanDTOS = bookLoanPage.getContent()
                .stream()
                .map(this::toDTOWithFine)
                .collect(Collectors.toList());

        return new PageResponse<>(
                bookLoanDTOS,
                bookLoanPage.getNumber(),
                bookLoanPage.getSize(),
                bookLoanPage.getTotalElements(),
                bookLoanPage.getTotalPages(),
                bookLoanPage.isLast(),
                bookLoanPage.isFirst(),
                bookLoanPage.isEmpty()
        );
    }

    public int calculateOverdueDate(LocalDate dueDate, LocalDate today) {
        if (today.isBefore(dueDate) || today.isEqual(dueDate)) {
            return 0;
        }
        return (int) ChronoUnit.DAYS.between(dueDate, today);
    }

    /** Bổ sung tổng tiền phạt vào DTO phiếu mượn để API không trả hai trường rỗng. */
    private BookLoanDTO toDTOWithFine(BookLoan bookLoan) {
        BookLoanDTO dto = bookLoanMapper.toDTO(bookLoan);
        List<Fine> fines = fineRepository.findByBookLoanId(bookLoan.getId());
        if (fines.isEmpty()) {
            dto.setFineAmount(BigDecimal.ZERO);
            dto.setFinePaid(true);
            return dto;
        }

        long outstanding = fines.stream()
                .mapToLong(Fine::getAmountOutstanding)
                .sum();
        long totalAmount = fines.stream()
                .map(Fine::getAmount)
                .mapToLong(Long::longValue)
                .sum();
        boolean allResolved = fines.stream().allMatch(fine ->
                fine.getStatus() == FineStatus.PAID || fine.getStatus() == FineStatus.WAIVED);

        dto.setFineAmount(BigDecimal.valueOf(allResolved ? totalAmount : outstanding));
        dto.setFinePaid(allResolved);
        return dto;
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

    private void refreshReservationQueue(Long bookId) {
        List<Reservation> pending = reservationRepository.findPendingReservationsByBook(bookId);
        for (int index = 0; index < pending.size(); index++) {
            pending.get(index).setQueuePosition(index + 1);
        }
        reservationRepository.saveAll(pending);
    }
}
