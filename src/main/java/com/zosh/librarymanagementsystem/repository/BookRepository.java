package com.zosh.librarymanagementsystem.repository;

import com.zosh.librarymanagementsystem.modal.Book;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import javax.swing.text.html.Option;
import java.util.Optional;

public interface BookRepository extends JpaRepository<Book, Long> {

    Optional<Book> findByIsbn(String isbn);

    boolean existsByIsbn(String isbn);

    @Query("select b from Book b where " +
            ":searchTerm is null OR " +
            "lower(b.title) like lower(concat ('%', :searchTerm, '%'))" +
            "lower(b.author) like lower(concat ('%', :searchTerm, '%'))" +
            "lower(b.title) like lower(concat ('%', :searchTerm, '%'))" +
            "(:genreId is null or b.genre.id=:genreId) AND " +
            "(:availableOnly == false Or b.availableCopies>0 ) AND " +
             "b.active=true"

    )
    Page<Book> searchBooksWithFilters(
            @Param("searchTerm") String searchTerm,
            @Param("genreId") Long genreId,
            @Param("availableOnly") boolean availableOnly,
            Pageable pageable
    );

    long countByActiveTrue();

    @Query("select count(b) from Book b where b.availableCopies>0 and b.active=true ")
    long countAvailableBooks();
}
