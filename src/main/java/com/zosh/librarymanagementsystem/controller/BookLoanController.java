package com.zosh.librarymanagementsystem.controller;

import com.zosh.librarymanagementsystem.domain.BookLoanStatus;
import com.zosh.librarymanagementsystem.payload.dto.BookLoanDTO;
import com.zosh.librarymanagementsystem.payload.request.BookLoanSearchRequest;
import com.zosh.librarymanagementsystem.payload.request.CheckinRequest;
import com.zosh.librarymanagementsystem.payload.request.CheckoutRequest;
import com.zosh.librarymanagementsystem.payload.request.RenewalRequest;
import com.zosh.librarymanagementsystem.payload.response.ApiResponse;
import com.zosh.librarymanagementsystem.payload.response.PageResponse;
import com.zosh.librarymanagementsystem.service.BookLoanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/book-loans")
public class BookLoanController {

    private final BookLoanService bookLoanService;

    @PostMapping("/checkout")
    public ResponseEntity<?> checkoutBook(
            @Valid @RequestBody CheckoutRequest checkoutRequest) {
            BookLoanDTO bookLoan = bookLoanService.checkoutBook(checkoutRequest);
            return new ResponseEntity<>(bookLoan, HttpStatus.CREATED);
    }

    @PostMapping("/checkout/user/{userId}")
    public ResponseEntity<?> checkoutBookForUser(
            @PathVariable Long userId,
            @Valid @RequestBody CheckoutRequest checkoutRequest) {

        BookLoanDTO bookLoan = bookLoanService
                .checkoutBookForUser(userId, checkoutRequest);
        return new ResponseEntity<>(bookLoan, HttpStatus.CREATED);
    }

    @PostMapping("/checkin")
    public ResponseEntity<?> checkin(

            @Valid @RequestBody CheckinRequest checkinRequest) {
        BookLoanDTO bookLoan = bookLoanService
                .checkinBook(checkinRequest);
        return new ResponseEntity<>(bookLoan, HttpStatus.OK);
    }

    @PostMapping("/renew")
    public ResponseEntity<?> renew(

            @Valid @RequestBody RenewalRequest renewalRequest) {

        BookLoanDTO bookLoan = bookLoanService
                .renewCheckout(renewalRequest);
        return new ResponseEntity<>(bookLoan, HttpStatus.OK);
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyBookLoans(
            @RequestParam(required = false)BookLoanStatus status,
            @RequestParam(defaultValue =  "0") int page,
            @RequestParam(defaultValue = "20") int size ) {

        PageResponse<BookLoanDTO> bookLoans = bookLoanService
                .getMyBookLoans(status, page, size);
        return ResponseEntity.ok(bookLoans);
    }

    @PostMapping("/search")
    public ResponseEntity<?> getALLBookLoans(
            @RequestBody BookLoanSearchRequest searchRequest) {

        PageResponse<BookLoanDTO> bookLoans = bookLoanService
                .getBookLoans(searchRequest);
        return ResponseEntity.ok(bookLoans);
    }

    @PostMapping("/admin/update-overdue")
    public ResponseEntity<?> updateOverdueBookLoans() {

        int updateCount = bookLoanService.updateOverdueBookLoan();
        return ResponseEntity.ok(new ApiResponse(
                "Đã cập nhật các phiếu mượn quá hạn: " + updateCount, true));

    }

}
