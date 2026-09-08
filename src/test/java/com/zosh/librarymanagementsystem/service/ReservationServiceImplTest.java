package com.zosh.librarymanagementsystem.service;

import com.zosh.librarymanagementsystem.domain.ReservationStatus;
import com.zosh.librarymanagementsystem.exception.LibraryOperationException;
import com.zosh.librarymanagementsystem.mapper.ReservationMapper;
import com.zosh.librarymanagementsystem.modal.Book;
import com.zosh.librarymanagementsystem.modal.Reservation;
import com.zosh.librarymanagementsystem.modal.User;
import com.zosh.librarymanagementsystem.payload.dto.ReservationDTO;
import com.zosh.librarymanagementsystem.payload.request.ReservationRequest;
import com.zosh.librarymanagementsystem.repository.BookLoanRepository;
import com.zosh.librarymanagementsystem.repository.BookRepository;
import com.zosh.librarymanagementsystem.repository.ReservationRepository;
import com.zosh.librarymanagementsystem.service.impl.ReservationServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReservationServiceImplTest {

    @Mock private BookLoanRepository bookLoanRepository;
    @Mock private UserService userService;
    @Mock private BookRepository bookRepository;
    @Mock private ReservationRepository reservationRepository;
    @Mock private ReservationMapper reservationMapper;
    @Mock private BookLoanService bookLoanService;
    @Mock private EmailService emailService;

    @InjectMocks
    private ReservationServiceImpl reservationService;

    @Test
    void datChoHoGanDungNguoiDungVaXepCuoiHangCho() throws Exception {
        User targetUser = User.builder().id(9L).build();
        Book book = Book.builder().id(4L).availableCopies(1).build();
        ReservationRequest request = ReservationRequest.builder()
                .bookId(4L)
                .notes("Đặt hộ tại quầy")
                .build();
        ReservationDTO expected = new ReservationDTO();

        when(userService.findById(9L)).thenReturn(targetUser);
        when(bookRepository.findByIdForUpdate(4L)).thenReturn(Optional.of(book));
        when(reservationRepository.countByBookIdAndStatus(4L, ReservationStatus.AVAILABLE))
                .thenReturn(1L);
        when(reservationRepository.countPendingReservationsByBook(4L)).thenReturn(2L);
        when(reservationRepository.save(any(Reservation.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(reservationMapper.toDTO(any(Reservation.class))).thenReturn(expected);

        ReservationDTO result = reservationService.createReservationForUser(request, 9L);

        assertEquals(expected, result);
        ArgumentCaptor<Reservation> captor = ArgumentCaptor.forClass(Reservation.class);
        verify(reservationRepository).save(captor.capture());
        assertEquals(targetUser, captor.getValue().getUser());
        assertEquals(ReservationStatus.PENDING, captor.getValue().getStatus());
        assertEquals(3, captor.getValue().getQueuePosition());
    }

    @Test
    void khongDatChoKhiVanConBanSachTuDo() {
        User targetUser = User.builder().id(9L).build();
        Book book = Book.builder().id(4L).availableCopies(1).build();
        ReservationRequest request = ReservationRequest.builder().bookId(4L).build();

        when(userService.findById(9L)).thenReturn(targetUser);
        when(bookRepository.findByIdForUpdate(4L)).thenReturn(Optional.of(book));
        when(reservationRepository.countByBookIdAndStatus(4L, ReservationStatus.AVAILABLE))
                .thenReturn(0L);

        assertThrows(LibraryOperationException.class,
                () -> reservationService.createReservationForUser(request, 9L));
        verify(reservationRepository, never()).save(any());
    }
}
