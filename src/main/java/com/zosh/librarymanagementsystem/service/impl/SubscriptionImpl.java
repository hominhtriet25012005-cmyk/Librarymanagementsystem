package com.zosh.librarymanagementsystem.service.impl;

import com.zosh.librarymanagementsystem.domain.PaymentGateway;
import com.zosh.librarymanagementsystem.domain.PaymentStatus;
import com.zosh.librarymanagementsystem.domain.PaymentType;
import com.zosh.librarymanagementsystem.exception.SubscriptionException;
import com.zosh.librarymanagementsystem.mapper.SubscriptionMapper;
import com.zosh.librarymanagementsystem.modal.Subscription;
import com.zosh.librarymanagementsystem.modal.SubscriptionPlan;
import com.zosh.librarymanagementsystem.modal.Payment;
import com.zosh.librarymanagementsystem.payload.dto.SubscriptionDTO;
import com.zosh.librarymanagementsystem.payload.request.PaymentInitiateRequest;
import com.zosh.librarymanagementsystem.payload.response.PaymentInitiateResponse;
import com.zosh.librarymanagementsystem.repository.SubscriptionRepository;
import com.zosh.librarymanagementsystem.repository.SubscriptionPlanRepository;
import com.zosh.librarymanagementsystem.repository.PaymentRepository;
import com.zosh.librarymanagementsystem.service.PaymentService;
import com.zosh.librarymanagementsystem.service.SubscriptionService;
import com.zosh.librarymanagementsystem.service.UserService;
import com.zosh.librarymanagementsystem.domain.UserRole;
import lombok.RequiredArgsConstructor;
import com.zosh.librarymanagementsystem.modal.User;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    private final PaymentService paymentService;
    private final PaymentRepository paymentRepository;

    @Override
    @Transactional
    public PaymentInitiateResponse subscribe(SubscriptionDTO subscriptionDTO) {
        User user = userService.getCurrentUser();

        SubscriptionPlan plan = subscriptionPlanRepository
                .findById(subscriptionDTO.getPlanId()).orElseThrow(
                        () -> new SubscriptionException("Không tìm thấy gói thành viên")
                );

        if (!Boolean.TRUE.equals(plan.getIsActive())) {
            throw new SubscriptionException("Gói thành viên đang ngừng hoạt động");
        }

        subscriptionRepository.findActiveSubscriptionByUserId(user.getId(), LocalDate.now())
                .ifPresent(active -> {
                    throw new SubscriptionException("Người dùng đã có một gói thành viên đang hoạt động");
                });

        Subscription subscription = subscriptionMapper.toEntity(subscriptionDTO, plan, user);
        subscription.initializeFromPlan();
        subscription.setIsActive(false);
        Subscription saveSubscription = subscriptionRepository.save(subscription);

        // Tạo thanh toán; gói chỉ được kích hoạt sau khi Razorpay xác minh thành công.
        PaymentInitiateRequest paymentInitiateRequest = PaymentInitiateRequest
                    .builder()
                    .userId(user.getId())
                    .subscriptionId(saveSubscription.getId())
                    .paymentType(PaymentType.MEMBERSHIP)
                    .gateway(PaymentGateway.RAZORPAY)
                    .amount(saveSubscription.getPrice())
                    .currency(saveSubscription.getCurrency())
                    .description("Đăng ký thư viện - " + plan.getName())
                    .build();
        return paymentService.initiatePayment(paymentInitiateRequest);
    }

    @Override
    public SubscriptionDTO getUsersActiveSubscription() {
        Long resolvedUserId = userService.getCurrentUser().getId();
        return getUsersActiveSubscription(resolvedUserId);
    }

    @Override
    public SubscriptionDTO getUsersActiveSubscription(Long userId) {
        Subscription subscription = subscriptionRepository
                .findActiveSubscriptionByUserId(userId, LocalDate.now())
                .orElseThrow(() -> new SubscriptionException("Không tìm thấy gói thành viên đang hoạt động"));
        return subscriptionMapper.toDTO(subscription);
    }

    @Override
    public SubscriptionDTO cancelSubscription(Long subscriptionId, String reason) {
        Subscription subscription = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new SubscriptionException(
                        "Không tìm thấy đăng ký có ID " + subscriptionId));

        User currentUser = userService.getCurrentUser();
        boolean isAdmin = currentUser.getRole() == UserRole.ROLE_ADMIN;
        if (!isAdmin && !subscription.getUser().getId().equals(currentUser.getId())) {
            throw new SubscriptionException("Bạn không thể hủy gói thành viên của người dùng khác");
        }

        if (!Boolean.TRUE.equals(subscription.getIsActive())) {
            throw new SubscriptionException("Gói thành viên này đã ngừng hoạt động");
        }

        // Lưu trạng thái và lý do hủy để quản trị viên có thể tra cứu.
        subscription.setIsActive(false);
        subscription.setCancelledAt(LocalDateTime.now());
        subscription.setCancellationReason(
                reason != null && !reason.isBlank() ? reason.trim() : "Người dùng hủy");

        subscription = subscriptionRepository.save(subscription);

        return subscriptionMapper.toDTO(subscription);
    }

    @Override
    public SubscriptionDTO activateSubscription(Long subscriptionId, Long paymentId) {

        Subscription subscription = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(
                        () -> new SubscriptionException("Không tìm thấy đăng ký có ID " + subscriptionId)
                );

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new SubscriptionException("Không tìm thấy giao dịch thanh toán"));
        if (payment.getStatus() != PaymentStatus.SUCCESS
                || payment.getSubscription() == null
                || !payment.getSubscription().getId().equals(subscriptionId)) {
            throw new SubscriptionException(
                    "Giao dịch chưa thành công hoặc không thuộc đăng ký thành viên này");
        }
        subscriptionRepository.findActiveSubscriptionByUserId(
                        subscription.getUser().getId(), LocalDate.now())
                .filter(active -> !active.getId().equals(subscriptionId))
                .ifPresent(active -> {
                    throw new SubscriptionException(
                            "Người dùng đã có một gói thành viên đang hoạt động");
                });

        // Chỉ kích hoạt gói sau khi giao dịch tương ứng đã được xác minh thành công.
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
    public void deactivateExpiredSubscriptions() {
        List<Subscription> expiredSubscriptions = subscriptionRepository
                .findExpiredActiveSubscriptions(LocalDate.now());

        for (Subscription subscription : expiredSubscriptions) {
            subscription.setIsActive(false);
        }
        subscriptionRepository.saveAll(expiredSubscriptions);

    }
}
