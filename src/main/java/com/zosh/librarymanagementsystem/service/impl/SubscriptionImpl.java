package com.zosh.librarymanagementsystem.service.impl;

import com.zosh.librarymanagementsystem.exception.SubscriptionException;
import com.zosh.librarymanagementsystem.mapper.SubscriptionMapper;
import com.zosh.librarymanagementsystem.modal.Subscription;
import com.zosh.librarymanagementsystem.modal.SubscriptionPlan;
import com.zosh.librarymanagementsystem.payload.dto.SubscriptionDTO;
import com.zosh.librarymanagementsystem.repository.SubscriptionRepository;
import com.zosh.librarymanagementsystem.repository.SubscriptionPlanRepository;
import com.zosh.librarymanagementsystem.service.SubscriptionService;
import com.zosh.librarymanagementsystem.service.UserService;
import com.zosh.librarymanagementsystem.domain.UserRole;
import lombok.RequiredArgsConstructor;
import com.zosh.librarymanagementsystem.modal.User;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SubscriptionImpl implements SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final SubscriptionMapper subscriptionMapper;
    private final UserService userService;

    @Override
    public SubscriptionDTO subscribe(SubscriptionDTO subscriptionDTO) throws Exception {
        User user = userService.getCurrentUser();

        SubscriptionPlan plan = subscriptionPlanRepository
                .findById(subscriptionDTO.getPlanId()).orElseThrow(
                        () -> new SubscriptionException("Subscription plan not found")
                );

        if (!Boolean.TRUE.equals(plan.getIsActive())) {
            throw new SubscriptionException("Subscription plan is inactive");
        }

        subscriptionRepository.findActiveSubscriptionByUserId(user.getId(), LocalDate.now())
                .ifPresent(active -> {
                    throw new SubscriptionException("User already has an active subscription");
                });

//  Optional<Sub>

        Subscription subscription = subscriptionMapper.toEntity(subscriptionDTO, plan, user);
        subscription.initializeFromPlan();
        subscription.setIsActive(false);
        Subscription saveSubscription = subscriptionRepository.save(subscription);

//  create payment (todo)
        return subscriptionMapper.toDTO(saveSubscription);
    }

    @Override
    public SubscriptionDTO getUsersActiveSubscription() {
        Long resolvedUserId = userService.getCurrentUser().getId();
        Subscription subscription = subscriptionRepository
                .findActiveSubscriptionByUserId(resolvedUserId, LocalDate.now())
                .orElseThrow(() -> new SubscriptionException("no active subscription found!"));
        return subscriptionMapper.toDTO(subscription);
    }

    @Override
    public SubscriptionDTO cancelSubscription(Long subscriptionId, String reason) {
        Subscription subscription = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new SubscriptionException(
                        "Subscription not found with ID: " + subscriptionId));

        User currentUser = userService.getCurrentUser();
        boolean isAdmin = currentUser.getRole() == UserRole.ROLE_ADMIN;
        if (!isAdmin && !subscription.getUser().getId().equals(currentUser.getId())) {
            throw new SubscriptionException("You cannot cancel another user's subscription");
        }

        if (!Boolean.TRUE.equals(subscription.getIsActive())) {
            throw new SubscriptionException("Subscription is already inactive");
        }

        // Mark as cancelled
        subscription.setIsActive(false);
        subscription.setCancelledAt(LocalDateTime.now());
        subscription.setCancellationReason(reason != null ? reason : "Cancelled by user");

        subscription = subscriptionRepository.save(subscription);

        return subscriptionMapper.toDTO(subscription);
    }

    @Override
    public SubscriptionDTO activateSubscription(Long subscriptionId, Long paymentId) {

        Subscription subscription = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(
                        () -> new SubscriptionException("subscription not found by id")
                );

        // verify payment (todo)

        subscription.setIsActive(true);
        subscription.setStartDate(LocalDate.now());
        subscription.calculateEndDate();
        subscription = subscriptionRepository.save(subscription);
        return subscriptionMapper.toDTO(subscription);
    }

    @Override
    public List<SubscriptionDTO> getAllSubscriptions(Pageable pageable) {
        List<Subscription> subscriptions = subscriptionRepository.findAll(pageable).getContent();
        return subscriptionMapper.toDTOList(subscriptions);
    }

    @Override
    public void deactivateExpiredSubscriptions() throws Exception {
        List<Subscription> expiredSubscriptions = subscriptionRepository
                .findExpiredActiveSubscriptions(LocalDate.now());

        for (Subscription subscription : expiredSubscriptions) {
            subscription.setIsActive(false);
        }
        subscriptionRepository.saveAll(expiredSubscriptions);

    }
}
