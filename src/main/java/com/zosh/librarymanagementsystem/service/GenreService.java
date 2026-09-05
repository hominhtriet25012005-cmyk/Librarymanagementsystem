package com.zosh.librarymanagementsystem.service;

import com.zosh.librarymanagementsystem.exception.GenreException;
import com.zosh.librarymanagementsystem.modal.Genre;
import com.zosh.librarymanagementsystem.payload.dto.GenreDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface GenreService {

    GenreDTO createGenre(GenreDTO genre);

    List<GenreDTO> getAllGenre();

    GenreDTO getGenreById(Long genreId) throws GenreException;

    GenreDTO updateGenre(Long genreId, GenreDTO genre) throws GenreException;

    void deleteGenre(Long genreId) throws GenreException;

    void hardDeleteGenre(Long genreId) throws GenreException;

    List<GenreDTO> getAllActiveGenresWithSubGenres();

    List<GenreDTO> getTopLevelGenres();

 //   Page<GenreDTO> searchGenres(String searchTerm, Pageable pageable);

    long getTotalActiveGenres();

    long getBookCountByGenre(Long genreId);


}
