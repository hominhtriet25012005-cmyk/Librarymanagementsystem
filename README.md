# Hệ thống quản lý thư viện

Ứng dụng quản lý thư viện gồm backend Spring Boot, frontend React và database MySQL. Toàn bộ giao diện chính sử dụng tiếng Việt.

## Công nghệ sử dụng

- Backend: Java 17, Spring Boot, Spring Security, Spring Data JPA, JWT.
- Frontend: React 19, Vite, Material UI, Tailwind CSS và Axios.
- Database: MySQL.
- Tích hợp: Java Mail và Razorpay.

## Cấu trúc thư mục

```text
Library-Management-System/
├── src/main/java/                         Backend Spring Boot
├── src/main/resources/                    Cấu hình backend
├── database/library_db.sql                Cấu trúc MySQL
├── database/seed-dev.sql                  Dữ liệu mẫu cho local
├── docs/                                  Tài liệu tiếng Việt
└── .mvn/frontend/library-frontend/         Frontend React + Vite
```

## Chức năng đã có

### Backend

- Đăng ký, đăng nhập, JWT, BCrypt và đặt lại mật khẩu qua email.
- Phân quyền `ROLE_USER` và `ROLE_ADMIN`.
- Quản lý người dùng và hồ sơ cá nhân.
- CRUD thể loại, thể loại cha con và thống kê số sách.
- CRUD sách, tạo nhiều sách, tìm kiếm, lọc, phân trang và thống kê.
- Mượn, trả, gia hạn và xử lý phiếu quá hạn.
- Đặt trước và quản lý hàng chờ.
- Gói thành viên và đăng ký thành viên.
- Tiền phạt, thanh toán và xác minh Razorpay.
- Đánh giá sách và danh sách yêu thích.

### Frontend

- Đăng ký, đăng nhập, quên mật khẩu và bảo vệ route.
- Kho sách, chi tiết sách, yêu thích, mượn sách và đặt trước.
- Trang cá nhân: phiếu mượn, đặt trước, tiền phạt và hồ sơ.
- Tổng quan quản trị tại `/admin/dashboard`.
- Quản lý thể loại tại `/admin/genres`.
- Quản lý sách tại `/admin/books`.
- Quản lý mượn, trả và gia hạn tại `/admin/loans`.
- Quản lý đặt trước và hàng chờ tại `/admin/reservations`.

## Chuẩn bị MySQL

1. Mở MySQL Workbench và kết nối MySQL local.
2. Chạy file `database/library_db.sql` để tạo database và các bảng.
3. Chạy file `database/seed-dev.sql` để thêm thể loại, sách và gói thành viên mẫu.

`seed-dev.sql` chỉ thêm dữ liệu còn thiếu dựa trên mã hoặc ISBN nên có thể chạy lại khi cần. Hãy sao lưu trước nếu database đang chứa dữ liệu quan trọng.

## Cấu hình backend

Sao chép file cấu hình mẫu:

```powershell
Copy-Item src/main/resources/application.properties.example `
  src/main/resources/application.properties
```

Có thể truyền các giá trị local qua biến môi trường trong IntelliJ:

```text
server.port=5000
spring.datasource.username=<tài khoản MySQL>
spring.datasource.password=<mật khẩu MySQL>
```

Các tích hợp bên ngoài cần cấu hình thêm:

```text
JWT_SECRET
ADMIN_EMAIL
ADMIN_PASSWORD
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
FRONTEND_URL
CORS_ALLOWED_ORIGINS
```

Gửi email thật cần khai báo SMTP hoặc Gmail App Password trong môi trường local. Không đưa khóa bí mật hoặc mật khẩu thật vào Git.

## Chạy backend

Tại thư mục gốc dự án:

```powershell
.\mvnw.cmd spring-boot:run
```

Backend mặc định chạy tại `http://localhost:5000`.

## Cấu hình và chạy frontend

```powershell
cd .mvn\frontend\library-frontend
Copy-Item .env.example .env
npm install
npm run dev
```

Frontend chạy tại `http://localhost:5173`. Nội dung `.env` mặc định:

```env
VITE_API_BASE_URL=http://localhost:5000
```

Phải dùng cùng hostname `localhost` cho frontend và cấu hình CORS của backend. Nếu dùng `127.0.0.1`, hãy bổ sung origin tương ứng vào `CORS_ALLOWED_ORIGINS`.

## Tài khoản quản trị local

Backend có thể tạo tài khoản quản trị khi khởi động nếu `library.admin.initialize=true`. Email và mật khẩu được lấy từ `ADMIN_EMAIL` và `ADMIN_PASSWORD`. Sau khi đăng nhập bằng tài khoản có `ROLE_ADMIN`, hệ thống chuyển đến `/admin/dashboard`.

Không cần đăng ký admin từ giao diện. Trang đăng ký công khai luôn tạo tài khoản người dùng thông thường.

## Luồng khởi tạo dữ liệu

1. Vào **Quản lý thể loại** để tạo hoặc kiểm tra thể loại.
2. Vào **Quản lý sách** để tạo sách và chọn thể loại.
3. Quay lại **Tổng quan quản trị** để xem các số liệu mới.

Nếu danh sách sách báo “Chưa có sách phù hợp”, hãy kiểm tra:

- `database/seed-dev.sql` đã được chạy hay chưa.
- Bộ lọc tìm kiếm trên trang quản lý sách.
- Backend có chạy tại cổng `5000` hay không.
- Frontend có dùng đúng `VITE_API_BASE_URL` hay không.

## Các màn hình quản trị giai đoạn 0–5

### Tổng quan quản trị

- Tổng số sách đang hoạt động và số đầu sách còn có thể mượn.
- Tổng thể loại và tài khoản.
- Phiếu mượn quá hạn, tiền phạt và đặt trước đang chờ.
- Danh sách phiếu mượn gần đây.

### Quản lý thể loại

- Tìm theo tên hoặc mã.
- Tạo và cập nhật thể loại.
- Thiết lập thể loại cha và thứ tự hiển thị.
- Ẩn hoặc kích hoạt lại thể loại.
- Xem số sách trong từng thể loại.

### Quản lý sách

- Tìm theo tên, tác giả hoặc ISBN.
- Lọc theo thể loại, tình trạng còn sách và trạng thái hoạt động.
- Sắp xếp và phân trang.
- Tạo, cập nhật và ẩn sách.
- Kiểm tra ISBN, số lượng, giá và dữ liệu biểu mẫu.

### Quản lý mượn và trả

- Tìm phiếu mượn theo bạn đọc, sách, trạng thái và khoảng ngày.
- Kết hợp nhiều bộ lọc, gồm phiếu quá hạn và phiếu có tiền phạt chưa thanh toán.
- Tạo phiếu mượn cho bạn đọc bằng danh sách sách còn sẵn.
- Nhận sách trả với tình trạng bình thường, hư hỏng hoặc bị mất.
- Gia hạn phiếu đang mượn và cập nhật đồng loạt các phiếu quá hạn.

Frontend gọi trực tiếp các API `/api/book-loans/search`, `/api/book-loans/checkout/user/{userId}`, `/api/book-loans/checkin`, `/api/book-loans/renew` và `/api/book-loans/admin/update-overdue`. Axios tự gắn JWT vào từng yêu cầu. Các API quản trị yêu cầu tài khoản có `ROLE_ADMIN`.

### Quản lý đặt trước và hàng chờ

- Lọc yêu cầu theo bạn đọc, sách, trạng thái và phạm vi đang hoạt động.
- Theo dõi vị trí hàng chờ, thời hạn nhận sách và trạng thái gửi thông báo.
- Tạo đặt trước hộ bạn đọc khi không còn bản sách trống.
- Giao sách cho lượt đã sẵn sàng; backend đồng thời tạo phiếu mượn.
- Hủy yêu cầu và tự sắp xếp lại hàng chờ.
- Quét các lượt đã quá hạn nhận sách và chuyển người tiếp theo lên.

Frontend sử dụng các API `/api/reservations`, `/api/reservations/user/{userId}`, `/api/reservations/{id}`, `/api/reservations/{id}/fulfill` và `/api/reservations/admin/expire`. Backend từ chối đặt trước sách đã ngừng hoạt động và không cho giao lượt giữ sách đã quá hạn.

## Kiểm tra thủ công

1. Khởi động MySQL, backend và frontend.
2. Đăng nhập tài khoản quản trị.
3. Truy cập `/admin/dashboard`.
4. Tạo một thể loại tại `/admin/genres`.
5. Tạo một cuốn sách tại `/admin/books`.
6. Kiểm tra sách xuất hiện trong `/books`.
7. Thử tìm kiếm, lọc, sửa và ẩn sách.
8. Vào `/admin/loans`, thử kết hợp nhiều bộ lọc và tạo một phiếu mượn.
9. Thử gia hạn, nhận trả sách và cập nhật phiếu quá hạn.
10. Vào `/admin/reservations`, tạo một đặt trước cho cuốn sách đã hết bản.
11. Trả một bản sách để kiểm tra người đầu hàng chờ chuyển sang trạng thái sẵn sàng.
12. Thử giao sách, hủy yêu cầu và cập nhật các lượt hết hạn.
13. Đăng nhập bằng tài khoản người dùng để xác nhận không truy cập được route admin.

## Tài liệu liên quan

- [Báo cáo rà soát backend](docs/PROJECT-AUDIT.md)
- [Hướng dẫn chạy backend local](docs/BACKEND-LOCAL-GUIDE.md)
- [Schema MySQL](database/library_db.sql)
- [Dữ liệu mẫu](database/seed-dev.sql)
- [Quy trình Git an toàn](docs/SAFE-WORKFLOW.md)

## Các giai đoạn tiếp theo

- Giai đoạn 6: quản lý tiền phạt.
- Giai đoạn 7: quản lý người dùng.
- Giai đoạn 8: quản lý gói thành viên và đăng ký.
- Giai đoạn 9: thanh toán và xác minh Razorpay.
- Giai đoạn 10 trở đi: hoàn thiện cổng bạn đọc, email, bảo mật, migration database và triển khai.
