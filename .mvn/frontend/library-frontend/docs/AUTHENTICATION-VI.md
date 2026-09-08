# Giai đoạn 1 — Tài khoản và giao diện tiếng Việt

## Đã triển khai

- Đăng nhập `/login`, đăng ký `/signup`.
- Quên mật khẩu `/forgot-password`, đặt lại mật khẩu `/reset-password?token=...`.
- Hồ sơ thật tại `/profile`; menu tài khoản và đăng xuất.
- Khôi phục phiên bằng GET `/api/user/profile`, kiểm tra hạn JWT, tự đăng xuất, đồng bộ giữa các tab.
- Kiểm soát trang riêng tư và trang quản trị tại `/admin`. Màn hình quản trị nghiệp vụ sẽ làm sau.
- Tất cả nhãn, nút, lỗi biểu mẫu, trạng thái và hướng dẫn trên các màn hình hiện có đã chuyển sang tiếng Việt.
- Ngày tháng theo `vi-VN`; số tiền giữ nguyên đơn vị INR của backend, không tự chuyển thành VND.
- Tên sách, tác giả và nội dung dữ liệu do backend cung cấp giữ nguyên bản gốc.

## API được sử dụng

| Thao tác | API | Dữ liệu |
|---|---|---|
| Đăng nhập | POST /auth/login | email, password |
| Đăng ký | POST /auth/signup | fullName, email, phone, password |
| Hồ sơ | GET /api/user/profile | Header Authorization |
| Quên mật khẩu | POST /auth/forgot-password | email |
| Đặt lại mật khẩu | POST /auth/reset-password | token, password |

AuthProvider quản lý phiên, authApi chỉ gửi yêu cầu. JWT được lưu dưới khóa `library_access_token`; mật khẩu và hồ sơ không được lưu trong localStorage. Quyền lấy từ hồ sơ backend, không lấy từ payload JWT chưa xác minh.

Khi hồ sơ không tải được vì mất mạng, các trang riêng tư hiển thị nút Thử lại. HTTP 401 chỉ vô hiệu hóa đúng token của yêu cầu thất bại; phản hồi muộn của phiên cũ không đăng xuất phiên mới. HTTP 403 từ nghiệp vụ không xóa phiên.

Backend tiếp tục quyết định quyền truy cập API. Route guard ở frontend chỉ điều khiển giao diện.

## Chạy và kiểm tra

Từ `D:\Codex\Library-Management-System\.mvn\frontend\library-frontend`:

```powershell
npm run dev
npm run lint
npm test
npm run build
```

Frontend mặc định ở http://localhost:5173. Biến `VITE_API_BASE_URL` mặc định là http://localhost:8080. Nếu đổi cổng/host frontend, phải đồng bộ `app.cors.allowed-origins` và `app.frontend-url` ở backend. Không ghi đè file .env đang có.

## Kiểm tra thủ công

1. Mở /my-loans khi chưa đăng nhập: chuyển đến /login.
2. Đăng nhập: quay về đúng trang ban đầu; tải lại trang vẫn lấy được hồ sơ.
3. Mở menu tài khoản: đúng tên người dùng; đăng xuất xóa phiên và đóng trang riêng tư.
4. Đăng nhập bằng bạn đọc, mở /admin: hiển thị không đủ quyền.
5. Đăng nhập quản trị viên: truy cập được /admin.
6. Mở /signup: kiểm tra email, họ tên, độ dài mật khẩu và xác nhận mật khẩu.
7. Mở /forgot-password, yêu cầu email trên môi trường kiểm thử. Liên kết backend có hiệu lực 5 phút.
8. Mở /reset-password không có token: không được gửi đổi mật khẩu.
9. Dùng liên kết hợp lệ: gửi trường password; sau thành công quay lại đăng nhập.
10. Mở hai tab; đăng xuất một tab: tab còn lại mất quyền truy cập trang riêng tư.

Kết quả: 26/26 test đạt, lint sạch và production build thành công. Các test tự động dùng Axios adapter giả lập và DOM thử nghiệm; không gửi email hoặc thay đổi MySQL thật. Đã kiểm tra trực tiếp màn hình đăng nhập/đăng ký, lỗi biểu mẫu trống và thông báo thiếu token trong trình duyệt. Tích hợp với MySQL và dịch vụ gửi email thật cần kiểm tra ở môi trường đã cấu hình riêng.

Dashboard vẫn dùng dữ liệu minh họa. Các trang phiếu mượn, đặt trước, yêu thích, đánh giá và tiền phạt đã kết nối backend trong giai đoạn 3; xem [hướng dẫn hoạt động thư viện](LIBRARY-ACTIVITY-VI.md).

## Tài liệu kỹ thuật tham khảo

- [Axios: interceptors](https://axios-http.com/docs/interceptors)
- [React: useEffect và xử lý phản hồi đến muộn](https://react.dev/reference/react/useEffect)
- [Vitest: môi trường DOM kiểm thử](https://vitest.dev/config/environment)
