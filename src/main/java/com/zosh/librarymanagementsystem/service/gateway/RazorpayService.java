package com.zosh.librarymanagementsystem.service.gateway;

import com.razorpay.PaymentLink;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.zosh.librarymanagementsystem.domain.PaymentType;
import com.zosh.librarymanagementsystem.modal.Payment;
import com.zosh.librarymanagementsystem.modal.User;
import com.zosh.librarymanagementsystem.payload.response.PaymentLinkResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class RazorpayService {

    @Value("${razorpay.key.id:}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret:}")
    private String razorpayKeySecret;

    @Value("${razorpay.callback.base-url:http://localhost:5173}")
    private String callbackBaseUrl;

    public PaymentLinkResponse createPaymentLink(User user, Payment payment) {

        try {
            validateConfiguration();
            RazorpayClient razorpayClient = new RazorpayClient(razorpayKeyId,
                    razorpayKeySecret);

            // Razorpay nhận số tiền ở đơn vị nhỏ nhất (paise), còn database lưu đơn vị tiền chính.
            Long amountInPaisa = Math.multiplyExact(payment.getAmount(), 100L);

            // Đối tượng JSON gửi đến API tạo liên kết thanh toán của Razorpay.
            JSONObject paymentLinkRequest = new JSONObject();
            paymentLinkRequest.put("amount", amountInPaisa);
            paymentLinkRequest.put("currency", payment.getCurrency());
            paymentLinkRequest.put("description", payment.getDescription());
            paymentLinkRequest.put("reference_id", payment.getTransactionId());

            JSONObject customer = new JSONObject();
            customer.put("name", user.getFullName());
            customer.put("email", user.getEmail());
            if (user.getPhone() != null) {
                customer.put("contact", user.getPhone());
            }
            paymentLinkRequest.put("customer", customer);

            JSONObject notify = new JSONObject();
            notify.put("email", true);
            notify.put("sms", user.getPhone() != null);
            paymentLinkRequest.put("notify", notify);

            // Bật nhắc thanh toán.
            paymentLinkRequest.put("reminder_enable", true);

            // Đường dẫn frontend nhận kết quả sau khi thanh toán.
            String normalizedBaseUrl = callbackBaseUrl.endsWith("/")
                    ? callbackBaseUrl.substring(0, callbackBaseUrl.length() - 1)
                    : callbackBaseUrl;
            String successUrl = normalizedBaseUrl + "/payment-success?paymentId=" + payment.getId();

            paymentLinkRequest.put("callback_url", successUrl);
            paymentLinkRequest.put("callback_method", "get");

            JSONObject notes = new JSONObject();
            notes.put("user_id", user.getId());
            notes.put("payment_id", payment.getId());

            if (payment.getPaymentType() == PaymentType.MEMBERSHIP) {
                notes.put("subscription_id", payment.getSubscription().getId());
                notes.put("plan", payment.getSubscription().getPlan().getPlanCode());
                notes.put("type", PaymentType.MEMBERSHIP.name());
            } else if (payment.getPaymentType() == PaymentType.FINE) {
                if (payment.getFine() == null) {
                    throw new IllegalStateException("Thanh toán tiền phạt chưa gắn với khoản phạt");
                }
                notes.put("fine_id", payment.getFine().getId());
                notes.put("type", PaymentType.FINE.name());
            }
            paymentLinkRequest.put("notes", notes);

            PaymentLink paymentLink = razorpayClient.paymentLink.create(paymentLinkRequest);

            String paymentUrl = paymentLink.get("short_url");
            String paymentLinkId = paymentLink.get("id");

            PaymentLinkResponse response = new PaymentLinkResponse();
            response.setPayment_link_url(paymentUrl);
            response.setPayment_link_id(paymentLinkId);
            return response;

        } catch (RazorpayException e) {
            log.error("Không thể tạo liên kết thanh toán: {}", e.getMessage(), e);
            throw new IllegalStateException("Không thể tạo liên kết thanh toán Razorpay", e);
        }
    }

    public JSONObject fetchPaymentDetails(String paymentId) {
        try {
            validateConfiguration();
            RazorpayClient razorpay = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
            com.razorpay.Payment payment = razorpay.payments.fetch(paymentId);

            return payment.toJson();

        } catch (RazorpayException e) {
            log.error("Không thể lấy thông tin thanh toán {}: {}",
                    paymentId, e.getMessage(), e);
            throw new IllegalStateException(
                    "Không thể lấy thông tin thanh toán " + paymentId + ": " + e.getMessage(),e);
        }
    }

    public boolean isValidPayment(String paymentId, Payment expectedPayment) {
        return isValidPayment(fetchPaymentDetails(paymentId), expectedPayment);
    }

    public boolean isValidPayment(JSONObject paymentDetails, Payment expectedPayment) {
        try {
            String status = paymentDetails.optString("status");
            long amount = paymentDetails.optLong("amount");

            JSONObject notes = paymentDetails.getJSONObject("notes");
            // 1. Chỉ chấp nhận giao dịch đã được Razorpay thu tiền thành công.
            if (!"captured".equalsIgnoreCase(status)) {
                log.warn("Thanh toán chưa được thu tiền; trạng thái hiện tại: {}", status);
                return false;
            }

            // 2. Đối chiếu bản ghi nội bộ, loại thanh toán, số tiền và loại tiền.
            boolean samePayment = String.valueOf(expectedPayment.getId())
                    .equals(notes.optString("payment_id"));
            boolean sameType = expectedPayment.getPaymentType().name()
                    .equals(notes.optString("type"));
            boolean sameAmount = amount == Math.multiplyExact(expectedPayment.getAmount(), 100L);
            String currency = paymentDetails.optString("currency");
            boolean sameCurrency = expectedPayment.getCurrency().equalsIgnoreCase(currency);

            return samePayment && sameType && sameAmount && sameCurrency;
        } catch (Exception e) {
            log.error("Không thể xác minh thanh toán nội bộ {}: {}",
                    expectedPayment.getId(), e.getMessage(), e);
            return false;
        }
    }

    private void validateConfiguration() {
        if (razorpayKeyId == null || razorpayKeyId.isBlank()
                || razorpayKeySecret == null || razorpayKeySecret.isBlank()) {
            throw new IllegalStateException(
                    "Chưa cấu hình RAZORPAY_KEY_ID hoặc RAZORPAY_KEY_SECRET");
        }
    }
}
