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
npm run build
```

## Cấu trúc chính

```text
src/
├── api/                  # Axios client và các hàm gọi backend
├── components/common/    # Component dùng chung
├── layouts/UserLayout/   # Bố cục, thanh điều hướng và sidebar
└── pages/                # Các màn hình theo module nghiệp vụ
```

`src/api/httpClient.js` đảm nhiệm:

- Đọc địa chỉ backend từ `VITE_API_BASE_URL`.
- Tự gắn JWT vào header `Authorization`.
- Xóa phiên đăng nhập khi backend trả về HTTP 401.
- Chuẩn hóa thông báo lỗi để giao diện hiển thị bằng tiếng Việt.

Trang Kho sách đã dùng API thật `/api/books` và `/api/genres`. Loans, Reservations, Dashboard vẫn còn dữ liệu mẫu và sẽ được thay lần lượt trong các giai đoạn tiếp theo.

## Các giai đoạn tiếp theo

1. Hoàn thiện đăng ký, đăng nhập, quên và đặt lại mật khẩu.
2. Hoàn thiện chi tiết sách, mượn sách và đặt trước.
3. Kết nối Loans, Reservations, Wishlist, Reviews và Fines.
4. Kết nối Subscription và Razorpay.
5. Xây dựng giao diện quản trị.
6. Bổ sung kiểm thử giao diện và kiểm thử luồng nghiệp vụ.
