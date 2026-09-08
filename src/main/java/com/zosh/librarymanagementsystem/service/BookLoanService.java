package com.zosh.librarymanagementsystem.service;

import com.zosh.librarymanagementsystem.domain.BookLoanStatus;
import com.zosh.librarymanagementsystem.payload.dto.BookLoanDTO;
import com.zosh.librarymanagementsystem.payload.request.BookLoanSearchRequest;
import com.zosh.librarymanagementsystem.payload.request.CheckinRequest;
import com.zosh.librarymanagementsystem.payload.request.CheckoutRequest;
import com.zosh.librarymanagementsystem.payload.request.RenewalRequest;
import com.zosh.librarymanagementsystem.payload.response.PageResponse;

public interface BookLoanService {

    BookLoanDTO checkoutBook(CheckoutRequest checkoutRequest);

    BookLoanDTO checkoutBookForUser(Long userId, CheckoutRequest checkoutRequest);

    BookLoanDTO checkinBook(CheckinRequest checkinRequest);

    BookLoanDTO renewCheckout(RenewalRequest renewalRequest);

    PageResponse<BookLoanDTO> getMyBookLoans(BookLoanStatus status,
                                             int page, int size);

    PageResponse<BookLoanDTO> getBookLoans(BookLoanSearchRequest request);

    int updateOverdueBookLoan();
}
