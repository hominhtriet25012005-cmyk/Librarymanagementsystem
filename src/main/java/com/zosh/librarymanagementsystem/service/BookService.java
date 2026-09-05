package com.zosh.librarymanagementsystem.service;

import com.zosh.librarymanagementsystem.exception.BookException;
import com.zosh.librarymanagementsystem.payload.dto.BookDTO;
import com.zosh.librarymanagementsystem.payload.request.BookSearchRequest;
import com.zosh.librarymanagementsystem.payload.response.PageResponse;

import java.util.List;

public interface BookService {
    BookDTO createBook(BookDTO bookDTO) throws BookException;
    List<BookDTO> createBookBulk(List<BookDTO> bookDTOs) throws BookException;
    BookDTO getBookById(Long bookId) throws BookException;
    BookDTO getBookByISBN(String isbn) throws BookException;
    BookDTO updateBook(Long bookId, BookDTO bookDTO) throws BookException;
    void deleteBook(Long bookId) throws BookException;
    void hardDeleteBook(Long bookId) throws BookException;

    PageResponse<BookDTO> searchBooksWithFilters(
        BookSearchRequest searchRequest
    );

    long getTotalActiveBooks();

    long getTotalAvailableBooks();

}
