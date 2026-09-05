package com.zosh.librarymanagementsystem.service;

import com.zosh.librarymanagementsystem.domain.UserRole;
import com.zosh.librarymanagementsystem.exception.SubscriptionException;
import com.zosh.librarymanagementsystem.mapper.SubscriptionMapper;
import com.zosh.librarymanagementsystem.modal.Subscription;
import com.zosh.librarymanagementsystem.modal.SubscriptionPlan;
import com.zosh.librarymanagementsystem.modal.User;
import com.zosh.librarymanagementsystem.payload.dto.SubscriptionDTO;
import com.zosh.librarymanagementsystem.repository.SubscriptionPlanRepository;
import com.zosh.librarymanagementsystem.repository.SubscriptionRepository;
import com.zosh.librarymanagementsystem.service.impl.SubscriptionImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SubscriptionServiceImplTest {

    @Mock private SubscriptionRepository subscriptionRepository;
    @Mock private SubscriptionPlanRepository subscriptionPlanRepository;
    @Mock private SubscriptionMapper subscriptionMapper;
    @Mock private UserService userService;

    @InjectMocks
    private SubscriptionImpl subscriptionService;

    @Test
    void dangKyGoiTaoBanGhiChoThanhToan() {
        User user = User.builder().id(1L).role(UserRole.ROLE_USER).build();
        SubscriptionPlan plan = SubscriptionPlan.builder()
                .id(2L).planCode("BASIC").name("Cơ bản")
                .durationDays(30).price(50000L).currency("VND")
                .maxBooksAllowed(3).maxDaysPerBook(14).isActive(true).build();
        SubscriptionDTO request = new SubscriptionDTO();
        request.setPlanId(2L);
        Subscription entity = Subscription.builder().user(user).plan(plan).build();
        SubscriptionDTO mapped = new SubscriptionDTO();
        mapped.setId(20L);

        when(userService.getCurrentUser()).thenReturn(user);
        when(subscriptionPlanRepository.findById(2L)).thenReturn(Optional.of(plan));
        when(subscriptionRepository.findActiveSubscriptionByUserId(eq(1L), any(LocalDate.class)))
                .thenReturn(Optional.empty());
        when(subscriptionMapper.toEntity(request, plan, user)).thenReturn(entity);
        when(subscriptionRepository.save(entity)).thenReturn(entity);
        when(subscriptionMapper.toDTO(entity)).thenReturn(mapped);

        SubscriptionDTO result = subscriptionService.subscribe(request);

        assertEquals(20L, result.getId());
        assertFalse(entity.getIsActive());
        assertNotNull(entity.getStartDate());
        assertNotNull(entity.getEndDate());
    }

    @Test
    void khongChoDangKyGoiDaNgungHoatDong() {
        User user = User.builder().id(1L).build();
        SubscriptionPlan plan = SubscriptionPlan.builder().id(2L).isActive(false).build();
        SubscriptionDTO request = new SubscriptionDTO();
        request.setPlanId(2L);
        when(userService.getCurrentUser()).thenReturn(user);
        when(subscriptionPlanRepository.findById(2L)).thenReturn(Optional.of(plan));

        assertThrows(SubscriptionException.class,
                () -> subscriptionService.subscribe(request));
        verify(subscriptionRepository, never()).save(any());
    }

    @Test
    void nguoiDungKhongDuocHuyGoiCuaNguoiKhac() {
        User owner = User.builder().id(1L).build();
        User currentUser = User.builder().id(2L).role(UserRole.ROLE_USER).build();
        Subscription subscription = Subscription.builder()
                .id(30L).user(owner).isActive(true).build();
        when(subscriptionRepository.findById(30L)).thenReturn(Optional.of(subscription));
        when(userService.getCurrentUser()).thenReturn(currentUser);

        SubscriptionException error = assertThrows(SubscriptionException.class,
                () -> subscriptionService.cancelSubscription(30L, null));

        assertTrue(error.getMessage().contains("người dùng khác"));
        verify(subscriptionRepository, never()).save(any());
    }
}
