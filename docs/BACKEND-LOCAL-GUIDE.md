# Hướng dẫn chạy và kiểm thử Backend trên máy local

Thư mục backend: `D:\Codex\Library-Management-System`

Backend mặc định: `http://localhost:5000`

Frontend dự kiến: `http://localhost:5173`

## 1. Phần mềm cần có

- JDK 17. Dự án đặt Java target 17; dùng đúng JDK 17 giúp tránh lỗi khóa file của compiler trên JDK 23/Windows.
- MySQL 8.x.
- IntelliJ IDEA hoặc terminal PowerShell.
- Không cần cài Maven toàn máy vì dự án có `mvnw.cmd`.

Kiểm tra Java:

```powershell
java -version
```

## 2. Tạo database

Schema đầy đủ nằm tại [`database/library_db.sql`](../database/library_db.sql). Trong MySQL Workbench, mở file và chạy toàn bộ nếu đây là database mới.

Kiểm tra sau khi tạo:

```sql
USE library_db;
SHOW TABLES;
```

Kết quả cần có 12 bảng: `genres`, `users`, `books`, `password_reset_tokens`, `subscription_plans`, `subscriptions`, `book_loans`, `book_reviews`, `fines`, `reservations`, `wishlists`, `payments`.

Nếu database đang có dữ liệu thật, hãy export backup trước. Script dùng `CREATE TABLE IF NOT EXISTS`, vì vậy không xóa dữ liệu nhưng cũng không sửa được một bảng cũ đã có sai cột. Khi đó hãy so sánh bằng:

```sql
SHOW CREATE TABLE books;
SHOW CREATE TABLE users;
SHOW CREATE TABLE subscriptions;
```

## 3. Tạo cấu hình local

Nếu chưa có file local:

```powershell
Copy-Item src/main/resources/application.properties.example `
  src/main/resources/application.properties
```

`application.properties` đã được bỏ khỏi Git để tránh commit mật khẩu. Có thể cấu hình qua biến môi trường:

| Biến | Công dụng |
|---|---|
| `MYSQL_HOST`, `MYSQL_USERNAME`, `MYSQL_PASSWORD` | Kết nối MySQL `library_db` |
| `JPA_DDL_AUTO` | Local dùng `update`; production dùng `validate` |
| `JWT_SECRET` | Khóa JWT dài tối thiểu 32 byte |
| `FRONTEND_URL` | URL tạo link đặt lại mật khẩu |
| `CORS_ALLOWED_ORIGINS` | Danh sách frontend được gọi API, cách nhau bằng dấu phẩy |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_FULL_NAME` | Tài khoản admin tạo lần đầu |
| `INITIALIZE_ADMIN` | Bật/tắt tạo admin local |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD` | SMTP gửi email |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Khóa Razorpay |
| `RAZORPAY_CALLBACK_BASE_URL` | URL frontend nhận kết quả thanh toán |
| `VIETQR_BANK_NAME`, `VIETQR_ACCOUNT_NAME`, `VIETQR_ACCOUNT_NUMBER` | Thông tin tài khoản nhận chuyển khoản |
| `VIETQR_IMAGE_URL` | Đường dẫn ảnh QR, mặc định `/payment/mb-vietqr.png` |
| `OVERDUE_FINE_PER_DAY` | Tiền phạt cho mỗi ngày quá hạn |

Ví dụ đặt biến trong phiên PowerShell hiện tại:

```powershell
$env:MYSQL_USERNAME = "root"
$env:MYSQL_PASSWORD = "mat-khau-mysql-cua-ban"
$env:JWT_SECRET = "mot-khoa-bi-mat-local-dai-it-nhat-32-byte"
$env:ADMIN_PASSWORD = "mat-khau-admin-local"
```

## 4. Chạy backend

```powershell
Set-Location D:\Codex\Library-Management-System
.\mvnw.cmd spring-boot:run
```

Kiểm tra:

```text
GET http://localhost:5000/
```

Các API bảo vệ cần header:

```text
Authorization: Bearer <jwt nhận từ /auth/login>
```

## 5. Chạy test tự động

```powershell
.\mvnw.cmd test
```

Test dùng cấu hình [`src/test/resources/application.properties`](../src/test/resources/application.properties) và database H2 trong bộ nhớ. Lệnh test không đọc, sửa hay xóa MySQL local.

Nếu máy đang dùng JDK 23 và compiler báo lỗi khóa một file `.jar`, hãy cấu hình IntelliJ Project SDK và `JAVA_HOME` về JDK 17, sau đó chạy lại:

```powershell
.\mvnw.cmd clean test
```

Kết quả chuẩn hiện tại: **20 test, 0 failure, 0 error**.

## 6. Kiểm thử API thủ công

Mở [`test.http`](../test.http) trong IntelliJ. Chạy theo thứ tự để file tự lưu `userToken`, `adminToken`, `genreId`, `bookId`, `planId`, `subscriptionId`, `bookLoanId`, `reservationId` và `fineId`.

Luồng chính:

1. Đăng ký và đăng nhập bạn đọc.
2. Đăng nhập admin.
3. Admin tạo thể loại, sách và gói thành viên.
4. Tạo/kích hoạt gói thành viên.
5. Mượn, gia hạn và trả sách.
6. Đánh giá sách sau khi trả.
7. Thêm/xóa wishlist.
8. Hết sách thì tạo đặt chỗ; admin giao sách khi đặt chỗ chuyển sang `AVAILABLE`.
9. Tạo/xem/miễn hoặc thanh toán khoản phạt.
10. Tra cứu payment với phân trang.

Luồng mặc định dùng VietQR. API đăng ký gói hoặc thanh toán phạt trả thông tin QR, số tiền và nội dung chuyển khoản. Bạn đọc gửi xác nhận qua `POST /api/payments/{paymentId}/submit`; quản trị viên đối chiếu ngân hàng rồi gọi `POST /api/payments/admin/{paymentId}/confirm` hoặc `/reject`. Backend chỉ kích hoạt subscription hoặc đóng fine sau khi quản trị viên xác nhận.

Với database đã tạo trước giai đoạn 9, chạy `database/stage-09-vietqr.sql` một lần trước khi khởi động backend. Script có thể chạy lại và tự bỏ qua các cột đã tồn tại.

## 7. Endpoint chính

| Module | Đường dẫn gốc |
|---|---|
| Auth | `/auth` |
| User | `/api/user` |
| Genre | `/api/genres` |
| Book | `/api/books` |
| Subscription Plan | `/api/subscription-plan` |
| Subscription | `/api/subscriptions` |
| Book Loan | `/api/book-loans` |
| Reservation | `/api/reservations` |
| Fine | `/api/fines` |
| Payment | `/api/payments` |
| Review | `/api/reviews` |
| Wishlist | `/api/wishlist` |

Các endpoint ghi sách/thể loại, quản lý toàn bộ phiếu mượn, đặt chỗ, tiền phạt, payment và gói thành viên cần `ROLE_ADMIN`. Người dùng thường chỉ thao tác dữ liệu của chính mình.
