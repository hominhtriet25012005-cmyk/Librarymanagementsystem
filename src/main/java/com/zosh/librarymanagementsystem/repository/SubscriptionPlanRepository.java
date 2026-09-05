package com.zosh.librarymanagementsystem.repository;

import com.zosh.librarymanagementsystem.modal.SubscriptionPlan;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubscriptionPlanRepository extends JpaRepository<SubscriptionPlan, Long> {

    Boolean existsByPlanCode(String planCode);
}
