package com.zosh.librarymanagementsystem.service.impl;

import com.zosh.librarymanagementsystem.domain.PaymentGateway;
import com.zosh.librarymanagementsystem.domain.PaymentStatus;
import com.zosh.librarymanagementsystem.domain.PaymentType;
import com.zosh.librarymanagementsystem.event.publisher.PaymentPublisher;
import com.zosh.librarymanagementsystem.exception.SubscriptionException;
import com.zosh.librarymanagementsystem.exception.UserException;
import com.zosh.librarymanagementsystem.mapper.PaymentMapper;
import com.zosh.librarymanagementsystem.modal.Payment;
import com.zosh.librarymanagementsystem.modal.Fine;
import com.zosh.librarymanagementsystem.modal.Subscription;
import com.zosh.librarymanagementsystem.modal.User;
import com.zosh.librarymanagementsystem.payload.dto.PaymentDTO;
import com.zosh.librarymanagementsystem.payload.request.PaymentInitiateRequest;
import com.zosh.librarymanagementsystem.payload.request.PaymentVerifyRequest;
import com.zosh.librarymanagementsystem.payload.response.PaymentInitiateResponse;
import com.zosh.librarymanagementsystem.payload.response.PaymentLinkResponse;
import com.zosh.librarymanagementsystem.repository.PaymentRepository;
import com.zosh.librarymanagementsystem.repository.FineRepository;
import com.zosh.librarymanagementsystem.repository.SubscriptionRepository;
import com.zosh.librarymanagementsystem.repository.UserRepository;
import com.zosh.librarymanagementsystem.service.PaymentService;
import com.zosh.librarymanagementsystem.service.UserService;
import com.zosh.librarymanagementsystem.service.gateway.RazorpayService;
import lombok.RequiredArgsConstructor;
import org.json.JSONObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final UserRepository userRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PaymentRepository paymentRepository;
    private final FineRepository fineRepository;
    private final RazorpayService razorpayService;
    private final PaymentMapper paymentMapper;
    private final PaymentPublisher paymentEventPublisher;
    private final UserService userService;

    @Override
    @Transactional
    public PaymentInitiateResponse initiatePayment(PaymentInitiateRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Yêu cầu thanh toán không được để trống");
        }
        if (request.getUserId() == null) {
            throw new IllegalArgumentException("ID người dùng thanh toán là bắt buộc");
        }
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new UserException("Không tìm thấy người dùng"));

        Payment payment = new Payment();
        payment.setUser(user);
        payment.setPaymentType(request.getPaymentType());
        payment.setGateway(request.getGateway());
        payment.setAmount(request.getAmount());
        String currency = request.getCurrency() == null || request.getCurrency().isBlank()
                ? "INR"
                : request.getCurrency().trim().toUpperCase(Locale.ROOT);
        payment.setCurrency(currency);
        payment.setDescription(request.getDescription());
        payment.setStatus(PaymentStatus.PENDING);
        payment.setTransactionId("TXN_" + UUID.randomUUID());
        payment.setInitiatedAt(LocalDateTime.now());

        if (request.getSubscriptionId() != null) {
            Subscription sub = subscriptionRepository
                    .findById(request.getSubscriptionId())
                    .orElseThrow(() -> new SubscriptionException(
                             "Không tìm thấy đăng ký thành viên"));
            if (!sub.getUser().getId().equals(user.getId())) {
                throw new SubscriptionException("Đăng ký thành viên không thuộc người thanh toán");
            }
            if (!sub.getPrice().equals(request.getAmount())) {
                throw new IllegalArgumentException("Số tiền thanh toán không khớp với giá gói thành viên");
            }
            payment.setSubscription(sub);
        }

        if (request.getFineId() != null) {
            Fine fine = fineRepository.findById(request.getFineId())
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy khoản phạt"));
            if (!fine.getUser().getId().equals(user.getId())) {
                throw new IllegalArgumentException("Khoản phạt không thuộc người dùng thanh toán");
            }
            if (!Long.valueOf(fine.getAmountOutstanding()).equals(request.getAmount())) {
                throw new IllegalArgumentException("Số tiền thanh toán không khớp với khoản phạt");
            }
            payment.setFine(fine);
        }

        validatePaymentContext(payment);
        payment = paymentRepository.save(payment);

        PaymentInitiateResponse response = new PaymentInitiateResponse();

        if (request.getGateway() == PaymentGateway.RAZORPAY) {
            PaymentLinkResponse paymentLinkResponse = razorpayService.createPaymentLink(
                    user, payment
            );
            if (paymentLinkResponse == null
                    || paymentLinkResponse.getPayment_link_id() == null
                    || paymentLinkResponse.getPayment_link_url() == null) {
                throw new IllegalStateException("Razorpay không trả về liên kết thanh toán hợp lệ");
            }
            payment.setGatewayOrderId(paymentLinkResponse.getPayment_link_id());

            response = PaymentInitiateResponse.builder()
                    .paymentId(payment.getId())
                    .subscriptionId(payment.getSubscription() == null
                            ? null : payment.getSubscription().getId())
                    .fineId(payment.getFine() == null ? null : payment.getFine().getId())
                    .gateway(payment.getGateway())
                    .checkoutUrl(paymentLinkResponse.getPayment_link_url())
                    .transactionId(payment.getTransactionId())
                    .razorpayOrderId(paymentLinkResponse.getPayment_link_id())
                    .amount(payment.getAmount())
                    .description(payment.getDescription())
                    .success(true)
                    .message("Đã khởi tạo thanh toán")
                    .build();
        } else {
            throw new IllegalArgumentException("Cổng thanh toán chưa được hỗ trợ: " + request.getGateway());
        }
        payment.setStatus(PaymentStatus.PROCESSING);
        paymentRepository.save(payment);
        // Bản ghi chuyển sang PROCESSING sau khi cổng thanh toán trả liên kết hợp lệ.
        return response;
    }

    @Override
    @Transactional
    public PaymentDTO verifyPayment(PaymentVerifyRequest req) {

        JSONObject paymentDetails = razorpayService.fetchPaymentDetails(
        req.getRazorpayPaymentId()
        );
        JSONObject notes = paymentDetails.optJSONObject("notes");
        if (notes == null || notes.optString("payment_id").isBlank()) {
            throw new IllegalArgumentException("Thanh toán không chứa mã đối chiếu nội bộ");
        }

        Long paymentId = Long.parseLong(notes.optString("payment_id"));
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy giao dịch thanh toán"));

        User currentUser = userService.getCurrentUser();
        if (!payment.getUser().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("Bạn không thể xác minh thanh toán của người dùng khác");
        }
        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            return paymentMapper.toDTO(payment);
        }

        boolean isValid = razorpayService.isValidPayment(paymentDetails, payment);

        if (PaymentGateway.RAZORPAY==payment.getGateway()) {
            paymentRepository.findByGatewayPaymentId(req.getRazorpayPaymentId())
                    .filter(existing -> !existing.getId().equals(payment.getId()))
                    .ifPresent(existing -> {
                        throw new IllegalArgumentException(
                                "Mã thanh toán Razorpay đã được dùng cho giao dịch khác");
                    });
            payment.setGatewayPaymentId(req.getRazorpayPaymentId());
        }
        if (isValid) {
            payment.setStatus(PaymentStatus.SUCCESS);
            payment.setCompletedAt(LocalDateTime.now());
            paymentRepository.save(payment);

            // Phát sự kiện để kích hoạt gói thành viên hoặc đóng khoản phạt.
            paymentEventPublisher.publishPaymentSuccessEvent(payment);
        } else {
            payment.setStatus(PaymentStatus.FAILED);
            payment.setFailureReason("Thông tin thanh toán không khớp với giao dịch nội bộ");
            paymentRepository.save(payment);
        }
        return paymentMapper.toDTO(payment);
    }

    @Override
    public Page<PaymentDTO> getAllPayments(Pageable pageable) {
        Page<Payment> payments = paymentRepository.findAll(pageable);

        return payments.map(paymentMapper::toDTO);
    }

    private void validatePaymentContext(Payment payment) {
        if (payment.getPaymentType() == null || payment.getGateway() == null
                || payment.getAmount() == null || payment.getAmount() <= 0
                || payment.getCurrency() == null || payment.getCurrency().length() != 3) {
            throw new IllegalArgumentException("Thông tin thanh toán chưa đầy đủ");
        }
        if (payment.getPaymentType() == PaymentType.MEMBERSHIP) {
            if (payment.getSubscription() == null || payment.getFine() != null) {
                throw new IllegalArgumentException(
                        "Thanh toán gói thành viên phải gắn đúng một đăng ký");
            }
        } else if (payment.getPaymentType() == PaymentType.FINE) {
            if (payment.getFine() == null || payment.getSubscription() != null) {
                throw new IllegalArgumentException(
                        "Thanh toán tiền phạt phải gắn đúng một khoản phạt");
            }
        } else {
            throw new IllegalArgumentException(
                    "Loại thanh toán chưa được hỗ trợ: " + payment.getPaymentType());
        }
    }
}
