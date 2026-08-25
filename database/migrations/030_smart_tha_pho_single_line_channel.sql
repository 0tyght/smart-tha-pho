USE prms_tsm;

SET NAMES utf8mb4;

ALTER TABLE system_line_channels
    MODIFY channel_kind ENUM('SMART', 'CITIZEN', 'DRIVER') NOT NULL;

INSERT IGNORE INTO system_line_channels (
    channel_kind,
    display_name,
    basic_id,
    channel_id,
    channel_secret_encrypted,
    access_token_encrypted,
    enabled,
    last_tested_at,
    last_test_status,
    last_test_message,
    updated_by,
    created_at,
    updated_at
)
SELECT
    'SMART',
    display_name,
    basic_id,
    channel_id,
    channel_secret_encrypted,
    access_token_encrypted,
    enabled,
    last_tested_at,
    last_test_status,
    last_test_message,
    updated_by,
    created_at,
    updated_at
FROM system_line_channels
WHERE channel_kind = 'CITIZEN';

INSERT IGNORE INTO system_line_channels (
    channel_kind,
    display_name,
    basic_id,
    channel_id,
    channel_secret_encrypted,
    access_token_encrypted,
    enabled,
    last_tested_at,
    last_test_status,
    last_test_message,
    updated_by,
    created_at,
    updated_at
)
SELECT
    'SMART',
    display_name,
    basic_id,
    channel_id,
    channel_secret_encrypted,
    access_token_encrypted,
    enabled,
    last_tested_at,
    last_test_status,
    last_test_message,
    updated_by,
    created_at,
    updated_at
FROM system_line_channels
WHERE channel_kind = 'DRIVER';

DELETE FROM system_line_channels
WHERE channel_kind IN ('CITIZEN', 'DRIVER');

ALTER TABLE system_line_channels
    MODIFY channel_kind ENUM('SMART') NOT NULL;

SELECT 'Migration 030 Smart Tha Pho single LINE channel completed successfully' AS migration_status;
