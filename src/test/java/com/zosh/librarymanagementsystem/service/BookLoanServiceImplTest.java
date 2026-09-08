package com.zosh.librarymanagementsystem.service;

import com.zosh.librarymanagementsystem.domain.BookLoanStatus;
import com.zosh.librarymanagementsystem.domain.FineStatus;
import com.zosh.librarymanagementsystem.domain.ReservationStatus;
import com.zosh.librarymanagementsystem.exception.BookException;
import com.zosh.librarymanagementsystem.mapper.BookLoanMapper;
import com.zosh.librarymanagementsystem.modal.Book;
import com.zosh.librarymanagementsystem.modal.BookLoan;
import com.zosh.librarymanagementsystem.modal.Fine;
import com.zosh.librarymanagementsystem.modal.Reservation;
import com.zosh.librarymanagementsystem.modal.User;
import com.zosh.librarymanagementsystem.payload.dto.BookLoanDTO;
import com.zosh.librarymanagementsystem.payload.dto.SubscriptionDTO;
import com.zosh.librarymanagementsystem.payload.request.CheckinRequest;
import com.zosh.librarymanagementsystem.payload.request.CheckoutRequest;
import com.zosh.librarymanagementsystem.repository.BookLoanRepository;
import com.zosh.librarymanagementsystem.repository.BookRepository;
import com.zosh.librarymanagementsystem.repository.FineRepository;
import com.zosh.librarymanagementsystem.repository.ReservationRepository;
import com.zosh.librarymanagementsystem.service.impl.BookLoanServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookLoanServiceImplTest {

    @Mock private BookLoanRepository bookLoanRepository;
    @Mock private UserService userService;
    @Mock private SubscriptionService subscriptionService;
    @Mock private BookRepository bookRepository;
    @Mock private BookLoanMapper bookLoanMapper;
    @Mock private ReservationRepository reservationRepository;
    @Mock private FineRepository fineRepository;
    @Mock private EmailService emailService;

    @InjectMocks private BookLoanServiceImpl bookLoanService;

    @BeforeEach
    void cauHinhMucPhatQuaHan() {
        ReflectionTestUtils.setField(bookLoanService, "overdueFinePerDay", 10L);
    }

    @Test
    void muonSachThanhCongTruMotBanCoSan() {
        User user = User.builder().id(1L).build();
        Book book = Book.builder().id(2L).active(true).totalCopies(3).availableCopies(2).build();
        SubscriptionDTO subscription = new SubscriptionDTO();
        subscription.setMaxBooksAllowed(3);
        subscription.setMaxDaysPerBook(14);
        CheckoutRequest request = new CheckoutRequest(2L, 10, "Mượn tại quầy");
        BookLoanDTO expected = new BookLoanDTO();

        when(userService.findById(1L)).thenReturn(user);
        when(subscriptionService.getUsersActiveSubscription(1L)).thenReturn(subscription);
        when(bookRepository.findByIdForUpdate(2L)).thenReturn(Optional.of(book));
        when(bookLoanRepository.hasActiveCheckout(1L, 2L)).thenReturn(false);
        when(bookLoanRepository.countActiveBookLoansByUser(1L)).thenReturn(0L);
        when(bookLoanRepository.countOverdueBookLoansByUser(1L)).thenReturn(0L);
        when(bookLoanRepository.save(any(BookLoan.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(bookLoanMapper.toDTO(any(BookLoan.class))).thenReturn(expected);

        BookLoanDTO result = bookLoanService.checkoutBookForUser(1L, request);

        assertSame(expected, result);
        assertEquals(1, book.getAvailableCopies());
        ArgumentCaptor<BookLoan> loanCaptor = ArgumentCaptor.forClass(BookLoan.class);
        verify(bookLoanRepository).save(loanCaptor.capture());
        assertEquals(LocalDate.now().plusDays(10), loanCaptor.getValue().getDueDate());
    }

    @Test
    void tuChoiKhiDaDatGioiHanMuonSach() {
        User user = User.builder().id(1L).build();
        Book book = Book.builder().id(2L).active(true).totalCopies(3).availableCopies(2).build();
        SubscriptionDTO subscription = new SubscriptionDTO();
        subscription.setMaxBooksAllowed(1);
        subscription.setMaxDaysPerBook(14);

        when(userService.findById(1L)).thenReturn(user);
        when(subscriptionService.getUsersActiveSubscription(1L)).thenReturn(subscription);
        when(bookRepository.findByIdForUpdate(2L)).thenReturn(Optional.of(book));
        when(bookLoanRepository.countActiveBookLoansByUser(1L)).thenReturn(1L);

        assertThrows(BookException.class,
                () -> bookLoanService.checkoutBookForUser(1L, new CheckoutRequest(2L, 14, null)));
        verify(bookLoanRepository, never()).save(any());
        assertEquals(2, book.getAvailableCopies());
    }

    @Test
    void traSachQuaHanTaoTienPhatVaMoDatChoDauTien() throws Exception {
        User user = User.builder().id(1L).build();
        Book book = Book.builder().id(2L).totalCopies(1).availableCopies(0).build();
        BookLoan loan = BookLoan.builder()
                .id(3L).user(user).book(book).status(BookLoanStatus.CHECKED_OUT)
                .checkoutDate(LocalDate.now().minusDays(10))
                .dueDate(LocalDate.now().minusDays(3)).build();
        Reservation next = Reservation.builder()
                .id(4L).user(User.builder().id(5L).build()).book(book)
                .status(ReservationStatus.PENDING).build();
        CheckinRequest request = new CheckinRequest(3L, BookLoanStatus.RETURNED, "Đã nhận đủ sách");

        when(bookLoanRepository.findById(3L)).thenReturn(Optional.of(loan));
        when(bookRepository.findByIdForUpdate(2L)).thenReturn(Optional.of(book));
        when(fineRepository.findByBookLoanIdAndType(eq(3L), any())).thenReturn(Optional.empty());
        when(reservationRepository.findFirstByBookIdAndStatusOrderByReservedAtAsc(
                2L, ReservationStatus.PENDING)).thenReturn(Optional.of(next));
        when(bookLoanRepository.save(loan)).thenReturn(loan);
        when(bookLoanMapper.toDTO(loan)).thenReturn(new BookLoanDTO());

        bookLoanService.checkinBook(request);

        assertEquals(1, book.getAvailableCopies());
        assertEquals(3, loan.getOverdueDays());
        assertEquals(ReservationStatus.AVAILABLE, next.getStatus());
        assertNotNull(next.getAvailableUntil());
        ArgumentCaptor<Fine> fineCaptor = ArgumentCaptor.forClass(Fine.class);
        verify(fineRepository).save(fineCaptor.capture());
        assertEquals(30L, fineCaptor.getValue().getAmount());
        assertEquals(FineStatus.PENDING, fineCaptor.getValue().getStatus());
    }
}
