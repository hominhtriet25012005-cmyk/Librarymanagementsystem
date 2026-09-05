package com.zosh.librarymanagementsystem.service;

import com.zosh.librarymanagementsystem.payload.dto.SubscriptionPlanDTO;

import java.util.List;

public interface SubscriptionPlanService {

    SubscriptionPlanDTO createSubscriptionPlan(SubscriptionPlanDTO planDTO);


    SubscriptionPlanDTO updateSubscriptionPlan(Long planId, SubscriptionPlanDTO planDTO);

    void deleteSubscriptionPlan(Long planId);

    List<SubscriptionPlanDTO> getAllSubscriptionPlan();


}
