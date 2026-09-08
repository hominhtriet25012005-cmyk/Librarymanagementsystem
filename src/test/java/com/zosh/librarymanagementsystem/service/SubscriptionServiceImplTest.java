package com.zosh.librarymanagementsystem.service;

import com.zosh.librarymanagementsystem.domain.PaymentGateway;
import com.zosh.librarymanagementsystem.domain.PaymentStatus;
import com.zosh.librarymanagementsystem.domain.PaymentType;
import com.zosh.librarymanagementsystem.domain.UserRole;
import com.zosh.librarymanagementsystem.exception.SubscriptionException;
import com.zosh.librarymanagementsystem.mapper.SubscriptionMapper;
import com.zosh.librarymanagementsystem.modal.Subscription;
import com.zosh.librarymanagementsystem.modal.SubscriptionPlan;
import com.zosh.librarymanagementsystem.modal.Payment;
import com.zosh.librarymanagementsystem.modal.User;
import com.zosh.librarymanagementsystem.payload.dto.SubscriptionDTO;
import com.zosh.librarymanagementsystem.payload.request.PaymentInitiateRequest;
import com.zosh.librarymanagementsystem.payload.response.PaymentInitiateResponse;
import com.zosh.librarymanagementsystem.repository.SubscriptionPlanRepository;
import com.zosh.librarymanagementsystem.repository.SubscriptionRepository;
import com.zosh.librarymanagementsystem.repository.PaymentRepository;
import com.zosh.librarymanagementsystem.service.impl.SubscriptionImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.ArgumentCaptor;
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
    @Mock private PaymentService paymentService;
    @Mock private PaymentRepository paymentRepository;

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
        Subscription entity = Subscription.builder().id(20L).user(user).plan(plan).build();
        PaymentInitiateResponse paymentResponse = PaymentInitiateResponse.builder()
                .paymentId(30L).success(true).build();

        when(userService.getCurrentUser()).thenReturn(user);
        when(subscriptionPlanRepository.findById(2L)).thenReturn(Optional.of(plan));
        when(subscriptionRepository.findActiveSubscriptionByUserId(eq(1L), any(LocalDate.class)))
                .thenReturn(Optional.empty());
        when(subscriptionMapper.toEntity(request, plan, user)).thenReturn(entity);
        when(subscriptionRepository.save(entity)).thenReturn(entity);
        when(paymentService.initiatePayment(any(PaymentInitiateRequest.class)))
                .thenReturn(paymentResponse);

        PaymentInitiateResponse result = subscriptionService.subscribe(request);

        assertEquals(30L, result.getPaymentId());
        assertFalse(entity.getIsActive());
        assertNotNull(entity.getStartDate());
        assertNotNull(entity.getEndDate());

        ArgumentCaptor<PaymentInitiateRequest> requestCaptor =
                ArgumentCaptor.forClass(PaymentInitiateRequest.class);
        verify(paymentService).initiatePayment(requestCaptor.capture());
        PaymentInitiateRequest paymentRequest = requestCaptor.getValue();
        assertEquals(1L, paymentRequest.getUserId());
        assertEquals(20L, paymentRequest.getSubscriptionId());
        assertEquals(50000L, paymentRequest.getAmount());
        assertEquals(PaymentType.MEMBERSHIP, paymentRequest.getPaymentType());
        assertEquals(PaymentGateway.RAZORPAY, paymentRequest.getGateway());
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

    @Test
    void chiKichHoatGoiKhiThanhToanThanhCongVaDungDangKy() {
        Subscription subscription = Subscription.builder()
                .id(40L)
                .user(User.builder().id(1L).build())
                .plan(SubscriptionPlan.builder().durationDays(30).build())
                .startDate(LocalDate.now())
                .isActive(false)
                .build();
        Payment payment = Payment.builder()
                .id(50L)
                .subscription(subscription)
                .status(PaymentStatus.SUCCESS)
                .build();

        when(subscriptionRepository.findById(40L)).thenReturn(Optional.of(subscription));
        when(paymentRepository.findById(50L)).thenReturn(Optional.of(payment));
        when(subscriptionRepository.save(subscription)).thenReturn(subscription);
        when(subscriptionMapper.toDTO(subscription)).thenReturn(new SubscriptionDTO());

        subscriptionService.activateSubscription(40L, 50L);

        assertTrue(subscription.getIsActive());
        verify(subscriptionRepository).save(subscription);
    }
}
