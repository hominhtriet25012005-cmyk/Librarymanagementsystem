package com.zosh.librarymanagementsystem.modal;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "genres")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Genre {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Genre Code is Mandatory")
    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @NotBlank(message = "genre name is mandatory")
    private String name;

    @Size(max = 500,message = "description must not exceed 500 characters")
    private String description;

    @Min(value = 0, message = "display order cannot be negative")
    @Builder.Default
    private Integer displayOrder=0;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active=true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_genre_id")
    private Genre parentGenre;

    @OneToMany(mappedBy = "parentGenre")
    @Builder.Default
    private List<Genre> subGenres=new ArrayList<>();

//    @OneToMany(mappedBy = "genre", cascade = CascadeType.PERSIST)
//    private List<Book> books=new ArrayList<Book>();

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

}
