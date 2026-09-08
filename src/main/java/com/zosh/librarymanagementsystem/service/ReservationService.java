package com.zosh.librarymanagementsystem.service;

import com.zosh.librarymanagementsystem.payload.dto.ReservationDTO;
import com.zosh.librarymanagementsystem.payload.request.ReservationRequest;
import com.zosh.librarymanagementsystem.payload.request.ReservationSearchRequest;
import com.zosh.librarymanagementsystem.payload.response.PageResponse;

public interface ReservationService {

    ReservationDTO createReservation(ReservationRequest reservationRequest);

    ReservationDTO createReservationForUser(ReservationRequest reservationRequest,
                                            Long userId);

    ReservationDTO cancelReservation(Long reservationId);
    ReservationDTO fulfillReservation(Long reservationId);

    int expireReservations();


    /**
     * Lấy danh sách đặt chỗ của người dùng hiện tại theo bộ lọc.
     * @param searchRequest điều kiện tìm kiếm
     * @return kết quả đặt chỗ đã phân trang
     */
    PageResponse<ReservationDTO> getMyReservations(ReservationSearchRequest searchRequest);

    PageResponse<ReservationDTO> searchReservations(ReservationSearchRequest searchRequest);


}
