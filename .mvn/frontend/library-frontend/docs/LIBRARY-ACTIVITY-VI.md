# Giai đoạn 3 — Hoạt động của bạn đọc

Giai đoạn này thay dữ liệu minh họa bằng API backend cho phiếu mượn, đặt trước, yêu thích, tiền phạt và đánh giá. Toàn bộ nhãn, trạng thái, lỗi và hộp xác nhận trên giao diện đều dùng tiếng Việt. Tên sách, tác giả và nội dung do người dùng nhập vẫn giữ nguyên dữ liệu gốc.

## Phiếu mượn

Trang `/my-loans` gọi `GET /api/book-loans/my`, hỗ trợ phân trang và lọc `CHECKED_OUT`, `OVERDUE`, `RETURNED`, `LOST`, `DAMAGED`. Mỗi phiếu hiển thị sách, ISBN, ngày mượn, hạn trả, ngày trả, trạng thái và số lần gia hạn.

Bạn đọc có thể gia hạn phiếu đủ điều kiện bằng `POST /api/book-loans/renew` với `bookLoanId`, `extensionDays` và ghi chú. Số ngày được giới hạn theo gói thành viên. Giao diện không có nút tự trả sách vì `POST /api/book-loans/checkin` là quyền quản trị viên/thủ thư trong `SecurityConfig`.

## Đặt trước

Trang `/my-reservations` gọi `GET /api/reservations/my`, phân trang và lọc theo từng trạng thái. Đặt trước `PENDING` hoặc `AVAILABLE` có thể được hủy sau bước xác nhận bằng `DELETE /api/reservations/{id}`. Trạng thái sẵn sàng nhận hiển thị thời gian bắt đầu và hạn nhận sách; hàng chờ hiển thị `queuePosition` khi backend cung cấp.

## Danh sách yêu thích

Trang `/wishlist` gọi `GET /api/wishlist/my-wishlist`. Bạn đọc có thể thêm hoặc bỏ sách ngay trong trang chi tiết qua `POST /api/wishlist/add/{bookId}` và `DELETE /api/wishlist/remove/{bookId}`. Xóa từ trang danh sách có hộp xác nhận. API được đọc đủ các trang khi cần xác định một sách đã được lưu hay chưa.

## Đánh giá sách

Đánh giá công khai được đọc từ `GET /api/reviews/book/{bookId}`. Trang hiển thị điểm trung bình, tổng số đánh giá, phân trang phía giao diện và ngày giờ theo định dạng Việt Nam.

Tài khoản chỉ thấy nút viết đánh giá khi lịch sử `RETURNED` cho biết đã mượn và trả cuốn sách. Mỗi người chỉ có một đánh giá cho một sách; chủ đánh giá có thể sửa hoặc xóa. Giao diện kiểm tra điểm 1–5, tiêu đề tối đa 200 ký tự và nội dung 10–2.000 ký tự trước khi gửi. Backend vẫn là nơi quyết định cuối cùng về quyền sở hữu và điều kiện đã đọc sách.

## Tiền phạt và Razorpay

Trang `/my-fines` gọi `GET /api/fines/my`, lọc theo trạng thái và loại phạt, hiển thị tổng tiền còn phải trả. Đơn vị hiện tại là INR vì backend dùng `currency=INR` mặc định.

Nút thanh toán gọi `POST /api/fines/{id}/pay` sau bước xác nhận. Giao diện chỉ chấp nhận `checkoutUrl` dùng HTTPS và chỉ mở Razorpay khi người dùng tự bấm **Tiếp tục đến Razorpay**. Nếu mất phản hồi sau khi gửi, nút của khoản phạt đó bị khóa trong phiên hiện tại để tránh tạo nhiều bản ghi thanh toán. Xác minh kết quả Razorpay và trang callback hoàn chỉnh thuộc giai đoạn 4.

## Xử lý an toàn

- Các lời gọi đọc cũ không ghi đè màn hình khi người dùng đổi tab hoặc rời trang.
- Thao tác gia hạn, hủy, xóa, đánh giá và thanh toán đều chặn bấm gửi nhiều lần.
- Khi mất phản hồi sau thao tác có thể tạo dữ liệu, giao diện không tự gửi lại.
- HTTP 401 kết thúc phiên, HTTP 403 hiển thị lỗi quyền; lỗi máy chủ không lộ nội dung kỹ thuật.
- Không có thay đổi schema hoặc dữ liệu MySQL trong giai đoạn này.

## Kiểm tra local

```powershell
cd D:\Codex\Library-Management-System\.mvn\frontend\library-frontend
npm test
npm run lint
npm run build
```

`tests/library.test.jsx` dùng API mô phỏng để kiểm tra bộ lọc phiếu, quyền trả sách, payload gia hạn, xác nhận hủy, thêm/bỏ yêu thích, tạo liên kết HTTPS, từ chối URL không an toàn, quyền viết/sửa/xóa đánh giá và dữ liệu tiếng Việt. Kiểm thử không kết nối MySQL thật và không gọi Razorpay thật.

Khi kiểm tra tích hợp, hãy dùng database thử nghiệm riêng. Backend hiện có `ddl-auto=update`, vì vậy không khởi động vào database chứa dữ liệu cần giữ nếu chưa rà soát cấu hình.
