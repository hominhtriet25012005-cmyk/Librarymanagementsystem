# Quy tắc làm việc với project thư viện

- Trao đổi bằng tiếng Việt. Đọc mã nguồn liên quan trước khi sửa.
- Bắt đầu bằng `git status --short --branch` và kiểm tra diff. Giữ nguyên các thay đổi người dùng đang làm; không tự đưa chúng vào commit của mình.
- Mỗi yêu cầu chia thành thay đổi nhỏ, kiểm tra phù hợp, xem lại diff rồi tạo commit cục bộ cho phần đã hoàn thành. Yêu cầu chỉ xem/review thì không sửa hoặc commit mã nguồn.
- Trước khi sửa code trên `main`, tạo nhánh công việc có tên mô tả. Không tự chuyển nhánh khi có thay đổi chưa rõ nguồn gốc; không tự stash hoặc bỏ thay đổi của người dùng.
- Stage từng file liên quan; kiểm tra `git diff --cached` trước khi commit. Không dùng `git add .` khi có thay đổi ngoài phạm vi.
- Không tự chạy `git reset --hard`, `git clean -fd`, force push, xóa nhánh, xóa thư mục hoặc ghi đè file chưa lưu. Ưu tiên khôi phục ra thư mục mới hoặc revert commit cụ thể sau khi người dùng yêu cầu.
- Giữ nguyên sandbox và cơ chế hỏi quyền. Không bật chế độ bỏ qua xác nhận. Việc push, công khai repo, triển khai, hoặc thay đổi dữ liệu thật cần được người dùng cho phép.
- Không commit mật khẩu, token, `.env`, cấu hình local hoặc bản sao lưu chứa thông tin đăng nhập. Không in bí mật ra log.
- Không tự chạy SQL thay đổi dữ liệu hoặc khởi động ứng dụng vào database thật để kiểm tra. Cấu hình hiện tại dùng `ddl-auto=update`; việc khởi động có thể đổi schema.
- Không sửa frontend khi yêu cầu chỉ liên quan backend, trừ phần kết nối bắt buộc và phải giải thích.
- Không nâng dependency hoặc di chuyển cấu trúc project nếu không cần cho yêu cầu hiện tại.
- Sau mỗi thay đổi, báo rõ đã sửa gì, kiểm tra nào đã chạy và kết quả. Lỗi môi trường hoặc lỗi có sẵn phải ghi rõ; không báo test thành công khi chưa chạy.

## Cấu trúc và kiểm tra

- Backend: `src/main/java`, Java 17 trong `pom.xml`, Spring Boot, JPA, MySQL.
- Frontend: `.mvn/frontend/library-frontend`, React + Vite. Giữ nguyên vị trí hiện tại.
- Backend compile: `.\mvnw.cmd -DskipTests compile` từ gốc repo.
- Backend test: `.\mvnw.cmd test`, chỉ khi đã cấu hình database thử nghiệm. Test `contextLoads` hiện tải cả Spring context.
- Frontend: `npm run lint`, `npm run build` từ thư mục frontend khi thay đổi frontend.
- Thay đổi tài liệu/Git: kiểm tra diff, danh sách file được track và các quy tắc ignore; không cần khởi động ứng dụng.
- Mốc `baseline-2026-09-03` lưu code đang viết dở, không phải bản đã build/test đạt. Xem `docs/SAFE-WORKFLOW.md`.
