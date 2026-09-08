package com.zosh.librarymanagementsystem.service.impl;

import com.zosh.librarymanagementsystem.exception.GenreException;
import com.zosh.librarymanagementsystem.mapper.GenreMapper;
import com.zosh.librarymanagementsystem.modal.Genre;
import com.zosh.librarymanagementsystem.payload.dto.GenreDTO;
import com.zosh.librarymanagementsystem.repository.GenreRepository;
import com.zosh.librarymanagementsystem.repository.BookRepository;
import com.zosh.librarymanagementsystem.service.GenreService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GenreServiceImpl implements GenreService {

    private final GenreRepository genreRepository;
    private final GenreMapper genreMapper;
    private final BookRepository bookRepository;

    @Override
    @Transactional
    public GenreDTO createGenre(GenreDTO genreDTO) {
        if (genreRepository.existsByCode(genreDTO.getCode())) {
            throw new GenreException(
                    "Mã thể loại " + genreDTO.getCode() + " đã tồn tại"
            );
        }

        Genre genre = genreMapper.toEntity(genreDTO);
        Genre savedGenre = genreRepository.save(genre);

        return genreMapper.toDTO(savedGenre);
    }

    @Override
    @Transactional(readOnly = true)
    public List<GenreDTO> getAllGenre() {
        return genreRepository.findAll()
                .stream()
                .map(genreMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public GenreDTO getGenreById(Long genreId) throws GenreException {
        Genre genre = genreRepository.findById(genreId)
                .orElseThrow(() ->
                        new GenreException("Không tìm thấy thể loại")
                );

        return genreMapper.toDTO(genre);
    }

    @Override
    @Transactional
    public GenreDTO updateGenre(Long genreId, GenreDTO genreDTO)
            throws GenreException {

        Genre existingGenre = genreRepository.findById(genreId)
                .orElseThrow(() ->
                        new GenreException("Không tìm thấy thể loại")
                );

        if (genreRepository.existsByCodeAndIdNot(
                genreDTO.getCode(),
                genreId
        )) {
            throw new GenreException(
                    "Mã thể loại " + genreDTO.getCode() + " đã tồn tại"
            );
        }

        if (genreId.equals(genreDTO.getParentGenreId())) {
            throw new GenreException(
                    "Một thể loại không thể là thể loại cha của chính nó"
            );
        }

        genreMapper.updateEntityFromDTO(
                genreDTO,
                existingGenre
        );

        Genre updateGenre =
                genreRepository.save(existingGenre);

        return genreMapper.toDTO(updateGenre);
    }

    @Override
    @Transactional
    public void deleteGenre(Long genreId)
            throws GenreException {

        Genre existingGenre =
                genreRepository.findById(genreId)
                        .orElseThrow(() ->
                                new GenreException(
                                        "Không tìm thấy thể loại"
                                )
                        );

        existingGenre.setActive(false);
        genreRepository.save(existingGenre);
    }

    @Override
    @Transactional
    public void hardDeleteGenre(Long genreId)
            throws GenreException {

        Genre existingGenre =
                genreRepository.findById(genreId)
                        .orElseThrow(() ->
                                new GenreException(
                                        "Không tìm thấy thể loại"
                                )
                        );

        genreRepository.delete(existingGenre);
    }

    @Override
    @Transactional(readOnly = true)
    public List<GenreDTO> getAllActiveGenresWithSubGenres() {

        List<Genre> topLevelGenres =
                genreRepository
                        .findByParentGenreIsNullAndActiveTrueOrderByDisplayOrderAsc();

        return genreMapper.toDTOList(topLevelGenres);
    }

    @Override
    @Transactional(readOnly = true)
    public List<GenreDTO> getTopLevelGenres() {

        List<Genre> topLevelGenres =
                genreRepository
                        .findByParentGenreIsNullAndActiveTrueOrderByDisplayOrderAsc();

        return genreMapper.toDTOList(topLevelGenres);
    }

    @Override
    @Transactional(readOnly = true)
    public long getTotalActiveGenres() {
        return genreRepository.countByActiveTrue();
    }

    @Override
    @Transactional(readOnly = true)
    public long getBookCountByGenre(Long genreId) {
        return bookRepository
                .countByGenreIdAndActiveTrue(genreId);
    }
}