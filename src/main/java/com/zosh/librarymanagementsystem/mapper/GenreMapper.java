package com.zosh.librarymanagementsystem.mapper;

import com.zosh.librarymanagementsystem.modal.Genre;
import com.zosh.librarymanagementsystem.payload.dto.GenreDTO;
import com.zosh.librarymanagementsystem.repository.GenreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collector;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class GenreMapper {

    private final GenreRepository genreRepository;

    public GenreDTO toDTO(Genre savedGenre) {
        if (savedGenre == null) {
            return null;
        }
        GenreDTO dto = GenreDTO.builder()
                .id(savedGenre.getId())
                .code(savedGenre.getCode())
                .name(savedGenre.getName())
                .description(savedGenre.getDescription())
                .displayOrder(savedGenre.getDisplayOrder())
                .active(savedGenre.getActive())
                .createdAt(savedGenre.getCreatedAT())
                .updatedAt(savedGenre.getUpdatedAT())
                .build();

        if (savedGenre.getParentGenre()!=null) {
            dto.setParentGenreId(savedGenre.getParentGenre().getId());
            dto.setParentGenreName(savedGenre.getParentGenre().getName());
        }

        if (savedGenre.getSubGenres()!=null && !savedGenre.getSubGenres().isEmpty()) {
            dto.setSubGenre(savedGenre.getSubGenres().stream()
                    .filter(subGenre -> subGenre.getActive())
                    .map(subGenre ->toDTO(subGenre)).collect(Collectors.toList()));

        }

//        dto.setBookCount((long) (savedGenre.getB));

        return dto;
    }

    public Genre toEntity(GenreDTO genreDTO) {
        if (genreDTO == null) {
            return null;
        }

        Genre genre = Genre.builder()
                .code(genreDTO.getCode())
                .name(genreDTO.getName())
                .description(genreDTO.getDescription())
                .displayOrder(genreDTO.getDisplayOrder())
                .active(true)

                .build();

        if (genreDTO.getParentGenreId() != null) {
            genreRepository.findById(genreDTO.getParentGenreId())
                    .ifPresent(genre::setParentGenre);
        }

        return null;
    }

    public void updateEntityFromDTO(GenreDTO dto, Genre existingGenre) {
        if (dto == null || existingGenre == null) {
            return;
        }

        existingGenre.setCode(dto.getCode());
        existingGenre.setName(dto.getName());
        existingGenre.setDescription(dto.getDescription());
        existingGenre.getDisplayOrder(dto.getDisplayOrder() != null ? dto.getDisplayOrder() : 0);
        if (dto.getActive()!=null) {
            existingGenre.setActive(dto.getActive());
        }
        if (dto.getParentGenreId()!=null) {
            genreRepository.findById(dto.getParentGenreId())
                    .ifPresent(existingGenre::setParentGenre);
        }
    }

    public List<GenreDTO> toDTOList(List<Genre> genreList) {
        return genreList.stream().map(genre -> toDTO(genre)).collect(Collectors.toList());
    }
}
