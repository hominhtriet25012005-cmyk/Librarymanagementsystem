package com.zosh.librarymanagementsystem.service.impl;

import com.zosh.librarymanagementsystem.mapper.SubscriptionPlanMapper;
import com.zosh.librarymanagementsystem.modal.SubscriptionPlan;
import com.zosh.librarymanagementsystem.modal.User;
import com.zosh.librarymanagementsystem.payload.dto.SubscriptionPlanDTO;
import com.zosh.librarymanagementsystem.repository.SubscriptionPlanRepository;
import com.zosh.librarymanagementsystem.service.SubscriptionPlanService;
import com.zosh.librarymanagementsystem.service.UserService;
import com.zosh.librarymanagementsystem.exception.SubscriptionException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubscriptionPlanServiceImpl implements SubscriptionPlanService {

    private final SubscriptionPlanRepository planRepository;
    private final SubscriptionPlanMapper planMapper;
    private final UserService userService;

    @Override
    public SubscriptionPlanDTO createSubscriptionPlan(SubscriptionPlanDTO planDTO) {

        if (planRepository.existsByPlanCode(planDTO.getPlanCode())) {
            throw new SubscriptionException("Mã gói thành viên đã tồn tại");
        }
        SubscriptionPlan plan =planMapper.toEntity(planDTO);

        User currentUser = userService.getCurrentUser();
        plan.setCreatedBy(currentUser.getFullName());
        plan.setUpdatedBy(currentUser.getFullName());
        SubscriptionPlan savedPlan =  planRepository.save(plan);
        return planMapper.toDTO(savedPlan);
    }

    @Override
    public SubscriptionPlanDTO updateSubscriptionPlan(Long planId, SubscriptionPlanDTO planDTO) {
        SubscriptionPlan existingPlan = planRepository.findById(planId).orElseThrow(
                () -> new SubscriptionException("Không tìm thấy gói thành viên")
        );
        planMapper.updateEntity(existingPlan, planDTO);
        User currentUser = userService.getCurrentUser();
        existingPlan.setUpdatedBy(currentUser.getFullName());
        SubscriptionPlan updatedPlan = planRepository.save(existingPlan);

        return planMapper.toDTO(updatedPlan);
    }

    @Override
    public void deleteSubscriptionPlan(Long planId) {
        SubscriptionPlan existingPlan = planRepository.findById(planId).orElseThrow(
                () -> new SubscriptionException("Không tìm thấy gói thành viên")
        );
        existingPlan.setIsActive(false);
        planRepository.save(existingPlan);
    }

    @Override
    public List<SubscriptionPlanDTO> getAllSubscriptionPlan() {

        List<SubscriptionPlan> planList = planRepository.findAll();

        return planList.stream().map(
                planMapper::toDTO
        ).collect(Collectors.toList());
    }

    @Override
    public SubscriptionPlan getBySubscriptionPlanCode(String subscriptionPlanCode) {
        return planRepository.findByPlanCode(subscriptionPlanCode)
                .orElseThrow(() -> new SubscriptionException(
                        "Không tìm thấy gói thành viên có mã " + subscriptionPlanCode));
    }
}
