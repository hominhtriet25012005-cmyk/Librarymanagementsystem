package com.zosh.librarymanagementsystem.repository;

import com.zosh.librarymanagementsystem.domain.UserRole;
import com.zosh.librarymanagementsystem.modal.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Long> {

    User findByEmail(String email);

    long countByRole(UserRole role);

    long countByVerifiedTrue();

    @Query("""
            SELECT u FROM User u
            WHERE (:searchTerm IS NULL
                OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :searchTerm, '%'))
                OR LOWER(u.email) LIKE LOWER(CONCAT('%', :searchTerm, '%'))
                OR LOWER(COALESCE(u.phone, '')) LIKE LOWER(CONCAT('%', :searchTerm, '%')))
              AND (:role IS NULL OR u.role = :role)
              AND (:verified IS NULL OR u.verified = :verified)
            """)
    Page<User> searchUsers(@Param("searchTerm") String searchTerm,
                           @Param("role") UserRole role,
                           @Param("verified") Boolean verified,
                           Pageable pageable);

}
