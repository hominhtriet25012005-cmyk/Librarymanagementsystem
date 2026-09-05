package com.zosh.librarymanagementsystem.modal;

import jakarta.persistence.*;
import jakarta.validation.constraints.AssertTrue;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "books")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Book {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String isbn;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String author;

    @JoinColumn(nullable = false)
    @ManyToOne
    private Genre genre;

    private String publisher;

    private LocalDate publishedDate;

    public String language;

    private Integer pages;

    @Column(length = 2000)
    private String description;

    @Column(nullable = false)
    private Integer totalCopies;

    @Column(nullable = false)
    private Integer availableCopies;

    private BigDecimal price;

    @Column(length = 500)
    private String coverImageUrl;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active=true;


    @CreationTimestamp
    @Column(nullable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @AssertTrue(message = "Available copies cannot exceed total copies")
    public boolean isAvailableCopiesValid() {
        if (totalCopies==null || availableCopies==null) {
            return true;
        }
        return availableCopies<=totalCopies;

    }
}
