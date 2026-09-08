# Giai đoạn 2 — Chi tiết sách, mượn sách và đặt trước

## Cách sử dụng

1. Mở `http://localhost:5173/books`, chọn ảnh bìa, tên sách hoặc **Xem chi tiết**.
2. Trang `/books/:id` hiển thị sách từ backend: tác giả, ISBN, thể loại, nhà xuất bản, ngày xuất bản, ngôn ngữ, số trang, mô tả và số bản. Ảnh thiếu/hỏng có bìa dự phòng. Nhãn và thông báo bằng tiếng Việt; nội dung tên sách, tác giả, mô tả giữ theo dữ liệu thư viện.
3. Khách có thể xem sách; nút **Đăng nhập** trong trang chi tiết giữ lại địa chỉ để quay về sau khi đăng nhập.
4. Nếu còn sách và đủ điều kiện, chọn số ngày mượn, thêm ghi chú nếu cần rồi **Mượn sách → Xác nhận**. Ngày mượn phải là số nguyên từ 1 đến giới hạn gói; mặc định là 14 ngày hoặc giới hạn gói nếu thấp hơn.
5. Nếu hết sách, chọn **Đặt trước sách → Xác nhận**. Kết quả hiển thị mã đặt trước và vị trí hàng chờ. Theo backend hiện tại, tạo đặt trước không yêu cầu gói thành viên; lúc nhận/mượn sách vẫn cần gói hợp lệ.
6. Khi có phiếu mượn, màn hình hiển thị mã phiếu và hạn trả do backend cung cấp. Tồn kho được tải lại. Không gửi thêm yêu cầu trong khi đang chờ hoặc sau khi đã nhận phiếu thành công.

## Điều kiện được đối chiếu

- Sách đang hoạt động; chưa có phiếu mượn hoặc đặt trước đang hoạt động cho cùng đầu sách.
- Mượn: gói còn hiệu lực, chưa đủ hạn mức và không có sách quá hạn.
- Đặt trước: dưới 5 đặt trước đang hoạt động. Đặt trước ở trạng thái sẵn sàng nhận hiển thị hướng dẫn liên hệ thủ thư và ngày hết hạn giữ sách.
- Số bản `availableCopies` là số bản vật lý. Nếu backend báo các bản còn lại được giữ cho người đã đặt chỗ, màn hình chuyển sang đặt trước. Backend kiểm tra lại mọi điều kiện khi gửi yêu cầu; giao diện không thay thế việc kiểm tra này.
- Hai trường `alreadyHaveLoan` và `alreadyHaveReservation` chưa được mapper backend điền. Frontend đọc các trang phiếu đang hoạt động của tài khoản để tránh dựa vào giá trị trống hoặc bỏ sót phiếu ở trang sau.

## API sử dụng

| Thao tác | API | Dữ liệu |
|---|---|---|
| Chi tiết sách | `GET /api/books/{id}` | `BookDTO` |
| Gói hiện tại | `GET /api/subscriptions/user/active` | `SubscriptionDTO` |
| Phiếu đang mượn/quá hạn | `GET /api/book-loans/my` | `status=CHECKED_OUT` hoặc `OVERDUE`, `page`, `size` |
| Đặt trước đang hoạt động | `GET /api/reservations/my` | `activeOnly=true`, `page`, `size` |
| Mượn sách | `POST /api/book-loans/checkout` | `{bookId, checkoutDays, notes?}` |
| Đặt trước | `POST /api/reservations` | `{bookId, notes?}` |

Các thao tác của tài khoản dùng JWT từ Axios client chung. Không truyền `userId` để mượn thay người khác. API gói hiện tại trả HTTP 400 với thông báo cụ thể khi chưa có gói; các lỗi mạng, 401, 403, 500 được xử lý riêng, không coi là chưa đăng ký.

## Xử lý lỗi

- ID không hợp lệ: không gọi API sách. Sách không tồn tại hoặc tải thất bại: thông báo tiếng Việt và nút thử lại.
- Không tải được dữ liệu phiếu/gói: chặn thao tác, cho thử lại.
- Mất phản hồi hoặc lỗi máy chủ sau khi gửi: không tự động gửi lại. Nút **Kiểm tra lại** tải phiếu của tài khoản trước khi cho phép thao tác tiếp.
- Rời trang hoặc đổi tài khoản: kết quả trả chậm không được hiển thị ở trang/tài khoản mới.
- Không có thay đổi schema hoặc dữ liệu MySQL trong giai đoạn này.

## Kiểm thử

Từ `D:\Codex\Library-Management-System\.mvn\frontend\library-frontend`:

```powershell
npm test
npm run lint
npm run build
```

`tests/books.test.jsx` kiểm thử trang chi tiết và Axios bằng API mô phỏng: khách, giữ đường dẫn đăng nhập, ảnh lỗi, ID sai, thử lại, điều kiện mượn, giới hạn ngày, xác nhận/hủy, dữ liệu gửi, hết sách, đặt trước trùng, hạn mức, giữ chỗ, mất phản hồi, chống gửi trùng và đọc đủ trang. Những bài này không tạo phiếu hoặc gửi email trong database thật.

Để kiểm tra với backend, dùng môi trường thử nghiệm riêng với tài khoản và sách thử, gồm sách còn bản, hết bản và gói thành viên hợp lệ. Chỉ khởi động backend vào MySQL khi đã xác nhận cấu hình database, vì `ddl-auto=update` có thể thay đổi schema.

## Phạm vi tiếp theo

Các trang **Sách tôi đã mượn**, **Sách đã đặt trước**, **Tổng quan** vẫn dùng dữ liệu minh họa có nhãn. Giai đoạn 3 sẽ kết nối danh sách/lịch sử và các nghiệp vụ tiếp theo; phiếu mới hiện được xác nhận ngay tại trang chi tiết. Trang đăng ký và thanh toán gói trực tuyến thuộc giai đoạn 4. Không có thanh toán tự động trong luồng mượn/đặt trước này.
