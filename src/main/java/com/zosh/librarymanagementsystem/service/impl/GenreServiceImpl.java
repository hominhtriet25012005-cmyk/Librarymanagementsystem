package com.zosh.librarymanagementsystem.service.impl;

import com.zosh.librarymanagementsystem.exception.GenreException;
import com.zosh.librarymanagementsystem.mapper.GenreMapper;
import com.zosh.librarymanagementsystem.modal.Genre;
import com.zosh.librarymanagementsystem.payload.dto.GenreDTO;
import com.zosh.librarymanagementsystem.repository.GenreRepository;
import com.zosh.librarymanagementsystem.service.GenreService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GenreServiceImpl implements GenreService {


    private final GenreRepository genreRepository;
    private final GenreMapper genreMapper;

    @Override
    public GenreDTO createGenre(GenreDTO genreDTO) {

        Genre genre= genreMapper.toEntity(genreDTO);
        Genre savedGenre = genreRepository.save(genre);

        return genreMapper.toDTO(savedGenre);
    }

    @Override
    public List<GenreDTO> getAllGenre() {
        return genreRepository.findAll().stream()
                .map(genreMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public GenreDTO getGenreById(Long genreId) throws GenreException {
        Genre genre= genreRepository.findById(genreId).orElseThrow(
                () -> new GenreException("genre not found")
        );
        return genreMapper.toDTO(genre);
    }

    @Override
    public GenreDTO upGenreDto(Long genreId, GenreDTO genreDTO) throws GenreException {
        Genre existingGenre= genreRepository.findById(genreId).orElseThrow(
                () -> new GenreException("genre not found")
        );

        genreMapper.updateEntityFromDTO(genreDTO, existingGenre);

        Genre updateGenre = genreRepository.save(existingGenre);

        return genreMapper.toDTO(updateGenre);
    }

    @Override
    public void deleteGenre(Long genreId) throws GenreException {
        Genre existingGenre= genreRepository.findById(genreId).orElseThrow(
                () -> new GenreException("genre not found")
        );
        existingGenre.setActive(false);
        genreRepository.save(existingGenre);
    }

    @Override
    public void hardDeleteGenre(Long genreId) throws GenreException {
        Genre existingGenre= genreRepository.findById(genreId).orElseThrow(
                () -> new GenreException("genre not found")
        );
        genreRepository.delete(existingGenre);
    }

    @Override
    public List<GenreDTO> getAllActiveGenresWithSubGenres() {
        List<Genre>topLevelGenres=genreRepository
                .findByParentGenreIsNullAndActiveTrueOrderByDisplayOrderAsc();
        return genreMapper.toDTOList(topLevelGenres);
    }

    @Override
    public List<GenreDTO> getTopLevelGenres() {
        List<Genre>topLevelGenres=genreRepository
                .findByParentGenreIsNullAndActiveTrueOrderByDisplayOrderAsc();
        return genreMapper.toDTOList(topLevelGenres);
    }

    @Override
    public long getTotalActiveGenres() {
        return genreRepository.countByActiveTrue();
    }

    @Override
    public long getBookCountByGenre(Long genreId) {
        return 0;
    }

}
