package com.zosh.librarymanagementsystem.repository;

import com.zosh.librarymanagementsystem.modal.Genre;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface GenreRepository extends JpaRepository<Genre, Long> {

    List<Genre>findByActiveTrueOrderByDisplayOrderAsc();

    List<Genre>findByParentGenreIsNullAndActiveTrueOrderByDisplayOrderAsc();

    List<Genre>findByParentGenreIdAndActiveTrueOrderByDisplayOrderAsc(
            Long parentGenreId
    );

    long countByActiveTrue();

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, Long id);

}
