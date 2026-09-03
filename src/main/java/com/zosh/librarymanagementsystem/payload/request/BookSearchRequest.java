package com.zosh.librarymanagementsystem.payload.request;

import com.zosh.librarymanagementsystem.modal.Book;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BookSearchRequest {
    private String searchTerm;
    private Long genreId;
    private Book availableOnly;
    private Integer page=0;
    private Integer size=20;
    private String sortBy="createdAt";
    private String sortDirection="DESC";
}
