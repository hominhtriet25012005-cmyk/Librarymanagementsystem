package com.zosh.librarymanagementsystem.service;

import com.zosh.librarymanagementsystem.domain.*;
import com.zosh.librarymanagementsystem.event.publisher.PaymentPublisher;
import com.zosh.librarymanagementsystem.mapper.PaymentMapper;
import com.zosh.librarymanagementsystem.modal.BookLoan;
import com.zosh.librarymanagementsystem.modal.Fine;
import com.zosh.librarymanagementsystem.modal.Payment;
import com.zosh.librarymanagementsystem.modal.User;
import com.zosh.librarymanagementsystem.payload.dto.PaymentDTO;
import com.zosh.librarymanagementsystem.payload.request.PaymentInitiateRequest;
import com.zosh.librarymanagementsystem.payload.request.PaymentVerifyRequest;
import com.zosh.librarymanagementsystem.payload.response.PaymentInitiateResponse;
import com.zosh.librarymanagementsystem.payload.response.PaymentLinkResponse;
import com.zosh.librarymanagementsystem.repository.FineRepository;
import com.zosh.librarymanagementsystem.repository.PaymentRepository;
import com.zosh.librarymanagementsystem.repository.SubscriptionRepository;
import com.zosh.librarymanagementsystem.repository.UserRepository;
import com.zosh.librarymanagementsystem.service.gateway.RazorpayService;
import com.zosh.librarymanagementsystem.service.impl.PaymentServiceImpl;
import org.json.JSONObject;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private SubscriptionRepository subscriptionRepository;
    @Mock private PaymentRepository paymentRepository;
    @Mock private FineRepository fineRepository;
    @Mock private RazorpayService razorpayService;
    @Mock private PaymentMapper paymentMapper;
    @Mock private PaymentPublisher paymentEventPublisher;
    @Mock private UserService userService;

    @InjectMocks private PaymentServiceImpl paymentService;

    @Test
    void khoiTaoThanhToanTienPhatGanDungDuLieu() {
        User user = User.builder().id(1L).build();
        Fine fine = Fine.builder().id(2L).user(user).bookLoan(BookLoan.builder().id(3L).build())
                .type(FineType.OVERDUE).amount(100L).amountPaid(0L).status(FineStatus.PENDING).build();
        PaymentInitiateRequest request = PaymentInitiateRequest.builder()
                .userId(1L).fineId(2L).paymentType(PaymentType.FINE)
                .gateway(PaymentGateway.RAZORPAY).amount(100L).currency("INR")
                .description("Thanh toán phạt").build();
        PaymentLinkResponse link = new PaymentLinkResponse();
        link.setPayment_link_id("plink_1");
        link.setPayment_link_url("https://example.test/pay");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(fineRepository.findById(2L)).thenReturn(Optional.of(fine));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> {
            Payment payment = invocation.getArgument(0);
            payment.setId(9L);
            return payment;
        });
        when(razorpayService.createPaymentLink(eq(user), any(Payment.class))).thenReturn(link);

        PaymentInitiateResponse response = paymentService.initiatePayment(request);

        assertTrue(response.getSuccess());
        assertEquals("plink_1", response.getRazorpayOrderId());
        ArgumentCaptor<Payment> captor = ArgumentCaptor.forClass(Payment.class);
        verify(razorpayService).createPaymentLink(eq(user), captor.capture());
        assertSame(fine, captor.getValue().getFine());
        assertEquals(PaymentStatus.PROCESSING, captor.getValue().getStatus());
    }

    @Test
    void khongChoXacMinhThanhToanCuaNguoiKhac() throws Exception {
        User owner = User.builder().id(1L).build();
        User currentUser = User.builder().id(2L).build();
        Payment payment = Payment.builder().id(9L).user(owner).amount(100L)
                .currency("INR").paymentType(PaymentType.FINE)
                .gateway(PaymentGateway.RAZORPAY).status(PaymentStatus.PROCESSING).build();
        JSONObject details = new JSONObject().put("notes", new JSONObject().put("payment_id", 9L));

        when(razorpayService.fetchPaymentDetails("pay_1")).thenReturn(details);
        when(paymentRepository.findById(9L)).thenReturn(Optional.of(payment));
        when(userService.getCurrentUser()).thenReturn(currentUser);

        assertThrows(IllegalArgumentException.class,
                () -> paymentService.verifyPayment(new PaymentVerifyRequest("pay_1", null, null)));
        verify(razorpayService, never()).isValidPayment(any(JSONObject.class), any());
    }

    @Test
    void xacMinhThanhCongLuuTrangThaiVaPhatSuKien() throws Exception {
        User owner = User.builder().id(1L).build();
        Payment payment = Payment.builder().id(9L).user(owner).amount(100L)
                .currency("INR").paymentType(PaymentType.MEMBERSHIP)
                .gateway(PaymentGateway.RAZORPAY).status(PaymentStatus.PROCESSING).build();
        JSONObject details = new JSONObject().put("notes", new JSONObject().put("payment_id", 9L));
        PaymentDTO mapped = new PaymentDTO();

        when(razorpayService.fetchPaymentDetails("pay_1")).thenReturn(details);
        when(paymentRepository.findById(9L)).thenReturn(Optional.of(payment));
        when(userService.getCurrentUser()).thenReturn(owner);
        when(razorpayService.isValidPayment(details, payment)).thenReturn(true);
        when(paymentMapper.toDTO(payment)).thenReturn(mapped);

        assertSame(mapped, paymentService.verifyPayment(new PaymentVerifyRequest("pay_1", null, null)));
        assertEquals(PaymentStatus.SUCCESS, payment.getStatus());
        assertEquals("pay_1", payment.getGatewayPaymentId());
        verify(paymentRepository).save(payment);
        verify(paymentEventPublisher).publishPaymentSuccessEvent(payment);
    }
}
