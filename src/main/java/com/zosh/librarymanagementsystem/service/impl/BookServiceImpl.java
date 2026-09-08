package com.zosh.librarymanagementsystem.service.impl;

import com.zosh.librarymanagementsystem.exception.BookException;
import com.zosh.librarymanagementsystem.mapper.BookMapper;
import com.zosh.librarymanagementsystem.modal.Book;
import com.zosh.librarymanagementsystem.payload.dto.BookDTO;
import com.zosh.librarymanagementsystem.payload.request.BookSearchRequest;
import com.zosh.librarymanagementsystem.payload.response.PageResponse;
import com.zosh.librarymanagementsystem.repository.BookRepository;
import com.zosh.librarymanagementsystem.service.BookService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookServiceImpl implements BookService {

    private final BookRepository bookRepository;
    private final BookMapper bookMapper;

    @Override
    @Transactional
    public BookDTO createBook(BookDTO bookDTO) throws BookException {

        if (bookRepository.existsByIsbn(bookDTO.getIsbn())) {
            throw new BookException("Sách có ISBN " + bookDTO.getIsbn() + " đã tồn tại");
        }
        Book book = bookMapper.toEntity(bookDTO);

        validateAvailableCopies(book);
        Book saveBook= bookRepository.save(book);


        return bookMapper.toDTO(saveBook);
    }

    @Override
    @Transactional
    public List<BookDTO> createBookBulk(List<BookDTO> bookDTOs) throws BookException {

        List<BookDTO> createdBooks= new ArrayList<>();
        for (BookDTO bookDTO:bookDTOs) {
            BookDTO book =createBook(bookDTO);
            createdBooks.add(book);
        }
        return createdBooks;
    }

    @Override
    public BookDTO getBookById(Long bookId) throws BookException {
        Book book=bookRepository.findById(bookId)
                .orElseThrow(()-> new BookException("Không tìm thấy sách"));
        return bookMapper.toDTO(book);
    }

    @Override
    public BookDTO getBookByISBN(String isbn) throws BookException {
        Book book=bookRepository.findByIsbn(isbn)
                .orElseThrow(()-> new BookException("Không tìm thấy sách"));
        return bookMapper.toDTO(book);
    }

    @Override
    @Transactional
    public BookDTO updateBook(Long bookId, BookDTO bookDTO) throws BookException {
        Book existingBook=bookRepository.findById(bookId).orElseThrow(
                ()-> new BookException("Không tìm thấy sách")
        );
        bookMapper.updateEntityFromDTO(bookDTO,existingBook);
        validateAvailableCopies(existingBook);
        Book savedBook = bookRepository.save(existingBook);
        return bookMapper.toDTO(savedBook);
    }

    @Override
    @Transactional
    public void deleteBook(Long bookId) throws BookException {
        Book existingBook=bookRepository.findById(bookId).orElseThrow(
                ()-> new BookException("Không tìm thấy sách")
        );
        existingBook.setActive(false);
        bookRepository.save(existingBook);
    }

    @Override
    @Transactional
    public void hardDeleteBook(Long bookId) throws BookException {
        Book existingBook=bookRepository.findById(bookId).orElseThrow(
                ()-> new BookException("Không tìm thấy sách")
        );
        bookRepository.delete(existingBook);
    }

    @Override
    public PageResponse<BookDTO> searchBooksWithFilters(BookSearchRequest searchRequest) {
        if (searchRequest == null) {
            searchRequest = new BookSearchRequest();
        }

        Pageable pageable= createPageable(searchRequest.getPage(),
                searchRequest.getSize(),
                searchRequest.getSortBy(),
                searchRequest.getSortDirection());
        Page<Book> bookPage = bookRepository.searchBooksWithFilters(
                normalizeSearchTerm(searchRequest.getSearchTerm()),
                searchRequest.getGenreId(),
                Boolean.TRUE.equals(searchRequest.getAvailableOnly()),
                !Boolean.FALSE.equals(searchRequest.getActiveOnly()),
                pageable
        );
        return convertToPageResponse(bookPage);
    }

    @Override
    public long getTotalActiveBooks() {
        return bookRepository.countByActiveTrue();
    }

    @Override
    public long getTotalAvailableBooks() {
        return bookRepository.countAvailableBooks();
    }

    private Pageable createPageable(Integer page, Integer size, String sortBy, String sortDirection) {
        page = page == null ? 0 : page;
        size = size == null ? 20 : size;
        sortBy = sortBy == null ? "createdAt" : sortBy;
        sortDirection = sortDirection == null ? "DESC" : sortDirection;
        page = Math.max(page, 0);
        size=Math.min(size, 100);
        size=Math.max(size, 1);

        List<String> allowedSortFields = List.of(
                "createdAt", "updatedAt", "title", "author", "publishedDate", "price"
        );
        if (!allowedSortFields.contains(sortBy)) {
            sortBy = "createdAt";
        }

        Sort sort = sortDirection.equalsIgnoreCase("ASC")
                ?Sort.by(sortBy).ascending():Sort.by(sortBy).descending();
        return PageRequest.of(page, size, sort);
    }

    private String normalizeSearchTerm(String searchTerm) {
        if (searchTerm == null || searchTerm.isBlank()) {
            return null;
        }
        return searchTerm.trim();
    }

    private  PageResponse<BookDTO> convertToPageResponse(Page<Book> books) {
        List<BookDTO> bookDTOS = books.getContent()
                .stream()
                .map(bookMapper::toDTO)
                .collect(Collectors.toList());

        return new PageResponse<>(bookDTOS,
                books.getNumber(),
                books.getSize(),
                books.getTotalElements(),
                books.getTotalPages(),
                books.isLast(),
                books.isFirst(),
                books.isEmpty());

    }

    private void validateAvailableCopies(Book book) throws BookException {
        if (!book.isAvailableCopiesValid()) {
            throw new BookException("Số bản có sẵn không được vượt quá tổng số bản");
        }
    }
}
