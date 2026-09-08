package com.zosh.librarymanagementsystem.service;

import com.zosh.librarymanagementsystem.modal.Genre;
import com.zosh.librarymanagementsystem.payload.dto.GenreDTO;

import java.util.List;

public interface GenreService {

    GenreDTO createGenre(GenreDTO genre);

    List<GenreDTO> getAllGenre();

    GenreDTO getGenreById(Long genreId);

    GenreDTO updateGenre(Long genreId, GenreDTO genre);

    void deleteGenre(Long genreId);

    void hardDeleteGenre(Long genreId);

    List<GenreDTO> getAllActiveGenresWithSubGenres();

    List<GenreDTO> getTopLevelGenres();

    long getTotalActiveGenres();

    long getBookCountByGenre(Long genreId);


}
