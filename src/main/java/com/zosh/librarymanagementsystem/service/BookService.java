package com.zosh.librarymanagementsystem.service;

import com.zosh.librarymanagementsystem.payload.dto.BookDTO;
import com.zosh.librarymanagementsystem.payload.request.BookSearchRequest;
import com.zosh.librarymanagementsystem.payload.response.PageResponse;

import java.util.List;

public interface BookService {
    BookDTO createBook(BookDTO bookDTO);
    List<BookDTO> createBookBulk();
    BookDTO getBookById(Long bookId);
    BookDTO getBookByISBN(String isbn);
    BookDTO updateBook(Long bookId, BookDTO bookDTO);
    void deleteBook(Long bookId);
    void hardDeleteBook(Long bookId);

    PageResponse<BookDTO> searchBooksWithFilters(
        BookSearchRequest searchRequest
    );

    long getTotalActiveBooks();

    long getTotalAvailableBooks();

}
