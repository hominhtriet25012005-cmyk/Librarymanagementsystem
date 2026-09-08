-- Schema tham chiếu cho một database Library Management System mới.
-- Hãy sao lưu database đang có dữ liệu trước khi áp dụng thay đổi cấu trúc.

CREATE DATABASE IF NOT EXISTS library_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE library_db;

CREATE TABLE IF NOT EXISTS genres (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    display_order INT NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    parent_genre_id BIGINT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_genres_parent FOREIGN KEY (parent_genre_id) REFERENCES genres(id)
        ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    role ENUM('ROLE_USER', 'ROLE_ADMIN') NOT NULL DEFAULT 'ROLE_USER',
    auth_provider ENUM('LOCAL', 'GOOGLE') NOT NULL DEFAULT 'LOCAL',
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    google_id VARCHAR(255) NULL UNIQUE,
    profile_image VARCHAR(500),
    password VARCHAR(255),
    last_login DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS books (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    isbn VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    genre_id BIGINT NOT NULL,
    publisher VARCHAR(100),
    published_date DATE,
    language VARCHAR(20),
    pages INT,
    description VARCHAR(2000),
    total_copies INT NOT NULL,
    available_copies INT NOT NULL,
    price DECIMAL(12,2),
    cover_image_url VARCHAR(500),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_books_genre_active (genre_id, active),
    CONSTRAINT chk_books_total_copies CHECK (total_copies >= 0),
    CONSTRAINT chk_books_available_copies CHECK (
        available_copies >= 0 AND available_copies <= total_copies
    ),
    CONSTRAINT fk_books_genre FOREIGN KEY (genre_id) REFERENCES genres(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    expiry_date DATETIME NOT NULL,
    CONSTRAINT fk_password_reset_tokens_user FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS subscription_plans (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    plan_code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    duration_days INT NOT NULL,
    price BIGINT NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    max_books_allowed INT NOT NULL,
    max_days_per_book INT NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    badge_text VARCHAR(255),
    admin_notes VARCHAR(255),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(150),
    updated_by VARCHAR(150),
    CONSTRAINT chk_subscription_plans_duration CHECK (duration_days > 0),
    CONSTRAINT chk_subscription_plans_price CHECK (price > 0),
    CONSTRAINT chk_subscription_plans_max_books CHECK (max_books_allowed > 0),
    CONSTRAINT chk_subscription_plans_max_days CHECK (max_days_per_book > 0)
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    plan_id BIGINT NOT NULL,
    plan_name VARCHAR(100) NOT NULL,
    plan_code VARCHAR(100) NOT NULL,
    price BIGINT NOT NULL,
    currency VARCHAR(3) NOT NULL,
    max_books_allowed INT NOT NULL,
    max_days_per_book INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    auto_renew BOOLEAN NOT NULL DEFAULT FALSE,
    cancelled_at DATETIME NULL,
    cancellation_reason TEXT NULL,
    notes TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_subscriptions_user_active_dates (user_id, is_active, start_date, end_date),
    CONSTRAINT chk_subscriptions_max_books CHECK (max_books_allowed > 0),
    CONSTRAINT chk_subscriptions_max_days CHECK (max_days_per_book > 0),
    CONSTRAINT fk_subscriptions_user FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_subscriptions_plan FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS book_loans (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    book_id BIGINT NOT NULL,
    type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    checkout_date DATE NOT NULL,
    due_date DATE NOT NULL,
    return_date DATE NULL,
    renewal_count INT NOT NULL DEFAULT 0,
    max_renewals INT NOT NULL DEFAULT 2,
    notes VARCHAR(500),
    is_overdue BOOLEAN NOT NULL DEFAULT FALSE,
    overdue_days INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_book_loan_user_status (user_id, status),
    INDEX idx_book_loan_book_status (book_id, status),
    INDEX idx_book_loan_due_date (due_date),
    CONSTRAINT chk_book_loans_renewals CHECK (renewal_count >= 0 AND max_renewals >= 0),
    CONSTRAINT chk_book_loans_overdue_days CHECK (overdue_days >= 0),
    CONSTRAINT fk_book_loans_user FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_book_loans_book FOREIGN KEY (book_id) REFERENCES books(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS book_reviews (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    book_id BIGINT NOT NULL,
    rating INT NOT NULL,
    review_text VARCHAR(2000) NOT NULL,
    title VARCHAR(200),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uk_review_user_book UNIQUE (user_id, book_id),
    INDEX idx_review_book_created (book_id, created_at),
    CONSTRAINT chk_book_reviews_rating CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT fk_book_reviews_user FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_book_reviews_book FOREIGN KEY (book_id) REFERENCES books(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS fines (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    book_loan_id BIGINT NOT NULL,
    type VARCHAR(30) NOT NULL,
    amount BIGINT NOT NULL,
    amount_paid BIGINT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL,
    reason VARCHAR(500),
    notes VARCHAR(1000),
    waived_by_id BIGINT NULL,
    waived_at DATETIME NULL,
    waiver_reason VARCHAR(500),
    paid_at DATETIME NULL,
    processed_by_user_id BIGINT NULL,
    transaction_id VARCHAR(100),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uk_fine_book_loan_type UNIQUE (book_loan_id, type),
    INDEX idx_fine_user_status (user_id, status),
    INDEX idx_fine_book_loan (book_loan_id),
    CONSTRAINT chk_fines_amount CHECK (amount > 0),
    CONSTRAINT chk_fines_amount_paid CHECK (amount_paid >= 0 AND amount_paid <= amount),
    CONSTRAINT fk_fines_user FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_fines_book_loan FOREIGN KEY (book_loan_id) REFERENCES book_loans(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_fines_waived_by FOREIGN KEY (waived_by_id) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_fines_processed_by FOREIGN KEY (processed_by_user_id) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS reservations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    book_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    reserved_at DATETIME NOT NULL,
    available_at DATETIME NULL,
    available_until DATETIME NULL,
    fulfilled_at DATETIME NULL,
    cancelled_at DATETIME NULL,
    queue_position INT NULL,
    notification_sent BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_reservation_book_status_time (book_id, status, reserved_at),
    INDEX idx_reservation_user_status (user_id, status),
    CONSTRAINT chk_reservations_queue CHECK (queue_position IS NULL OR queue_position > 0),
    CONSTRAINT fk_reservations_user FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_reservations_book FOREIGN KEY (book_id) REFERENCES books(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS wishlists (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    book_id BIGINT NOT NULL,
    added_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes VARCHAR(500),
    CONSTRAINT uk_wishlist_user_book UNIQUE (user_id, book_id),
    CONSTRAINT fk_wishlists_user FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_wishlists_book FOREIGN KEY (book_id) REFERENCES books(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    subscription_id BIGINT NULL,
    fine_id BIGINT NULL,
    payment_type VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL,
    gateway VARCHAR(20) NOT NULL,
    amount BIGINT NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    transaction_id VARCHAR(50) NOT NULL,
    gateway_payment_id VARCHAR(100) NULL,
    gateway_order_id VARCHAR(100),
    gateway_signature VARCHAR(500),
    description VARCHAR(500),
    failure_reason VARCHAR(1000),
    initiated_at DATETIME NOT NULL,
    completed_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uk_payment_transaction_id UNIQUE (transaction_id),
    CONSTRAINT uk_payment_gateway_payment_id UNIQUE (gateway_payment_id),
    CONSTRAINT chk_payments_amount CHECK (amount > 0),
    CONSTRAINT fk_payments_user FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_payments_subscription FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_payments_fine FOREIGN KEY (fine_id) REFERENCES fines(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
);
