package com.zosh.librarymanagementsystem.service.impl;

import com.zosh.librarymanagementsystem.domain.FineStatus;
import com.zosh.librarymanagementsystem.domain.FineType;
import com.zosh.librarymanagementsystem.domain.PaymentGateway;
import com.zosh.librarymanagementsystem.domain.PaymentType;
import com.zosh.librarymanagementsystem.domain.PaymentStatus;
import com.zosh.librarymanagementsystem.exception.LibraryOperationException;
import com.zosh.librarymanagementsystem.mapper.FineMapper;
import com.zosh.librarymanagementsystem.modal.BookLoan;
import com.zosh.librarymanagementsystem.modal.Fine;
import com.zosh.librarymanagementsystem.modal.User;
import com.zosh.librarymanagementsystem.payload.dto.FineDTO;
import com.zosh.librarymanagementsystem.payload.request.CreateFineRequest;
import com.zosh.librarymanagementsystem.payload.request.PaymentInitiateRequest;
import com.zosh.librarymanagementsystem.payload.request.WaiveFineRequest;
import com.zosh.librarymanagementsystem.payload.response.PageResponse;
import com.zosh.librarymanagementsystem.payload.response.PaymentInitiateResponse;
import com.zosh.librarymanagementsystem.repository.BookLoanRepository;
import com.zosh.librarymanagementsystem.repository.FineRepository;
import com.zosh.librarymanagementsystem.repository.PaymentRepository;
import com.zosh.librarymanagementsystem.service.FineService;
import com.zosh.librarymanagementsystem.service.PaymentService;
import com.zosh.librarymanagementsystem.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FineServiceImpl  implements FineService {
    private final BookLoanRepository bookLoanRepository;
    private final FineRepository fineRepository;
    private final FineMapper fineMapper;
    private final UserService userService;
    private final PaymentService paymentService;
    private final PaymentRepository paymentRepository;

    @Override
    @Transactional
    public FineDTO createFine(CreateFineRequest createFineRequest) {
        // 1. Kiểm tra phiếu mượn tồn tại.
        BookLoan bookLoan = bookLoanRepository.findById(createFineRequest.getBookLoanId())
                .orElseThrow(() -> new LibraryOperationException("Không tìm thấy phiếu mượn"));

        fineRepository.findByBookLoanIdAndType(bookLoan.getId(), createFineRequest.getType())
                .ifPresent(existing -> {
                    throw new LibraryOperationException(
                            "Phiếu mượn đã có khoản phạt cùng loại");
                });

        // 2. Tạo khoản phạt cho đúng người đang giữ phiếu mượn.
        Fine fine = Fine.builder()
                .bookLoan(bookLoan)
                .user(bookLoan.getUser())
                .type(createFineRequest.getType())
                .amount(createFineRequest.getAmount())
                .amountPaid(0L)
                .status(FineStatus.PENDING)
                .reason(createFineRequest.getReason())
                .notes(createFineRequest.getNotes())
                .build();
        Fine savedFine = fineRepository.save(fine);
        return fineMapper.toDTO(savedFine);
    }

    @Override
    @Transactional
    public PaymentInitiateResponse payFine(Long fineId) {

        // 1. Kiểm tra khoản phạt tồn tại.
        Fine fine = fineRepository.findById(fineId)
                .orElseThrow( () -> new LibraryOperationException("Không tìm thấy khoản phạt"));

        // 2. Khoản phạt đã xử lý thì không tạo thanh toán mới.
        if (fine.getStatus().equals(FineStatus.PAID)) {
            throw new LibraryOperationException("Khoản phạt đã được thanh toán");
        }
        if (fine.getStatus().equals(FineStatus.WAIVED)) {
            throw new LibraryOperationException("Khoản phạt đã được miễn");
        }

        // 3. Chỉ chủ khoản phạt mới được tạo yêu cầu thanh toán.

        User user = userService.getCurrentUser();
        if (!fine.getUser().getId().equals(user.getId())) {
            throw new LibraryOperationException("Bạn không thể thanh toán khoản phạt của người dùng khác");
        }

        // Dùng lại giao dịch đang chờ để tránh tạo nhiều mã cho cùng một khoản phạt.
        var existingPayment = paymentRepository.findFirstByFineIdAndStatusInOrderByCreatedAtDesc(
                fineId, Set.of(PaymentStatus.PENDING, PaymentStatus.PROCESSING));
        if (existingPayment.isPresent()) {
            if (existingPayment.get().getStatus()
                    == PaymentStatus.PROCESSING) {
                throw new LibraryOperationException(
                        "Khoản phạt đã có giao dịch đang chờ quản trị viên đối soát");
            }
            return paymentService.getPaymentInstructions(existingPayment.get().getId());
        }

        PaymentInitiateRequest request = PaymentInitiateRequest
                .builder()
                .userId(user.getId())
                .fineId(fine.getId())
                .paymentType(PaymentType.FINE)
                .gateway(PaymentGateway.VIETQR)
                .amount(fine.getAmountOutstanding())
                .currency("VND")
                .description("Thanh toán tiền phạt thư viện")
                .build();

        return paymentService.initiatePayment(request);
    }

    @Override
    @Transactional
    public void markFineAsPaid(Long fineId, Long amount, String transactionId) {

        Fine fine = fineRepository.findById(fineId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Không tìm thấy khoản phạt có ID " + fineId));

        // Đối chiếu số tiền trước khi đánh dấu đã thanh toán.
        fine.applyPayment(amount);
        fine.setTransactionId(transactionId);
        fineRepository.save(fine);
    }

    @Override
    @Transactional
    public FineDTO waiveFine(WaiveFineRequest waiveFineRequest) {

        Fine fine = fineRepository.findById(waiveFineRequest.getFineId())
                .orElseThrow(() -> new LibraryOperationException("Không tìm thấy khoản phạt có ID " + waiveFineRequest.getFineId()));

        // 2. Không xử lý lại khoản phạt đã được miễn hoặc đã thanh toán.
        if (fine.getStatus() == FineStatus.WAIVED) {
            throw new LibraryOperationException("Khoản phạt đã được miễn trước đó");
        }

        if (fine.getStatus() == FineStatus.PAID) {
            throw new LibraryOperationException("Khoản phạt đã thanh toán nên không thể miễn");
        }

        // 3. Lưu người quản trị và lý do miễn phạt.
        User currentAdmin = userService.getCurrentUser();
        fine.waive(currentAdmin, waiveFineRequest.getReason());

        // 4. Lưu và trả dữ liệu cho API.
        Fine savedFine = fineRepository.save(fine);

        return fineMapper.toDTO(savedFine);
    }

    @Override
    public List<FineDTO> getMyFines(FineStatus status, FineType type) {

        User currentUser = userService.getCurrentUser();
        List<Fine> fines;

        // Kết hợp các bộ lọc được truyền lên.
        if (status != null && type != null) {
            // Lọc đồng thời theo trạng thái và loại phạt.
            fines = fineRepository.findByUserId(currentUser.getId()).stream()
                    .filter(f -> f.getStatus() == status && f.getType() == type)
                    .collect(Collectors.toList());
        } else if (status != null) {
            // Chỉ lọc theo trạng thái.
            fines = fineRepository.findByUserId(currentUser.getId()).stream()
                    .filter(f -> f.getStatus() == status)
                    .collect(Collectors.toList());
        } else if (type != null) {
            // Chỉ lọc theo loại phạt.
            fines = fineRepository.findByUserIdAndType(currentUser.getId(), type);
        } else {
            // Không có bộ lọc: lấy toàn bộ khoản phạt của người dùng.
            fines = fineRepository.findByUserId(currentUser.getId());
        }


        return fines.stream().map(
                fineMapper::toDTO
        ).collect(Collectors.toList());
    }

    @Override
    public PageResponse<FineDTO> getAllFines(FineStatus status, FineType type, Long userId, int page, int size) {

        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.min(Math.max(size, 1), 100),
                Sort.by("createdAt").descending()
        );

        Page<Fine> finePage = fineRepository.findAllWithFilters(
                userId,
                status,
                type,
                pageable
        );
        return convertToPageResponse(finePage);
    }

    private PageResponse<FineDTO> convertToPageResponse(Page<Fine> finePage) {
        List<FineDTO> fineDTOs = finePage.getContent()
                .stream()
                .map(fineMapper::toDTO)
                .collect(Collectors.toList());

        return new PageResponse<>(
                fineDTOs,
                finePage.getNumber(),
                finePage.getSize(),
                finePage.getTotalElements(),
                finePage.getTotalPages(),
                finePage.isLast(),
                finePage.isFirst(),
                finePage.isEmpty()
        );
    }
}
