package com.zosh.librarymanagementsystem.controller;

import com.zosh.librarymanagementsystem.domain.ReservationStatus;
import com.zosh.librarymanagementsystem.payload.dto.ReservationDTO;
import com.zosh.librarymanagementsystem.payload.request.ReservationRequest;
import com.zosh.librarymanagementsystem.payload.request.ReservationSearchRequest;
import com.zosh.librarymanagementsystem.payload.response.PageResponse;
import com.zosh.librarymanagementsystem.payload.response.ApiResponse;
import com.zosh.librarymanagementsystem.service.ReservationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/reservations")
public class ReservationController {
    private final ReservationService reservationService;

    @PostMapping
    public ResponseEntity<?> createReservation(
            @Valid @RequestBody ReservationRequest reservationRequest
    ) {
        ReservationDTO reservationDTO = reservationService
                .createReservation(reservationRequest);
        return ResponseEntity.ok(reservationDTO);
    }

    @PostMapping("/user/{userId}")
    public ResponseEntity<?> createReservationForUser(
            @PathVariable Long userId,
            @Valid @RequestBody ReservationRequest reservationRequest) {

        ReservationDTO reservation = reservationService
                .createReservationForUser(reservationRequest, userId);
        return new ResponseEntity<>(reservation, HttpStatus.CREATED);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> cancelReservation(
            @PathVariable Long id) {

        ReservationDTO reservation = reservationService.cancelReservation(id);
        return ResponseEntity.ok(reservation);
    }

    @PostMapping("/{id}/fulfill")
    public ResponseEntity<?> fulfillReservation(@PathVariable Long id) {

        ReservationDTO reservation = reservationService.fulfillReservation(id);
        return ResponseEntity.ok(reservation);
    }

    @GetMapping("/my")
    public ResponseEntity<PageResponse<ReservationDTO>> getMyReservations(
            @RequestParam(required = false) ReservationStatus status,
            @RequestParam(required = false) Boolean activeOnly,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "reservedAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection) {

        ReservationSearchRequest searchRequest = new ReservationSearchRequest();
        searchRequest.setStatus(status);
        searchRequest.setActiveOnly(activeOnly);
        searchRequest.setPage(page);
        searchRequest.setSize(size);
        searchRequest.setSortBy(sortBy);
        searchRequest.setSortDirection(sortDirection);

        PageResponse<ReservationDTO> reservations = reservationService
                .getMyReservations(searchRequest);
        return ResponseEntity.ok(reservations);
    }

    @GetMapping
    public ResponseEntity<PageResponse<ReservationDTO>> searchReservations(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long bookId,
            @RequestParam(required = false) ReservationStatus status,
            @RequestParam(required = false) Boolean activeOnly,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "reservedAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection) {

        ReservationSearchRequest searchRequest = new ReservationSearchRequest();
        searchRequest.setUserId(userId);
        searchRequest.setBookId(bookId);
        searchRequest.setStatus(status);
        searchRequest.setActiveOnly(activeOnly);
        searchRequest.setPage(page);
        searchRequest.setSize(size);
        searchRequest.setSortBy(sortBy);
        searchRequest.setSortDirection(sortDirection);

        PageResponse<ReservationDTO> reservations = reservationService
                .searchReservations(searchRequest);
        return ResponseEntity.ok(reservations);
    }

    @PostMapping("/admin/expire")
    public ResponseEntity<ApiResponse> expireReservations() {
        int count = reservationService.expireReservations();
        return ResponseEntity.ok(new ApiResponse(
                "Đã cập nhật " + count + " đặt chỗ hết hạn", true));
    }

}
