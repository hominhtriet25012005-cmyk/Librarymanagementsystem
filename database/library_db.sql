-- Canonical schema for a fresh Library Management System database.
-- Review and back up an existing database before applying structural changes.

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
