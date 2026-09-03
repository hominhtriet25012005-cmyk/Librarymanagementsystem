package com.zosh.librarymanagementsystem.modal;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.awt.print.Book;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Genre {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @NotBlank(message = "Genre Code is Mandatory")
    private String code;

    @NotBlank(message = "genre name is mandatory")
    private String name;

    @Size(max = 500,message = "description must not exceed 500 characters")
    private String description;

    @Min(value = 0, message = "display order cannot be negative")
    private Integer displayOrder=0;

    @Column(nullable = false)
    private Boolean active=true;

    @ManyToOne
    private Genre parentGenre;

    @OneToMany
    private List<Genre> subGenres=new ArrayList<Genre>();

//    @OneToMany(mappedBy = "genre", cascade = CascadeType.PERSIST)
//    private List<Book> books=new ArrayList<Book>();

    @CreationTimestamp
    private LocalDateTime createdAT;

    @UpdateTimestamp
    private LocalDateTime updatedAT;

    public void getDisplayOrder(@Min(value = 0, message = "display order cannot be negative") Integer displayOrder) {
    }
}
