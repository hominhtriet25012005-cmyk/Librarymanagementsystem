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
import com.zosh.librarymanagementsystem.payload.request.SubscriptionSearchRequest;
import com.zosh.librarymanagementsystem.payload.response.PageResponse;
import com.zosh.librarymanagementsystem.payload.response.PaymentInitiateResponse;
import com.zosh.librarymanagementsystem.payload.response.SubscriptionStatsResponse;
import com.zosh.librarymanagementsystem.repository.SubscriptionRepository;
import com.zosh.librarymanagementsystem.repository.SubscriptionPlanRepository;
import com.zosh.librarymanagementsystem.repository.PaymentRepository;
import com.zosh.librarymanagementsystem.service.PaymentService;
import com.zosh.librarymanagementsystem.service.SubscriptionService;
import com.zosh.librarymanagementsystem.service.UserService;
import com.zosh.librarymanagementsystem.domain.UserRole;
import lombok.RequiredArgsConstructor;
import com.zosh.librarymanagementsystem.modal.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class SubscriptionImpl implements SubscriptionService {

    private static final Set<String> ALLOWED_STATUSES = Set.of(
            "ACTIVE", "PENDING", "EXPIRED", "CANCELLED"
    );
    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "id", "createdAt", "startDate", "endDate", "price", "isActive"
    );

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

        if (!subscriptionRepository.findPendingSubscriptionsByUserId(
                user.getId(), LocalDate.now(), PageRequest.of(0, 1)).isEmpty()) {
            throw new SubscriptionException(
                    "Bạn đã có một đăng ký đang chờ thanh toán; hãy hủy đăng ký cũ trước khi tạo lại");
        }

        Subscription subscription = subscriptionMapper.toEntity(subscriptionDTO, plan, user);
        subscription.initializeFromPlan();
        subscription.setIsActive(false);
        Subscription saveSubscription = subscriptionRepository.save(subscription);

        // Tạo thanh toán VietQR; gói chỉ được kích hoạt sau khi quản trị viên đối soát.
        PaymentInitiateRequest paymentInitiateRequest = PaymentInitiateRequest
                    .builder()
                    .userId(user.getId())
                    .subscriptionId(saveSubscription.getId())
                    .paymentType(PaymentType.MEMBERSHIP)
                    .gateway(PaymentGateway.VIETQR)
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
    public SubscriptionDTO getUsersPendingSubscription() {
        List<Subscription> pending = subscriptionRepository.findPendingSubscriptionsByUserId(
                userService.getCurrentUser().getId(), LocalDate.now(), PageRequest.of(0, 1)
        );
        return pending.isEmpty() ? null : subscriptionMapper.toDTO(pending.get(0));
    }

    @Override
    @Transactional
    public SubscriptionDTO cancelSubscription(Long subscriptionId, String reason) {
        Subscription subscription = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new SubscriptionException(
                        "Không tìm thấy đăng ký có ID " + subscriptionId));

        User currentUser = userService.getCurrentUser();
        boolean isAdmin = currentUser.getRole() == UserRole.ROLE_ADMIN;
        if (!isAdmin && !subscription.getUser().getId().equals(currentUser.getId())) {
            throw new SubscriptionException("Bạn không thể hủy gói thành viên của người dùng khác");
        }

        if (subscription.getCancelledAt() != null) {
            throw new SubscriptionException("Đăng ký thành viên này đã được hủy trước đó");
        }
        if (subscription.isExpired()) {
            throw new SubscriptionException("Đăng ký thành viên đã hết hạn");
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
    @Transactional
    public SubscriptionDTO activateSubscription(Long subscriptionId, Long paymentId) {

        Subscription subscription = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(
                        () -> new SubscriptionException("Không tìm thấy đăng ký có ID " + subscriptionId)
                );

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new SubscriptionException("Không tìm thấy giao dịch thanh toán"));
        if (subscription.getCancelledAt() != null) {
            throw new SubscriptionException("Không thể kích hoạt đăng ký đã bị hủy");
        }
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
    public PageResponse<SubscriptionDTO> getMySubscriptions(int page, int size) {
        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.min(Math.max(size, 1), 100),
                Sort.by("createdAt").descending()
        );
        Page<Subscription> subscriptions = subscriptionRepository.findByUserId(
                userService.getCurrentUser().getId(), pageable
        );
        return toPageResponse(subscriptions);
    }

    @Override
    public PageResponse<SubscriptionDTO> searchSubscriptions(SubscriptionSearchRequest request) {
        String status = request.getStatus() == null || request.getStatus().isBlank()
                ? null
                : request.getStatus().trim().toUpperCase(Locale.ROOT);
        if (status != null && !ALLOWED_STATUSES.contains(status)) {
            throw new IllegalArgumentException("Trạng thái đăng ký không hợp lệ");
        }
        String sortBy = ALLOWED_SORT_FIELDS.contains(request.getSortBy())
                ? request.getSortBy()
                : "createdAt";
        Sort.Direction direction = "ASC".equalsIgnoreCase(request.getSortDirection())
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(
                Math.max(request.getPage(), 0),
                Math.min(Math.max(request.getSize(), 1), 100),
                Sort.by(direction, sortBy)
        );
        String searchTerm = request.getSearchTerm() == null || request.getSearchTerm().isBlank()
                ? null
                : request.getSearchTerm().trim();
        return toPageResponse(subscriptionRepository.searchSubscriptions(
                searchTerm, request.getPlanId(), status, LocalDate.now(), pageable
        ));
    }

    @Override
    public SubscriptionStatsResponse getSubscriptionStats() {
        LocalDate today = LocalDate.now();
        return new SubscriptionStatsResponse(
                subscriptionRepository.count(),
                subscriptionRepository.countActive(today),
                subscriptionRepository.countPending(today),
                subscriptionRepository.countExpired(today),
                subscriptionRepository.countByCancelledAtIsNotNull()
        );
    }

    @Override
    @Transactional
    public void deactivateExpiredSubscriptions() {
        List<Subscription> expiredSubscriptions = subscriptionRepository
                .findExpiredActiveSubscriptions(LocalDate.now());

        for (Subscription subscription : expiredSubscriptions) {
            subscription.setIsActive(false);
        }
        subscriptionRepository.saveAll(expiredSubscriptions);

    }

    private PageResponse<SubscriptionDTO> toPageResponse(Page<Subscription> subscriptions) {
        return new PageResponse<>(
                subscriptions.getContent().stream().map(subscriptionMapper::toDTO).toList(),
                subscriptions.getNumber(),
                subscriptions.getSize(),
                subscriptions.getTotalElements(),
                subscriptions.getTotalPages(),
                subscriptions.isLast(),
                subscriptions.isFirst(),
                subscriptions.isEmpty()
        );
    }
}
