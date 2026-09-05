# Kiểm kê Library Management System

Ngày kiểm kê: 05/09/2026. Mốc hướng dẫn hiện tại: **Subscription Module Documentation (Entity + Controller)**.

## Mốc an toàn

- Nhánh Git hiện tại: `fix/book-mapper`.
- Tag nền ban đầu: `baseline-2026-09-03`.
- Bản sao toàn bộ mã trước đợt sửa: `D:\Codex\backups\library-before-full-repair-20260905-223649.zip`.
- Không chạy ứng dụng với MySQL thật và không sửa trực tiếp dữ liệu MySQL trong đợt kiểm kê này.

## Những phần đã có

### Backend

- Spring Boot 4.1.1, Java target 17, Maven Wrapper.
- JPA/MySQL và Bean Validation.
- Genre: entity, DTO, mapper, repository, service, CRUD controller, phân cấp thể loại và thống kê số sách.
- Book: entity, DTO, mapper, repository, service, CRUD, tạo hàng loạt, lọc/phân trang/sắp xếp và thống kê.
- User/Auth: người dùng, vai trò `ROLE_USER`/`ROLE_ADMIN`, đăng ký, đăng nhập và BCrypt.
- JWT: tạo token, đọc claims, filter xác thực và phân quyền endpoint quản trị.
- Password reset: token có hạn 5 phút, cập nhật mật khẩu và gửi mail bằng `JavaMailSender`.
- Subscription Plan: entity, DTO, mapper, repository, service và controller quản trị.
- Subscription: entity, DTO, mapper, repository, đăng ký, kích hoạt, hủy, lấy gói hiện tại và vô hiệu hóa gói hết hạn.
- Global exception handler cho lỗi domain và lỗi validation request.

### Frontend

- React 19 + Vite 8 + Material UI + Tailwind CSS.
- Các màn hình đang có: Dashboard, Book, My Loans, My Reservations và User Layout.
- Dữ liệu giao diện hiện vẫn chủ yếu là dữ liệu mẫu, chưa nối hoàn chỉnh với backend.
- Frontend hiện nằm tại `.mvn/frontend/library-frontend`; vị trí này chạy được nhưng nên chuyển thành thư mục cấp cao như `frontend/` ở một bước riêng sau khi hoàn tất mốc tutorial.

## Các nguyên nhân lỗi chính đã sửa

| Hiện tượng | Nguyên nhân | Cách xử lý |
|---|---|---|
| Hàng loạt `Cannot resolve method get.../set.../builder()` | JDK 23 không chạy annotation processing mặc định và mã Subscription còn lỗi cú pháp làm Lombok không vào vòng xử lý | Dùng Lombok 1.18.46, cấu hình Maven Compiler `proc=full`, sửa các lỗi khai báo chặn javac |
| Không tìm thấy `User` | File là `UserE.java`, class là `UserE`, trong khi toàn hệ thống import `modal.User` | Đổi thành `User.java` và class `User` |
| `Peageable`, `java.awt.print.Pageable` | Gõ sai tên và import nhầm package AWT | Dùng `org.springframework.data.domain.Pageable` |
| Annotation `required` báo đỏ | Dùng `@RequestMapping` trên tham số | Đổi thành `@RequestParam` |
| Controller gọi phương thức Subscription Plan không tồn tại | Inject nhầm `SubscriptionService`; implementation cũng implements nhầm interface | Tách đúng `SubscriptionPlanService` |
| `GenreMapper` tạo thể loại nhưng lưu lỗi/null | `toEntity()` trả về `null`; update gọi getter thay cho setter | Trả về entity và dùng `setDisplayOrder()` |
| Hai endpoint sách cùng `GET /{id}` | Hàm update dùng sai annotation | Đổi update thành `PUT /{id}` |
| Hai endpoint user cùng `/list` | Mapping profile bị trùng | Tách `/list` và `/profile` |
| Hard delete Genre lại soft delete | Controller gọi ngược service | Nối lại đúng `deleteGenre`/`hardDeleteGenre` |
| Search Book lỗi khi Spring khởi động | JPQL thiếu `OR`, dùng `==`, ghép chuỗi thiếu khoảng trắng | Viết lại JPQL và kiểm tra bằng Spring context test |
| `availableCopies > totalCopies` vẫn được lưu | Kết quả `isAvailableCopiesValid()` bị gọi rồi bỏ qua | Thêm validation service và ném `BookException` |
| JWT tạo/chạy lỗi dù import đúng | Khóa cũ ngắn hơn mức HS256 yêu cầu; filter cắt chuỗi không kiểm tra `Bearer` | Dùng khóa tối thiểu 32 byte từ cấu hình, kiểm tra prefix và trả HTTP 401 khi token sai |
| Password reset gửi mail nhưng thiếu link | `resetLink` được tạo nhưng không nối vào body | Gắn URL và token vào nội dung mail, xóa token cũ của user |
| Subscription mapper lỗi kiểu User | Import nhầm `org.springframework.security.core.userdetails.User` | Dùng entity `modal.User` và gắn user vào Subscription |
| Subscription query lỗi | Sai tên tham số `toay/toady`, `where.s` | Sửa JPQL và `@Param` |
| Frontend không build | Sai đường dẫn My Reservations, nhiều import/component sai tên, Tailwind thiếu PostCSS | Sửa import/component và thêm cấu hình Tailwind/PostCSS |

## Database

File SQL ban đầu ở `D:\Codex\library_db.sql` chứa `genres`, `users`, `subscription_plans`, `subscriptions`, nhưng chưa có `books` và `password_reset_tokens`. Một số cột cũng không khớp Java:

- SQL dùng role `ADMIN`/`USER`; Java dùng `ROLE_ADMIN`/`ROLE_USER`.
- SQL cũ dùng `subscription_plans.title`, `duration_in_days`, `billing_cycle`; Java dùng `plan_code`, `name`, `duration_days`, giới hạn sách và giới hạn ngày mượn.
- Kiểu giá của plan cũ là `DECIMAL`, trong khi Subscription hiện lưu số nguyên đơn vị nhỏ nhất bằng `BIGINT`.

Schema chuẩn cho database **mới** đã được viết tại `database/library_db.sql`, gồm 6 bảng:

1. `genres`
2. `users`
3. `books`
4. `password_reset_tokens`
5. `subscription_plans`
6. `subscriptions`

Schema này khớp tên bảng/cột, khóa ngoại, enum và kiểu dữ liệu của entity hiện tại. Không chạy file này đè lên database đang có dữ liệu. Với database hiện tại, cần dump backup và đọc `SHOW CREATE TABLE` trước khi viết migration giữ dữ liệu.

## API hiện tại

- Auth: `/auth/signup`, `/auth/login`, `/auth/forgot-password`, `/auth/reset-password`.
- Books: `/api/books`, `/api/books/{id}`, `/api/books/search`, `/api/books/stats`; thao tác ghi cần quyền admin.
- Genres: `/api/genres`, `/api/genres/{id}`, `/api/genres/top-level`, `/api/genres/count`, `/api/genres/{id}/book-count`; thao tác ghi cần quyền admin.
- User: `/api/user/profile`; `/api/user/list` cần quyền admin.
- Subscription plans: `/api/subscription-plan`; các đường dẫn `/admin/**` cần quyền admin.
- Subscriptions: subscribe, active subscription và cancel cho user; list, activate và deactivate-expired cho admin.

## Kiểm tra đã chạy

- `mvn test`: thành công, 1 test, 0 failure, 0 error. Test dùng H2 memory riêng và đã khởi tạo đủ 6 repository, entity mapping, controller mapping, security beans và JPQL.
- `npm run lint`: thành công, không còn warning.
- `npm run build`: thành công. Bundle JS khoảng 569 kB và Vite chỉ cảnh báo nên tách chunk để tối ưu tải trang.
- `git diff --check`: dùng để kiểm tra lỗi whitespace trước khi chốt.

## Phần chưa triển khai theo tiến độ hiện tại

- Xác minh payment thật khi kích hoạt subscription; `paymentId` mới là đầu vào giữ chỗ cho module thanh toán.
- Backend Loan, Reservation, Fine và Wishlist chưa có dù frontend đã có màn hình/dữ liệu mẫu.
- Frontend chưa gọi API thật và chưa có luồng lưu JWT/login hoàn chỉnh.
- Chưa migration database MySQL đang có dữ liệu; schema mới chỉ là nguồn chuẩn cho database mới.
- Chưa cấu hình secret/mail/admin cho production. Dùng `application.properties.example` làm mẫu và cấp giá trị bằng biến môi trường.
