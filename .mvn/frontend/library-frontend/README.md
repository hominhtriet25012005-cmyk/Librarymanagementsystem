# Library Frontend

Frontend React + Vite cho hệ thống quản lý thư viện. Theo quy tắc của repository, mã nguồn frontend được giữ tại:

```text
D:\Codex\Library-Management-System\.mvn\frontend\library-frontend
```

## Chạy trên máy local

Backend cần chạy tại `http://localhost:8080` và frontend mặc định chạy tại `http://localhost:5173`.

```powershell
cd D:\Codex\Library-Management-System\.mvn\frontend\library-frontend
Copy-Item .env.example .env
npm install
npm run dev
```

Nội dung `.env`:

```dotenv
VITE_API_BASE_URL=http://localhost:8080
```

## Kiểm tra mã nguồn

```powershell
npm run lint
npm test
npm run build
```

## Cấu trúc chính

```text
src/
├── api/                  # Axios client và các hàm gọi backend
├── auth/                 # Quản lý phiên và phân quyền route
├── utils/                # Định dạng ngày tháng, tiền và trạng thái
├── components/common/    # Component dùng chung
├── layouts/UserLayout/   # Bố cục, thanh điều hướng và sidebar
└── pages/                # Các màn hình theo module nghiệp vụ
```

`src/api/httpClient.js` đảm nhiệm:

- Đọc địa chỉ backend từ `VITE_API_BASE_URL`.
- Tự gắn JWT vào header `Authorization`.
- Xóa phiên đăng nhập khi backend trả về HTTP 401.
- Chuẩn hóa thông báo lỗi để giao diện hiển thị bằng tiếng Việt.

Kho sách và Chi tiết sách đã dùng API thật. Từ `/books`, chọn **Xem chi tiết** để mượn sách hoặc đặt trước bằng tài khoản đang đăng nhập. Trang chi tiết đọc các phiếu và gói thành viên thật để kiểm tra điều kiện, rồi hiển thị mã phiếu khi thao tác thành công.

Các trang **Sách tôi đã mượn**, **Sách đã đặt trước**, **Yêu thích**, **Tiền phạt** và phần **Đánh giá** trong chi tiết sách đã dùng API thật. Trang **Tổng quan** vẫn hiển thị dữ liệu minh họa có thông báo và sẽ được thay khi xây dựng thống kê tổng hợp.

## Các giai đoạn tiếp theo

1. Đã hoàn thiện tài khoản và Việt hóa giao diện. Xem [hướng dẫn giai đoạn 1](docs/AUTHENTICATION-VI.md).
2. Đã hoàn thiện chi tiết sách, mượn sách và đặt trước. Xem [hướng dẫn giai đoạn 2](docs/BOOKS-VI.md).
3. Đã kết nối Loans, Reservations, Wishlist, Reviews và Fines. Xem [hướng dẫn giai đoạn 3](docs/LIBRARY-ACTIVITY-VI.md).
4. Kết nối Subscription và Razorpay.
5. Xây dựng giao diện quản trị.
6. Bổ sung kiểm thử giao diện và kiểm thử luồng nghiệp vụ.
