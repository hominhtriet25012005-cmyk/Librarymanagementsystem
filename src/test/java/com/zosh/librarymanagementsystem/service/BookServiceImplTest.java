package com.zosh.librarymanagementsystem.service;

import com.zosh.librarymanagementsystem.exception.BookException;
import com.zosh.librarymanagementsystem.mapper.BookMapper;
import com.zosh.librarymanagementsystem.modal.Book;
import com.zosh.librarymanagementsystem.payload.dto.BookDTO;
import com.zosh.librarymanagementsystem.payload.request.BookSearchRequest;
import com.zosh.librarymanagementsystem.repository.BookRepository;
import com.zosh.librarymanagementsystem.service.impl.BookServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookServiceImplTest {

    @Mock
    private BookRepository bookRepository;

    @Mock
    private BookMapper bookMapper;

    @InjectMocks
    private BookServiceImpl bookService;

    @Test
    void taoSachThanhCongKhiDuLieuHopLe() throws BookException {
        BookDTO request = BookDTO.builder()
                .isbn("978-604-1")
                .title("Dế Mèn phiêu lưu ký")
                .author("Tô Hoài")
                .genreId(1L)
                .totalCopies(10)
                .availableCopies(8)
                .build();
        Book entity = Book.builder().isbn(request.getIsbn()).totalCopies(10)
                .availableCopies(8).active(true).build();
        BookDTO response = BookDTO.builder().id(11L).isbn(request.getIsbn()).build();

        when(bookRepository.existsByIsbn(request.getIsbn())).thenReturn(false);
        when(bookMapper.toEntity(request)).thenReturn(entity);
        when(bookRepository.save(entity)).thenReturn(entity);
        when(bookMapper.toDTO(entity)).thenReturn(response);

        BookDTO result = bookService.createBook(request);

        assertEquals(11L, result.getId());
        verify(bookRepository).save(entity);
    }

    @Test
    void khongChoTaoSachTrungIsbn() {
        BookDTO request = BookDTO.builder().isbn("978-604-1").build();
        when(bookRepository.existsByIsbn(request.getIsbn())).thenReturn(true);

        BookException error = assertThrows(BookException.class,
                () -> bookService.createBook(request));

        assertTrue(error.getMessage().contains("đã tồn tại"));
        verify(bookRepository, never()).save(any());
    }

    @Test
    void khongChoSoBanCoSanVuotTongSoBan() throws BookException {
        BookDTO request = BookDTO.builder().isbn("978-604-2").build();
        Book invalidBook = Book.builder().totalCopies(2).availableCopies(3).build();
        when(bookMapper.toEntity(request)).thenReturn(invalidBook);

        BookException error = assertThrows(BookException.class,
                () -> bookService.createBook(request));

        assertTrue(error.getMessage().contains("không được vượt quá"));
        verify(bookRepository, never()).save(any());
    }

    @Test
    void timKiemTuGanGiaTriMacDinhKhiThamSoBiNull() {
        BookSearchRequest request = new BookSearchRequest();
        request.setSearchTerm("  java  ");
        request.setPage(null);
        request.setSize(null);
        request.setSortBy(null);
        request.setSortDirection(null);
        when(bookRepository.searchBooksWithFilters(anyString(), isNull(), eq(false),
                eq(true), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        bookService.searchBooksWithFilters(request);

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(bookRepository).searchBooksWithFilters(eq("java"), isNull(), eq(false),
                eq(true), pageableCaptor.capture());
        Pageable pageable = pageableCaptor.getValue();
        assertEquals(0, pageable.getPageNumber());
        assertEquals(20, pageable.getPageSize());
        assertEquals("createdAt: DESC", pageable.getSort().toString());
    }
}
