# Hướng dẫn chạy và kiểm thử Backend trên máy local

Tài liệu này mô tả trạng thái backend hiện tại của dự án Library Management System. Phần frontend chưa nằm trong phạm vi của đợt sửa này.

## 1. Những module backend đã có

- Xác thực: đăng ký, đăng nhập, JWT, quên mật khẩu và đặt lại mật khẩu.
- Người dùng: xem hồ sơ cá nhân; quản trị viên xem danh sách người dùng.
- Thể loại: tạo, xem, cập nhật, ẩn và xóa vĩnh viễn.
- Sách: tạo một/nhiều sách, xem, cập nhật, tìm kiếm, thống kê, ẩn và xóa vĩnh viễn.
- Gói thành viên: tạo, xem, cập nhật và ẩn gói.
- Đăng ký thành viên: đăng ký, kích hoạt, xem gói hiện tại, hủy và vô hiệu hóa gói hết hạn.

Các module mượn sách, trả sách, đặt trước và thanh toán thật chưa có trong source hiện tại. Tham số `paymentId` ở API kích hoạt đăng ký mới là vị trí chờ để nối module thanh toán.

## 2. Cấu hình Database MySQL

Schema chuẩn nằm tại [`database/library_db.sql`](../database/library_db.sql). File này đã có bảng `books` và các khóa ngoại cần thiết.

Trong MySQL Workbench:

1. Sao lưu database cũ nếu đang có dữ liệu cần giữ.
2. Mở `database/library_db.sql`.
3. Chạy script để tạo database `library_db` và các bảng.
4. Kiểm tra bằng lệnh:

```sql
USE library_db;
SHOW TABLES;
DESCRIBE books;
```

Danh sách bảng hiện tại: `genres`, `users`, `books`, `password_reset_tokens`, `subscription_plans`, `subscriptions`.

## 3. Cấu hình chạy local

Backend dùng Java 17 trở lên, Maven và MySQL. Cổng mặc định đã thống nhất là `5000`.

Nếu chưa có file cấu hình local, chạy ở thư mục gốc dự án:

```powershell
Copy-Item src/main/resources/application.properties.example `
  src/main/resources/application.properties
```

Sau đó điền tài khoản MySQL và email vào `application.properties`. File này đã được `.gitignore`, vì vậy mật khẩu local không được commit lên Git.

Các biến quan trọng:

| Biến | Giá trị mặc định | Ý nghĩa |
|---|---|---|
| `server.port` | `5000` | Cổng backend |
| `MYSQL_HOST` | `localhost` | Máy chạy MySQL |
| `MYSQL_USERNAME` | `root` | Tài khoản MySQL |
| `MYSQL_PASSWORD` | rỗng | Mật khẩu MySQL |
| `JWT_SECRET` | chuỗi mẫu | Khóa ký JWT, phải dài ít nhất 32 byte |
| `FRONTEND_URL` | `http://localhost:5173` | Địa chỉ dùng trong link reset mật khẩu |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Các origin được gọi backend, phân cách bằng dấu phẩy |
| `ADMIN_EMAIL` | `admin@gmail.com` | Email admin local được tạo lần đầu |
| `ADMIN_PASSWORD` | `admin123` | Mật khẩu admin local được tạo lần đầu |
| `INITIALIZE_ADMIN` | `true` | Bật/tắt tạo admin local |

Nên đổi `JWT_SECRET` và `ADMIN_PASSWORD` trước khi đưa ứng dụng ra ngoài máy local.

## 4. Chạy backend

Mở terminal tại `Library-Management-System`:

```powershell
.\mvnw.cmd spring-boot:run
```

Đường dẫn kiểm tra:

- Backend: `http://localhost:5000`
- Đăng ký: `POST http://localhost:5000/auth/signup`
- Đăng nhập: `POST http://localhost:5000/auth/login`
- Sách: `http://localhost:5000/api/books`
- Thể loại: `http://localhost:5000/api/genres`
- Gói thành viên: `http://localhost:5000/api/subscription-plan`
- Đăng ký thành viên: `http://localhost:5000/api/subscriptions`

Các API dưới `/api/**` cần header JWT:

```text
Authorization: Bearer <token nhận được sau khi đăng nhập>
```

API tạo/sửa/xóa và các đường dẫn có `/admin` cần tài khoản mang quyền `ROLE_ADMIN`.

## 5. Kiểm thử tự động

Chạy toàn bộ test:

```powershell
.\mvnw.cmd test
```

Test dùng H2 in-memory và `src/test/resources/application.properties`; chúng không kết nối, xóa hay thay đổi database MySQL local.

Các nhóm được kiểm tra:

- Spring khởi động context, tạo entity và kiểm tra repository query.
- Book service chặn ISBN trùng và số bản có sẵn lớn hơn tổng số bản.
- Tìm sách tự gán phân trang mặc định nếu request thiếu dữ liệu.
- Auth service mã hóa mật khẩu, tạo JWT, chặn email trùng và token reset hết hạn.
- Subscription service chặn gói ngừng hoạt động và chặn người dùng hủy gói của người khác.

## 6. Kiểm thử API thủ công

Mở [`test.http`](../test.http) trong IntelliJ IDEA rồi chạy lần lượt từ mục 1 đến mục 20. File sẽ tự lưu `userToken`, `adminToken`, `genreId`, `bookId`, `planId` và `subscriptionId` từ response để dùng cho bước sau.

Nếu chạy lại và nhận lỗi trùng email, mã thể loại, ISBN hoặc mã gói, hãy đổi dữ liệu mẫu trong `test.http` hoặc xóa đúng bản ghi thử nghiệm trong MySQL.

Riêng API quên mật khẩu chỉ gửi mail thành công khi `MAIL_USERNAME` và `MAIL_PASSWORD` hợp lệ. Với Gmail, `MAIL_PASSWORD` phải là App Password. Đây là kết nối ra dịch vụ email thật, không nằm trong test tự động.

## 7. Các lỗi đã được sửa

- Đồng bộ cổng trong file test từ `8083` sang `5000`.
- Thêm `searchTerm` vào GET `/api/books`.
- Tránh lỗi null khi POST tìm kiếm không truyền `page`, `size`, `sortBy` hoặc `sortDirection`.
- Hoàn thiện `BookMapper.updateEntityFromDTO` và kiểm tra thể loại tồn tại.
- Chặn ISBN trùng và số lượng sách không hợp lệ.
- Chặn mã thể loại trùng, thể loại cha không tồn tại và trường hợp tự chọn chính mình làm cha.
- Thêm validation cho signup, login, quên mật khẩu và reset mật khẩu.
- Tách URL frontend, CORS và tài khoản admin local ra cấu hình.
- Sửa JWT theo API JJWT 0.12.6 và chuẩn hóa phản hồi token sai thành HTTP 401.
- Sửa luồng đăng ký thành viên, quyền hủy đăng ký và phân trang danh sách admin.
- Đổi thông báo lỗi nghiệp vụ chính sang tiếng Việt.
