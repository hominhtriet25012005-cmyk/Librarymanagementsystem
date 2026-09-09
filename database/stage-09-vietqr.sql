-- Chạy một lần trên database đã được tạo từ các giai đoạn trước.
-- Script có thể chạy lại: mỗi cột và khóa ngoại đều được kiểm tra trước khi thêm.

DELIMITER $$

DROP PROCEDURE IF EXISTS migrate_stage09_vietqr$$
CREATE PROCEDURE migrate_stage09_vietqr()
BEGIN
    -- Một số database được tạo theo bản hướng dẫn cũ còn cột title bắt buộc.
    -- Backend hiện dùng name; chuyển dữ liệu sang name rồi xóa cột title dư thừa.
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = 'subscription_plans'
          AND column_name = 'title'
    ) THEN
        UPDATE subscription_plans
        SET name = title
        WHERE (name IS NULL OR TRIM(name) = '') AND title IS NOT NULL;

        ALTER TABLE subscription_plans DROP COLUMN title;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'subscription_plans'
          AND column_name = 'duration_in_days'
    ) THEN
        UPDATE subscription_plans
        SET duration_days = duration_in_days
        WHERE duration_days IS NULL OR duration_days <= 0;
        ALTER TABLE subscription_plans DROP COLUMN duration_in_days;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'subscription_plans'
          AND column_name = 'active'
    ) THEN
        UPDATE subscription_plans SET is_active = active WHERE is_active IS NULL;
        ALTER TABLE subscription_plans DROP COLUMN active;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'subscription_plans'
          AND column_name = 'billing_cycle'
    ) THEN
        ALTER TABLE subscription_plans DROP COLUMN billing_cycle;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'subscription_plans'
          AND column_name = 'trial_days'
    ) THEN
        ALTER TABLE subscription_plans DROP COLUMN trial_days;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'subscription_plans'
          AND column_name = 'max_users_allowed'
    ) THEN
        ALTER TABLE subscription_plans DROP COLUMN max_users_allowed;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'subscription_plans'
          AND column_name = 'features'
    ) THEN
        ALTER TABLE subscription_plans DROP COLUMN features;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'subscription_plans'
          AND column_name = 'auto_renew'
    ) THEN
        ALTER TABLE subscription_plans DROP COLUMN auto_renew;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'payments' AND column_name = 'payer_reference'
    ) THEN
        ALTER TABLE payments ADD COLUMN payer_reference VARCHAR(100) NULL AFTER gateway_payment_id;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'payments' AND column_name = 'submitted_at'
    ) THEN
        ALTER TABLE payments ADD COLUMN submitted_at DATETIME NULL AFTER completed_at;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'payments' AND column_name = 'reviewed_by_id'
    ) THEN
        ALTER TABLE payments ADD COLUMN reviewed_by_id BIGINT NULL AFTER submitted_at;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'payments' AND column_name = 'reviewed_at'
    ) THEN
        ALTER TABLE payments ADD COLUMN reviewed_at DATETIME NULL AFTER reviewed_by_id;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_schema = DATABASE()
          AND table_name = 'payments'
          AND constraint_name = 'fk_payments_reviewed_by'
    ) THEN
        ALTER TABLE payments
            ADD CONSTRAINT fk_payments_reviewed_by
            FOREIGN KEY (reviewed_by_id) REFERENCES users(id)
            ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END$$

CALL migrate_stage09_vietqr()$$
DROP PROCEDURE migrate_stage09_vietqr$$

DELIMITER ;

ALTER TABLE payments ALTER COLUMN currency SET DEFAULT 'VND';
ALTER TABLE subscription_plans ALTER COLUMN currency SET DEFAULT 'VND';
ALTER TABLE subscription_plans
    MODIFY COLUMN display_order INT NOT NULL DEFAULT 0,
    MODIFY COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE,
    MODIFY COLUMN is_featured BOOLEAN NOT NULL DEFAULT FALSE;

-- Dữ liệu mẫu cũ ghi INR dù giá được nhập theo đồng Việt Nam.
UPDATE subscription_plans SET currency = 'VND' WHERE currency = 'INR';
UPDATE subscriptions SET currency = 'VND' WHERE currency = 'INR';
UPDATE payments SET currency = 'VND' WHERE currency = 'INR';
