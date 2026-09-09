-- Chạy một lần trên database đã được tạo từ các giai đoạn trước.
-- Script có thể chạy lại: mỗi cột và khóa ngoại đều được kiểm tra trước khi thêm.

DELIMITER $$

DROP PROCEDURE IF EXISTS migrate_stage09_vietqr$$
CREATE PROCEDURE migrate_stage09_vietqr()
BEGIN
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

-- Dữ liệu mẫu cũ ghi INR dù giá được nhập theo đồng Việt Nam.
UPDATE subscription_plans SET currency = 'VND' WHERE currency = 'INR';
UPDATE subscriptions SET currency = 'VND' WHERE currency = 'INR';
UPDATE payments SET currency = 'VND' WHERE currency = 'INR';
