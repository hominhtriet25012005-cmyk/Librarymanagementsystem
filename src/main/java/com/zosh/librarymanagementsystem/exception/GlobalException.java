package com.zosh.librarymanagementsystem.exception;

import com.zosh.librarymanagementsystem.payload.response.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.dao.DataIntegrityViolationException;

@RestControllerAdvice
@Slf4j
public class GlobalException {

    @ExceptionHandler(GenreException.class)
    public ResponseEntity<ApiResponse> handleGenreException(GenreException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse(e.getMessage(), false));
    }

    @ExceptionHandler({BookException.class, UserException.class, SubscriptionException.class,
            LibraryOperationException.class})
    public ResponseEntity<ApiResponse> handleDomainException(Exception e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse(e.getMessage(), false));
    }

    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    public ResponseEntity<ApiResponse> handleInvalidOperation(RuntimeException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse(e.getMessage(), false));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse> handleDataIntegrityViolation(
            DataIntegrityViolationException e) {
        String databaseMessage = e.getMostSpecificCause().getMessage();
        log.warn("Thao tác vi phạm ràng buộc dữ liệu: {}", databaseMessage);

        String userMessage = "Không thể thực hiện vì dữ liệu đang được tham chiếu hoặc đã tồn tại";
        if (databaseMessage != null && databaseMessage.contains("doesn't have a default value")) {
            // Thường xảy ra khi database cũ còn cột bắt buộc mà entity hiện tại không sử dụng.
            userMessage = "Cấu trúc database chưa đồng bộ với backend. Hãy chạy migration mới nhất";
        } else if (databaseMessage != null && databaseMessage.contains("Duplicate entry")) {
            userMessage = "Mã hoặc dữ liệu này đã tồn tại";
        } else if (databaseMessage != null
                && databaseMessage.toLowerCase().contains("foreign key constraint")) {
            userMessage = "Không thể thay đổi vì dữ liệu đang được sử dụng ở chức năng khác";
        }
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ApiResponse(userMessage, false));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse> handleUnexpectedException(Exception e) {
        log.error("Lỗi hệ thống chưa được xử lý", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse("Hệ thống gặp lỗi khi xử lý yêu cầu", false));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse> handleValidationException(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .orElse("Dữ liệu gửi lên không hợp lệ");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse(message, false));
    }
}
