# Hệ thống quản lý thư viện

Ứng dụng quản lý thư viện gồm backend Spring Boot, frontend React và database MySQL. Toàn bộ giao diện chính sử dụng tiếng Việt.

## Công nghệ sử dụng

- Backend: Java 17, Spring Boot, Spring Security, Spring Data JPA, JWT.
- Frontend: React 19, Vite, Material UI, Tailwind CSS và Axios.
- Database: MySQL.
- Tích hợp: Java Mail, VietQR đối soát thủ công và Razorpay dự phòng.

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
- Tiền phạt, thanh toán VietQR và đối soát giao dịch.
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
- Quản lý tiền phạt tại `/admin/fines`.
- Quản lý người dùng và phân quyền tại `/admin/users`.
- Quản lý gói thành viên và đăng ký tại `/admin/subscriptions`.
- Đối soát chuyển khoản VietQR tại `/admin/payments`.
- Bạn đọc xem và đăng ký gói tại `/subscriptions`.
- Bạn đọc xem lịch sử giao dịch tại `/my-payments`.

## Chuẩn bị MySQL

1. Mở MySQL Workbench và kết nối MySQL local.
2. Chạy file `database/library_db.sql` để tạo database và các bảng.
3. Chạy file `database/seed-dev.sql` để thêm thể loại, sách và gói thành viên mẫu.

Nếu database đã tồn tại từ giai đoạn 8, chạy thêm `database/stage-09-vietqr.sql` trước khi khởi động backend để bổ sung các cột đối soát và chuyển dữ liệu tiền tệ mẫu sang VND.

Script này cũng sửa database cũ còn cột `subscription_plans.title`: dữ liệu tên gói được chuyển sang cột `name`, sau đó cột `title` dư thừa được xóa. Lỗi `Field 'title' doesn't have a default value` sẽ hết sau khi chạy script và khởi động lại backend.

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

## Các màn hình quản trị giai đoạn 0–8

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

### Quản lý tiền phạt

- Lọc khoản phạt theo bạn đọc, trạng thái và loại phạt.
- Theo dõi tổng tiền, số đã thanh toán và số tiền còn phải thu.
- Tạo khoản phạt theo mã phiếu mượn; người bị phạt được lấy từ chính phiếu mượn.
- Miễn phần tiền phạt còn lại và bắt buộc ghi lý do.
- Hiển thị thông tin giao dịch, người miễn và lý do miễn khi có.
- Không tính khoản đã miễn vào tổng tiền còn phải trả.

Frontend sử dụng các API `/api/fines` và `/api/fines/waive`. Người dùng tạo giao dịch VietQR cho khoản phạt qua `/api/fines/{id}/pay`, quét mã rồi gửi yêu cầu đối soát tại `/api/payments/{paymentId}/submit`.

### Quản lý người dùng

- Tìm tài khoản theo họ tên, email hoặc số điện thoại.
- Lọc theo vai trò bạn đọc, quản trị viên và trạng thái xác minh.
- Sắp xếp, phân trang và xem thời điểm đăng ký, đăng nhập gần nhất.
- Cấp hoặc thu hồi vai trò quản trị cho tài khoản khác.
- Xác nhận hoặc bỏ xác nhận tài khoản.
- Không cho quản trị viên tự hạ quyền của chính mình.

Frontend sử dụng các API quản trị `/api/user/admin`, `/api/user/admin/stats` và `/api/user/admin/{userId}`. API `/api/user/list` cũ vẫn được giữ để chọn bạn đọc ở các nghiệp vụ mượn trả, đặt trước và tiền phạt.

### Gói thành viên và đăng ký

Bạn đọc tại `/subscriptions` có thể:

- Xem các gói đang mở, giá, thời hạn và hạn mức mượn.
- Xem gói đang hoạt động, số ngày còn lại và lịch sử đăng ký.
- Tạo đăng ký chờ và nhận mã VietQR kèm nội dung chuyển khoản riêng.
- Hủy gói đang sử dụng hoặc đăng ký đang chờ thanh toán.
- Không tạo trùng khi đã có gói hoạt động hoặc một đăng ký đang chờ.

Quản trị viên tại `/admin/subscriptions` có thể:

- Tạo, cập nhật, đánh dấu nổi bật, ẩn và kích hoạt lại gói thành viên.
- Xem toàn bộ đăng ký, tìm theo bạn đọc hoặc gói và lọc theo trạng thái.
- Theo dõi tổng số đăng ký đang hoạt động, chờ thanh toán, hết hạn và đã hủy.
- Hủy đăng ký kèm lý do và cập nhật hàng loạt các đăng ký hết hạn.

Danh sách công khai `/api/subscription-plan` chỉ trả các gói đang mở và không trả ghi chú quản trị. Các API `/api/subscription-plan/admin/**` và `/api/subscriptions/admin/**` yêu cầu `ROLE_ADMIN`. Cấu trúc bảng `subscription_plans` và `subscriptions` đã có sẵn trong `database/library_db.sql`; dữ liệu mẫu có ba gói trong `database/seed-dev.sql`.

### Thanh toán VietQR và đối soát – giai đoạn 9

- Ảnh QR của tài khoản MB được backend phục vụ tại `/payment/mb-vietqr.png`.
- Mỗi giao dịch có số tiền và nội dung chuyển khoản riêng dạng `TXN_...`.
- Bạn đọc quét QR, nhập đúng nội dung và bấm **Tôi đã chuyển khoản**; trạng thái đổi từ `PENDING` sang `PROCESSING`.
- Quản trị viên vào `/admin/payments`, kiểm tra tiền trên ứng dụng ngân hàng rồi nhập mã giao dịch để xác nhận hoặc ghi lý do từ chối.
- Chỉ khi quản trị viên xác nhận, trạng thái mới thành `SUCCESS`; backend mới kích hoạt gói thành viên hoặc đóng khoản phạt.
- Lịch sử của bạn đọc nằm tại `/my-payments`. Thông tin người đối soát và thời gian xử lý được lưu trong bảng `payments`.

QR hiện tại là QR tĩnh nên không tự biết tiền đã vào tài khoản. Nút xác nhận của bạn đọc chỉ gửi yêu cầu, không tự cấp quyền thành viên.

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
13. Vào `/admin/fines`, tạo khoản phạt bằng mã phiếu mượn.
14. Kiểm tra các bộ lọc, số tiền còn lại và thao tác miễn phạt.
15. Vào `/admin/users`, thử tìm kiếm, lọc và thay đổi trạng thái xác minh.
16. Dùng một tài khoản phụ để thử cấp rồi thu hồi quyền quản trị.
17. Xác nhận tài khoản quản trị đang đăng nhập không thể tự hạ quyền.
18. Đăng nhập bằng tài khoản người dùng để xác nhận không truy cập được route admin.
19. Vào `/admin/subscriptions`, tạo một gói mới rồi thử ẩn và kích hoạt lại.
20. Đăng nhập tài khoản bạn đọc, vào `/subscriptions` và chọn một gói.
21. Chọn gói, quét VietQR, chuyển đúng số tiền và nội dung rồi bấm **Tôi đã chuyển khoản**.
22. Đăng nhập admin, vào `/admin/payments`, đối chiếu ứng dụng MB rồi xác nhận hoặc từ chối giao dịch.
23. Kiểm tra giao dịch thành công đã kích hoạt gói hoặc đóng khoản phạt tương ứng.
24. Quay lại trang quản lý thành viên để lọc đăng ký và chạy cập nhật gói hết hạn.

## Tài liệu liên quan

- [Báo cáo rà soát backend](docs/PROJECT-AUDIT.md)
- [Hướng dẫn chạy backend local](docs/BACKEND-LOCAL-GUIDE.md)
- [Schema MySQL](database/library_db.sql)
- [Dữ liệu mẫu](database/seed-dev.sql)
- [Quy trình Git an toàn](docs/SAFE-WORKFLOW.md)

## Các giai đoạn tiếp theo

- Giai đoạn 9: đã hoàn thành thanh toán VietQR và đối soát thủ công.
- Giai đoạn 10 trở đi: webhook ngân hàng/cổng thanh toán tự động, email, bảo mật, migration database và triển khai.
