package com.zosh.librarymanagementsystem.repository;

import com.zosh.librarymanagementsystem.modal.SubscriptionPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SubscriptionPlanRepository extends JpaRepository<SubscriptionPlan, Long> {

    Boolean existsByPlanCode(String planCode);

    Optional<SubscriptionPlan> findByPlanCode(String planCode);
}
