package com.zosh.librarymanagementsystem.mapper;

import com.zosh.librarymanagementsystem.exception.SubscriptionException;
import com.zosh.librarymanagementsystem.modal.SubscriptionPlan;
import com.zosh.librarymanagementsystem.payload.dto.SubscriptionDTO;
import com.zosh.librarymanagementsystem.modal.Subscription;
import com.zosh.librarymanagementsystem.modal.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Component
public class SubscriptionMapper {

    /**
     * Convert Subscription entity to DTO
     */
    public SubscriptionDTO toDTO(Subscription subscription) {
        if (subscription == null) {
            return null;
        }

        SubscriptionDTO dto = new SubscriptionDTO();
        dto.setId(subscription.getId());

        // User information
        if (subscription.getUser() != null) {
            dto.setUserId(subscription.getUser().getId());
            dto.setUserName(subscription.getUser().getFullName());
            dto.setUserEmail(subscription.getUser().getEmail());
        }

        // Plan information
        if (subscription.getPlan() != null) {
            dto.setPlanId(subscription.getPlan().getId());
        }

        dto.setPlanName(subscription.getPlanName());
        dto.setPlanCode(subscription.getPlanCode());
        dto.setPrice(subscription.getPrice());
        dto.setCurrency(subscription.getCurrency());
        if (subscription.getPrice() != null) {
            dto.setPriceInMajorUnits(subscription.getPrice() / 100.0);
        }
        dto.setStartDate(subscription.getStartDate());
        dto.setEndDate(subscription.getEndDate());
        dto.setIsActive(subscription.getIsActive());
        dto.setMaxBooksAllowed(subscription.getMaxBooksAllowed());
        dto.setMaxDaysPerBook(subscription.getMaxDaysPerBook());
        dto.setAutoRenew(subscription.getAutoRenew());
        dto.setCancelledAt(subscription.getCancelledAt());
        dto.setCancellationReason(subscription.getCancellationReason());
        dto.setNotes(subscription.getNotes());
        dto.setDaysRemaining(subscription.getDaysRemaining());
        dto.setIsValid(subscription.isValid());
        dto.setIsExpired(subscription.isExpired());
        dto.setCreatedAt(subscription.getCreatedAt());
        dto.setUpdatedAt(subscription.getUpdatedAt());

        return dto;
    }

    /**
     * Convert DTO of subscriptions to entity
     */
    public Subscription toEntity(SubscriptionDTO dto,
                                 SubscriptionPlan plan,
                                 User user) throws SubscriptionException {
        if (dto==null) {
            return null;
    }

        Subscription subscription = new Subscription();
        subscription.setId(dto.getId());
        subscription.setUser(user);
        subscription.setPlan(plan);
        subscription.setNotes(dto.getNotes());
        subscription.setAutoRenew(Boolean.TRUE.equals(dto.getAutoRenew()));

        return  subscription;
    }

    /**
     * Convert list of subscriptions to DTOs
     */
    public List<SubscriptionDTO> toDTOList(List<Subscription> subscriptions) {
        if (subscriptions == null) {
            return null;
        }

        return subscriptions.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
}
