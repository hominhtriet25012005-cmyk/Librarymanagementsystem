# Làm việc an toàn với project thư viện

## Đã thiết lập ngày 03/09/2026

- Git tại `D:\Codex\Library-Management-System`, nhánh `main`.
- Do tài khoản sandbox Windows tạo `.git`, đã thêm riêng `D:/Codex/Library-Management-System` vào `safe.directory` trong cấu hình Git của người dùng. Không dùng ký tự `*` hoặc tắt kiểm tra cho các project khác; không đổi chế độ hỏi quyền của AI.
- Tag `baseline-2026-09-03` đánh dấu bản code đang viết dở trước khi sửa backend.
- Backend và frontend cùng được lưu trong repository; frontend hiện nằm trong `.mvn/frontend/library-frontend`.
- `database/library_db.sql` là bản sao nguyên trạng của `D:\Codex\library_db.sql`. Chưa chạy SQL này.
- Bản sao lưu trước thiết lập: `D:\Codex\backups\library-before-git-20260903-165939.zip`. Đã đối chiếu SHA-256 của 76 file. Bao gồm mã nguồn, tài nguyên, cấu hình ứng dụng local và file SQL; loại trừ dependency, kết quả build và cấu hình IDE.
- ZIP này chứa cấu hình local có thể có mật khẩu: giữ riêng, không tải công khai.
- Git hiện chỉ ở máy này. Git và ZIP trên cùng ổ đĩa không bảo vệ khi ổ hỏng; cần thêm bản sao ở ổ khác hoặc remote riêng tư được bạn lựa chọn.
- File SQL chỉ có định nghĩa cấu trúc, không phải bản sao dữ liệu MySQL đang chạy. Dữ liệu database phải được sao lưu riêng trước khi sửa schema.

## Bắt đầu mỗi việc

Mở đúng thư mục `D:\Codex\Library-Management-System` trong công cụ AI/IDE.
Codex dùng `AGENTS.md` làm hướng dẫn project theo [tài liệu OpenAI](https://learn.chatgpt.com/docs/agent-configuration/agents-md).
`CLAUDE.md` dẫn về cùng bộ quy tắc để dùng khi mở project với Claude. Các file hướng dẫn không thay thế cơ chế kiểm soát quyền của ứng dụng.

Trong PowerShell:

```powershell
Set-Location 'D:\Codex\Library-Management-System'
git status --short --branch
git log --oneline -5
```

Nếu có thay đổi chưa commit, xem chúng trước khi làm tiếp. Khi đang sạch, tạo nhánh cho một việc cụ thể, ví dụ:

```powershell
git switch -c fix/genre-create
```

Tên nhánh ví dụ chỉ dùng khi chưa có nhánh đó. Mỗi yêu cầu nên nhỏ: “Sửa hàm tạo thể loại, chạy kiểm tra liên quan và tạo commit; giữ nguyên các chức năng khác”.

## Lưu một mốc sau khi kiểm tra

```powershell
git diff
git status --short
```

Stage đúng file vừa sửa, xem `git diff --cached`, rồi `git commit -m "fix: describe the change"`.
Không đưa thay đổi chưa kiểm tra hoặc file người dùng đang sửa dở vào cùng commit.
Nếu kiểm tra bị chặn, ghi rõ trong kết quả và mô tả commit; mốc lưu không đồng nghĩa với bản chạy tốt.

## Khôi phục mà vẫn giữ bản đang làm

Để xuất bản code ban đầu ra file ZIP mới, không ghi đè thư mục hiện tại:

```powershell
Set-Location 'D:\Codex\Library-Management-System'
$restoreZip = Join-Path 'D:\Codex\backups' ('library-baseline-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.zip')
git archive --format=zip --output=$restoreZip baseline-2026-09-03
```

Giải nén vào một thư mục mới để đối chiếu. ZIP từ Git không có mật khẩu và file cấu hình local.
Muốn hủy một thay đổi đã commit, yêu cầu AI kiểm tra đúng commit và dùng `git revert` để tạo commit đảo ngược; lưu các thay đổi đang làm trước. Không dùng lệnh reset/clean để thử vận may.

## Cấu hình ứng dụng

`src/main/resources/application.properties` hiện được giữ nguyên trên máy và bỏ qua trong Git.
File `application.properties.example` là mẫu đã bỏ mật khẩu. Khi lấy project ở máy mới, sao chép mẫu thành `application.properties` nếu file đích chưa tồn tại, rồi cấu hình thông tin MySQL của máy đó.
Các thay đổi cấu hình dùng chung cần cập nhật cả file mẫu. File local không được Git bảo vệ; sao lưu riêng sau khi thay đổi.

## Tình trạng kiểm tra ở mốc ban đầu

- Đã thử compile khi review: Maven dừng ở lỗi liên quan `logback-classic` trong cache; chưa xác nhận ứng dụng chạy.
- Maven cảnh báo scope `annotationProcessor` của Lombok không hợp lệ.
- Code có các điểm chưa khớp giữa mapper/entity/DTO và tên method của GenreService; BookServiceImpl còn là khung.
- Chưa chạy ứng dụng hoặc test có kết nối database trong lần setup này.
- `test.http` dùng cổng 8083, cấu hình backend hiện dùng cổng 5000.

## Khi công cụ hỏi quyền

Đọc lệnh, thư mục đích và tác động trước khi đồng ý. Chỉ cấp quyền cần cho việc đang làm; giữ cơ chế hỏi quyền và sandbox. Nếu không hiểu một lệnh xóa, ghi đè, push hoặc thay đổi dữ liệu, yêu cầu AI giải thích trước.
