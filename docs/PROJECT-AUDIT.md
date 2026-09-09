# Báo cáo rà soát Backend Library Management System

Ngày cập nhật: **07/09/2026**. Phạm vi của đợt sửa này chỉ gồm backend và database; frontend sẽ được xử lý ở giai đoạn sau.

Tài liệu đối chiếu chính: [Production-Grade Library Management System Java Full Stack](https://watery-lunaria-74f.notion.site/Production-Grade-Library-Management-System-Java-Full-Stack-282e63b763e0804c9d51ca592c5e58d4) và video của Code With Zosh.

## 1. Các module backend hiện có

- Xác thực: đăng ký, đăng nhập, BCrypt, JWT, quên mật khẩu và đặt lại mật khẩu qua email.
- Người dùng: hồ sơ cá nhân, danh sách người dùng dành cho quản trị viên.
- Thể loại: CRUD, thể loại cha/con, sắp xếp và thống kê.
- Sách: CRUD, tạo hàng loạt, tìm kiếm, lọc, phân trang, thống kê và kiểm soát tồn kho.
- Gói thành viên và đăng ký thành viên: tạo gói, đăng ký, thanh toán, kích hoạt, hủy và vô hiệu hóa gói hết hạn.
- Mượn/trả: kiểm tra gói, hạn mức, sách quá hạn, gia hạn, trả/mất/hỏng, cập nhật tồn kho và thống kê.
- Đặt chỗ: hàng chờ, thông báo khi có sách, nhận sách, hủy và hết hạn sau 48 giờ.
- Tiền phạt: tạo phạt, phạt quá hạn tự động, miễn phạt, thanh toán một phần/toàn bộ.
- Thanh toán: tạo giao dịch VietQR, tiếp nhận yêu cầu đối soát, quản trị viên xác nhận/từ chối, chống dùng lại mã ngân hàng và phát sự kiện nghiệp vụ.
- Đánh giá sách: chỉ người đã mượn và trả sách mới được đánh giá; mỗi người một đánh giá cho mỗi sách.
- Danh sách yêu thích: thêm, xóa và phân trang danh sách của người dùng.
- Phân quyền: các thao tác quản trị được giới hạn cho `ROLE_ADMIN`; dữ liệu cá nhân chỉ chủ sở hữu được thao tác.

## 2. Các nhóm lỗi đã sửa

| Nhóm | Lỗi ban đầu | Cách sửa |
|---|---|---|
| Lombok/JDK | IntelliJ báo thiếu `get...`, `set...`, `builder()` | Cập nhật Lombok, bật annotation processing bằng `proc=full`, sửa Maven Wrapper trên Windows |
| Tên package/class | `configration`, `Authprovider` làm import khác hướng dẫn | Chuẩn hóa thành `configuration` và `AuthProvider` |
| Mapper | Thiếu `updateEntityFromDTO`, mapper trả `null`, gọi nhầm getter/setter | Hoàn thiện Book/Genre/Subscription/Loan/Review/Fine/Payment/Reservation/Wishlist mapper |
| Kiểu dữ liệu | `Booklean`, `Peageable`, import `java.awt.print.Pageable` | Đổi thành `Boolean` và `org.springframework.data.domain.Pageable` |
| Book API | Trùng endpoint, search JPQL sai, thiếu stats, validation tồn kho bị bỏ qua | Sửa mapping, query, thống kê và chặn `availableCopies > totalCopies` |
| JWT | Không tìm thấy `Keys`, `Claims`, `Jwts`; API JJWT không khớp; khóa quá ngắn | Dùng JJWT 0.12.6 đúng API, `SecretKey`, khóa từ cấu hình và trả 401 cho token sai |
| Auth | Điều kiện signup bị ngược, `userDetails == null` không phù hợp, trả `null`, role sai | Bắt `UsernameNotFoundException`, sửa điều kiện, trả `AuthResponse`, gắn authority đúng |
| Password reset | Biến `user`/`frontendUrl` sai phạm vi, builder báo đỏ, mail thiếu link | Tạo và lưu token trong đúng hàm, xóa token cũ, tạo link 5 phút, gửi email |
| Email | Không tìm thấy `MimeMessage`, `MimeMessageHelper`, catch sai cú pháp | Dùng `jakarta.mail.internet.MimeMessage`, Spring Mail và xử lý ngoại lệ đúng |
| Subscription | Inject/implements nhầm service, repository/query sai, kích hoạt không kiểm tra payment | Sửa lớp service/repository và chỉ kích hoạt bằng giao dịch `SUCCESS` đúng đăng ký |
| Loan | Sai tên biến/repository/ngày tháng, thiếu kiểm tra người dùng/gói/tồn kho | Hoàn chỉnh checkout, checkin, renew, overdue, quota và cập nhật tồn kho trong transaction |
| Reservation | Sai người dùng khi admin đặt hộ, query dùng `LIMIT 1`, thiếu cập nhật hàng chờ | Dùng derived query, kiểm soát chủ sở hữu, xếp lại hàng và chuyển người tiếp theo sang `AVAILABLE` |
| Fine | Thiếu liên kết loan/user, chưa xử lý trả một phần, hàm đánh dấu đã trả không lưu | Chuẩn hóa entity/repository/service, tính số tiền còn lại và lưu trạng thái |
| Razorpay | Dependency/version sai, biến request sai, `e.getMessage()` lỗi, đối chiếu giao dịch thiếu | Dùng `razorpay-java:1.4.10`, chuẩn hóa request/response, kiểm tra status/amount/currency/người sở hữu |
| Payment | `PaymentStatus.PENDING`, `getCreatedAt`, `initiatePayment`, `getAllPayments` báo đỏ | Hoàn thiện enum, entity timestamp, mapper, service, repository, controller và phân trang |
| Review/Wishlist | Xóa review lại gọi save, typo mapper, thiếu ràng buộc trùng | Sửa service và thêm unique constraint ở database |
| Exception | Ném `Exception` chung làm API trả lỗi khó hiểu | Thêm lỗi nghiệp vụ riêng, Việt hóa response validation và che chi tiết lỗi hệ thống |

## 3. Database sau khi đồng bộ

Schema tham chiếu nằm ở `database/library_db.sql`, gồm 12 bảng:

1. `genres`
2. `users`
3. `books`
4. `password_reset_tokens`
5. `subscription_plans`
6. `subscriptions`
7. `book_loans`
8. `book_reviews`
9. `fines`
10. `reservations`
11. `wishlists`
12. `payments`

Các bảng mới có khóa ngoại, index phục vụ truy vấn trạng thái, unique constraint chống dữ liệu trùng và check constraint cho số lượng/tiền/rating. Entity dùng `EnumType.STRING` để database lưu tên trạng thái dễ đọc và không bị đổi ý nghĩa khi enum thay đổi thứ tự.

Với database local chỉ mới có `books`, có thể chạy schema trên một database mới. Nếu database cũ đã có dữ liệu, cần sao lưu trước; `CREATE TABLE IF NOT EXISTS` không tự sửa một bảng cũ có cấu trúc sai. Ở local, `spring.jpa.hibernate.ddl-auto=update` sẽ bổ sung cột/bảng còn thiếu khi ứng dụng khởi động. Ở production nên dùng Flyway/Liquibase và `ddl-auto=validate`.

## 4. Những điểm chủ động thống nhất khi tài liệu không đồng nhất

- Dùng tên `Genre`, không dùng `Genera`.
- Dùng `Wishlist` theo source hiện tại; tài liệu có chỗ gọi là Watchlist.
- Backend hiện dùng JWT local và VietQR đối soát thủ công; mã Razorpay cũ vẫn được giữ làm phương án mở rộng. Google OAuth và Stripe chưa được triển khai trong source này.
- Tiền được lưu bằng `BIGINT` theo đơn vị tiền chính của gói. Luồng VietQR dùng `VND`; dữ liệu mẫu và mặc định database đã được chuyển sang VND.
- Response đăng nhập giữ các trường `jwt`, `title`, `message`, `user` để khớp code hiện tại.

## 5. Kết quả kiểm tra

- Maven đã biên dịch toàn bộ source và khởi động được Spring context với H2 ở chế độ tương thích MySQL.
- **20 test** bao phủ context/repository, Auth, Book, Subscription, BookLoan, Reservation và Payment.
- Test kiểm tra các nhánh quan trọng: email/ISBN trùng, tồn kho sai, gói dừng hoạt động, hủy gói người khác, kích hoạt bằng payment hợp lệ, quota mượn, trả quá hạn sinh phạt, chuyển hàng đặt chỗ, đặt hộ đúng người và xác minh payment đúng chủ sở hữu.
- Test tự động chỉ dùng H2 in-memory, không kết nối hoặc thay đổi MySQL local.

## 6. Giới hạn cần biết

- Test không gọi Razorpay, Gmail hay MySQL thật; các dịch vụ ngoài được mock để test an toàn và ổn định.
- QR tĩnh không có webhook ngân hàng; quản trị viên phải kiểm tra giao dịch trên ứng dụng MB trước khi xác nhận.
- Gửi email thật chỉ hoạt động khi có tài khoản SMTP hợp lệ; với Gmail cần App Password.
- Dữ liệu MySQL đang có không được sửa tự động trong đợt rà soát này để tránh mất dữ liệu. Schema mới là nguồn đối chiếu trước khi migration.
