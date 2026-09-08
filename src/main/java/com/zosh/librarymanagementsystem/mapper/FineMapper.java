package com.zosh.librarymanagementsystem.mapper;

import com.zosh.librarymanagementsystem.modal.Fine;
import com.zosh.librarymanagementsystem.payload.dto.FineDTO;
import org.springframework.stereotype.Component;

@Component
public class FineMapper {

    public FineDTO toDTO(Fine fine) {
        if (fine == null) {
            return null;
        }

        FineDTO dto = new FineDTO();
        dto.setId(fine.getId());

        // Thông tin phiếu mượn.
        if (fine.getBookLoan() != null) {
            dto.setBookLoanId(fine.getBookLoan().getId());

            if (fine.getBookLoan().getBook() != null) {
                dto.setBookTitle(fine.getBookLoan().getBook().getTitle());
                dto.setBookIsbn(fine.getBookLoan().getBook().getIsbn());
            }
        }

        // Thông tin người bị phạt.
        if (fine.getUser() != null) {
            dto.setUserId(fine.getUser().getId());
            dto.setUserName(fine.getUser().getFullName());
            dto.setUserEmail(fine.getUser().getEmail());
        }

        dto.setType(fine.getType());
        dto.setAmount(fine.getAmount());
        dto.setAmountPaid(fine.getAmountPaid());
        dto.setAmountOutstanding(fine.getAmountOutstanding());
        dto.setStatus(fine.getStatus());
        dto.setReason(fine.getReason());
        dto.setNotes(fine.getNotes());

        // Thông tin miễn phạt.
        if (fine.getWaivedBy() != null) {
            dto.setWaivedByUserId(fine.getWaivedBy().getId());
            dto.setWaivedByUserName(fine.getWaivedBy().getFullName());
        }

        dto.setWaivedAt(fine.getWaivedAt());
        dto.setWaiverReason(fine.getWaiverReason());

        // Thông tin thanh toán.
        dto.setPaidAt(fine.getPaidAt());
        if (fine.getProcessedBy() != null) {
            dto.setProcessedByUserId(fine.getProcessedBy().getId());
            dto.setProcessedByUserName(fine.getProcessedBy().getFullName());
        }

        dto.setTransactionId(fine.getTransactionId());

        dto.setCreatedAt(fine.getCreatedAt());
        dto.setUpdatedAt(fine.getUpdatedAt());

        return dto;
    }
}
