package com.zosh.librarymanagementsystem.controller;

import com.zosh.librarymanagementsystem.exception.BookException;
import com.zosh.librarymanagementsystem.payload.dto.BookDTO;
import com.zosh.librarymanagementsystem.payload.request.BookSearchRequest;
import com.zosh.librarymanagementsystem.payload.response.ApiResponse;
import com.zosh.librarymanagementsystem.payload.response.BookStatsResponse;
import com.zosh.librarymanagementsystem.payload.response.PageResponse;
import com.zosh.librarymanagementsystem.service.BookService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/books")
public class BookController {

    private final BookService bookService;

    @PostMapping("/admin")
    public ResponseEntity<BookDTO>createBook(
            @Valid @RequestBody BookDTO bookDTO) throws BookException {
        BookDTO createBook=bookService.createBook(bookDTO);
        return ResponseEntity.ok(createBook);
    }

    @PostMapping("/admin/bulk")
    public ResponseEntity<?>createBookBulk(
            @Valid @RequestBody List<BookDTO> bookDTOS) throws BookException {
        List<BookDTO> createBook=bookService.createBookBulk(bookDTOS);
        return ResponseEntity.ok(createBook);
    }


      @GetMapping("/{id}")
      public ResponseEntity<BookDTO> getBookById(@PathVariable Long id)
              throws BookException {
        BookDTO book = bookService.getBookById(id);
        return ResponseEntity.ok(book);
      }

     @PutMapping("/{id}")
    public ResponseEntity<BookDTO> updateBook(
            @PathVariable Long id,
            @Valid @RequestBody BookDTO bookDTO) throws BookException {
        BookDTO updateBook = bookService.updateBook(id, bookDTO);
        return ResponseEntity.ok(updateBook);
    }

    /**
     * Soft delete a book (mark as inactive)
     * DELETE /api/books/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteBook(@PathVariable Long id) throws BookException {
        bookService.deleteBook(id);
        return ResponseEntity.ok(new ApiResponse("Book deleted successfully", true));
    }

    /**
     *  Permanently delete a book
     * DELETE /api/books/{id}/permanent
     */
    @DeleteMapping({"/{id}/permanent", "/{id}/permaent"})
    public ResponseEntity<ApiResponse> hardDeleteBook(@PathVariable Long id) throws BookException {
        bookService.hardDeleteBook(id);
        return ResponseEntity.ok(new ApiResponse("Book permanently deleted", true));
    }

    @GetMapping
    public  ResponseEntity<PageResponse<BookDTO>> searchBooks(
            @RequestParam(required = false) Long genreId,
            @RequestParam(required = false, defaultValue = "false") Boolean availableOnly,
            @RequestParam(defaultValue = "true") boolean activeOnly,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection) {


        // Build search request from query parameters
        BookSearchRequest searchRequest = new BookSearchRequest();
        searchRequest.setGenreId(genreId);
        searchRequest.setAvailableOnly(availableOnly);
        searchRequest.setActiveOnly(activeOnly);
        searchRequest.setPage(page);
        searchRequest.setSize(size);
        searchRequest.setSortBy(sortBy);
        searchRequest.setSortDirection(sortDirection);

        PageResponse<BookDTO> books = bookService.searchBooksWithFilters(searchRequest);
        return ResponseEntity.ok(books);
    }




    @PostMapping("/search")
    public  ResponseEntity<PageResponse<BookDTO>> advanceSearch(
            @RequestBody BookSearchRequest searchRequest) {
        PageResponse<BookDTO> books = bookService.searchBooksWithFilters(searchRequest);
        return ResponseEntity.ok(books);
    }

    @GetMapping("/stats")
    public ResponseEntity<BookStatsResponse> getBookStats() {
        long totalActive = bookService.getTotalActiveBooks();
        long totalAvailable = bookService.getTotalAvailableBooks();

        BookStatsResponse stats = new BookStatsResponse(totalActive, totalAvailable);
        return  ResponseEntity.ok(stats);
    }

}
