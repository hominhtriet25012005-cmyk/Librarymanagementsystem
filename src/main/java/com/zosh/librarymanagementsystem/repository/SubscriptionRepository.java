package com.zosh.librarymanagementsystem.repository;

import com.zosh.librarymanagementsystem.modal.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    @Query("select s from Subscription s where s.user.id = :userId " +
            "and s.isActive = true and s.startDate <= :today and s.endDate >= :today")
    Optional<Subscription> findActiveSubscriptionByUserId(
            @Param("userId")Long userId,
            @Param("today")LocalDate today
            );

    @Query("select s from Subscription s where s.isActive = true and s.endDate < :today")
    List<Subscription> findExpiredActiveSubscriptions(
            @Param("today") LocalDate today
    );

    Page<Subscription> findByUserId(Long userId, Pageable pageable);

    @Query("""
            select s from Subscription s
            where s.user.id = :userId
              and s.isActive = false
              and s.cancelledAt is null
              and s.endDate >= :today
            order by s.createdAt desc
            """)
    List<Subscription> findPendingSubscriptionsByUserId(
            @Param("userId") Long userId,
            @Param("today") LocalDate today,
            Pageable pageable);

    @Query("""
            select s from Subscription s
            where (:searchTerm is null
                or lower(s.user.fullName) like lower(concat('%', :searchTerm, '%'))
                or lower(s.user.email) like lower(concat('%', :searchTerm, '%'))
                or lower(s.planName) like lower(concat('%', :searchTerm, '%'))
                or lower(s.planCode) like lower(concat('%', :searchTerm, '%')))
              and (:planId is null or s.plan.id = :planId)
              and (:status is null
                or (:status = 'ACTIVE' and s.isActive = true and s.startDate <= :today and s.endDate >= :today)
                or (:status = 'PENDING' and s.isActive = false and s.cancelledAt is null and s.endDate >= :today)
                or (:status = 'EXPIRED' and s.endDate < :today)
                or (:status = 'CANCELLED' and s.cancelledAt is not null))
            """)
    Page<Subscription> searchSubscriptions(
            @Param("searchTerm") String searchTerm,
            @Param("planId") Long planId,
            @Param("status") String status,
            @Param("today") LocalDate today,
            Pageable pageable);

    @Query("select count(s) from Subscription s where s.isActive = true and s.startDate <= :today and s.endDate >= :today")
    long countActive(@Param("today") LocalDate today);

    @Query("select count(s) from Subscription s where s.isActive = false and s.cancelledAt is null and s.endDate >= :today")
    long countPending(@Param("today") LocalDate today);

    @Query("select count(s) from Subscription s where s.endDate < :today")
    long countExpired(@Param("today") LocalDate today);

    long countByCancelledAtIsNotNull();
}
