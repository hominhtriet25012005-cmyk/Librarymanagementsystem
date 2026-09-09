package com.zosh.librarymanagementsystem.service;

import com.zosh.librarymanagementsystem.modal.SubscriptionPlan;
import com.zosh.librarymanagementsystem.payload.dto.SubscriptionPlanDTO;

import java.util.List;

public interface SubscriptionPlanService {

    SubscriptionPlanDTO createSubscriptionPlan(SubscriptionPlanDTO planDTO);


    SubscriptionPlanDTO updateSubscriptionPlan(Long planId, SubscriptionPlanDTO planDTO);

    void deleteSubscriptionPlan(Long planId);

    List<SubscriptionPlanDTO> getAllSubscriptionPlan();

    List<SubscriptionPlanDTO> getActiveSubscriptionPlans();

    SubscriptionPlan getBySubscriptionPlanCode(String subscriptionPlanCode);


}
