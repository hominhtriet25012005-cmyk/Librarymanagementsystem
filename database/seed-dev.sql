-- Dữ liệu mẫu dành cho môi trường phát triển.
-- Chạy sau database/library_db.sql. Script chỉ thêm bản ghi còn thiếu theo mã/ISBN.

USE library_db;

INSERT INTO genres (code, name, description, display_order, active)
SELECT 'VAN_HOC', 'Văn học', 'Tiểu thuyết, truyện ngắn và tác phẩm văn học.', 1, TRUE
WHERE NOT EXISTS (SELECT 1 FROM genres WHERE code = 'VAN_HOC');

INSERT INTO genres (code, name, description, display_order, active)
SELECT 'CONG_NGHE', 'Công nghệ thông tin', 'Lập trình, hệ thống và công nghệ số.', 2, TRUE
WHERE NOT EXISTS (SELECT 1 FROM genres WHERE code = 'CONG_NGHE');

INSERT INTO genres (code, name, description, display_order, active)
SELECT 'KINH_TE', 'Kinh tế', 'Kinh doanh, quản trị và tài chính.', 3, TRUE
WHERE NOT EXISTS (SELECT 1 FROM genres WHERE code = 'KINH_TE');

INSERT INTO genres (code, name, description, display_order, active)
SELECT 'KHOA_HOC', 'Khoa học', 'Khoa học tự nhiên và kiến thức phổ thông.', 4, TRUE
WHERE NOT EXISTS (SELECT 1 FROM genres WHERE code = 'KHOA_HOC');

INSERT INTO genres (code, name, description, display_order, active)
SELECT 'KY_NANG', 'Kỹ năng sống', 'Phát triển bản thân và kỹ năng thực hành.', 5, TRUE
WHERE NOT EXISTS (SELECT 1 FROM genres WHERE code = 'KY_NANG');

INSERT INTO genres (code, name, description, display_order, active)
SELECT 'LICH_SU', 'Lịch sử', 'Lịch sử Việt Nam và thế giới.', 6, TRUE
WHERE NOT EXISTS (SELECT 1 FROM genres WHERE code = 'LICH_SU');

INSERT INTO genres (code, name, description, display_order, active)
SELECT 'THIEU_NHI', 'Thiếu nhi', 'Sách truyện và kiến thức dành cho thiếu nhi.', 7, TRUE
WHERE NOT EXISTS (SELECT 1 FROM genres WHERE code = 'THIEU_NHI');

INSERT INTO books (
    isbn, title, author, genre_id, publisher, published_date, language,
    pages, description, total_copies, available_copies, price, cover_image_url, active
)
SELECT
    '9786041234501', 'Lập trình Java với Spring Boot', 'Nguyễn Minh An', id,
    'Nhà xuất bản Công nghệ', '2025-06-20', 'Tiếng Việt', 420,
    'Hướng dẫn xây dựng ứng dụng web với Java và Spring Boot.', 12, 12, 250000, NULL, TRUE
FROM genres
WHERE code = 'CONG_NGHE'
  AND NOT EXISTS (SELECT 1 FROM books WHERE isbn = '9786041234501');

INSERT INTO books (
    isbn, title, author, genre_id, publisher, published_date, language,
    pages, description, total_copies, available_copies, price, cover_image_url, active
)
SELECT
    '9786041234502', 'Kiến trúc phần mềm hiện đại', 'Trần Quốc Bình', id,
    'Nhà xuất bản Công nghệ', '2024-11-12', 'Tiếng Việt', 360,
    'Các nguyên tắc thiết kế và tổ chức hệ thống phần mềm có khả năng mở rộng.', 8, 6, 220000, NULL, TRUE
FROM genres
WHERE code = 'CONG_NGHE'
  AND NOT EXISTS (SELECT 1 FROM books WHERE isbn = '9786041234502');

INSERT INTO books (
    isbn, title, author, genre_id, publisher, published_date, language,
    pages, description, total_copies, available_copies, price, cover_image_url, active
)
SELECT
    '9786041234503', 'Quản trị vận hành thư viện', 'Lê Hải Yến', id,
    'Nhà xuất bản Tri thức', '2023-08-15', 'Tiếng Việt', 280,
    'Kiến thức nền tảng về quản trị, quy trình và dịch vụ thư viện.', 10, 9, 180000, NULL, TRUE
FROM genres
WHERE code = 'KINH_TE'
  AND NOT EXISTS (SELECT 1 FROM books WHERE isbn = '9786041234503');

INSERT INTO books (
    isbn, title, author, genre_id, publisher, published_date, language,
    pages, description, total_copies, available_copies, price, cover_image_url, active
)
SELECT
    '9786041234504', 'Dế Mèn phiêu lưu ký', 'Tô Hoài', id,
    'Nhà xuất bản Kim Đồng', '2022-01-10', 'Tiếng Việt', 192,
    'Tác phẩm văn học thiếu nhi quen thuộc của nhà văn Tô Hoài.', 15, 15, 95000, NULL, TRUE
FROM genres
WHERE code = 'THIEU_NHI'
  AND NOT EXISTS (SELECT 1 FROM books WHERE isbn = '9786041234504');

INSERT INTO books (
    isbn, title, author, genre_id, publisher, published_date, language,
    pages, description, total_copies, available_copies, price, cover_image_url, active
)
SELECT
    '9786041234505', 'Tư duy học tập hiệu quả', 'Phạm Gia Hưng', id,
    'Nhà xuất bản Giáo dục', '2025-02-18', 'Tiếng Việt', 240,
    'Phương pháp lập kế hoạch, ghi nhớ và duy trì thói quen học tập.', 10, 10, 145000, NULL, TRUE
FROM genres
WHERE code = 'KY_NANG'
  AND NOT EXISTS (SELECT 1 FROM books WHERE isbn = '9786041234505');

INSERT INTO subscription_plans (
    plan_code, name, description, duration_days, price, currency,
    max_books_allowed, max_days_per_book, display_order, is_active, is_featured, badge_text
)
SELECT 'BASIC_30', 'Bạn đọc cơ bản', 'Gói dùng thử trong 30 ngày.', 30, 99000, 'VND', 2, 14, 1, TRUE, FALSE, NULL
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE plan_code = 'BASIC_30');

INSERT INTO subscription_plans (
    plan_code, name, description, duration_days, price, currency,
    max_books_allowed, max_days_per_book, display_order, is_active, is_featured, badge_text
)
SELECT 'STANDARD_90', 'Bạn đọc tiêu chuẩn', 'Gói 90 ngày cho người đọc thường xuyên.', 90, 249000, 'VND', 5, 21, 2, TRUE, TRUE, 'Phổ biến'
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE plan_code = 'STANDARD_90');

INSERT INTO subscription_plans (
    plan_code, name, description, duration_days, price, currency,
    max_books_allowed, max_days_per_book, display_order, is_active, is_featured, badge_text
)
SELECT 'PREMIUM_365', 'Bạn đọc nâng cao', 'Gói một năm với hạn mức mượn cao.', 365, 799000, 'VND', 10, 30, 3, TRUE, FALSE, 'Tiết kiệm'
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE plan_code = 'PREMIUM_365');
