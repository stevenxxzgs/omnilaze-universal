-- 免单系统数据库迁移
-- 执行时间: 2025-07-26

-- 创建免单配置表
CREATE TABLE IF NOT EXISTS free_drink_config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    total_quota INTEGER NOT NULL DEFAULT 100,
    used_quota INTEGER NOT NULL DEFAULT 0,
    remaining_quota INTEGER GENERATED ALWAYS AS (total_quota - used_quota) STORED,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 初始化免单配置
INSERT OR IGNORE INTO free_drink_config (id, total_quota, used_quota) 
VALUES (1, 100, 0);

-- 创建用户免单记录表
CREATE TABLE IF NOT EXISTS user_free_drinks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    claimed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    order_id TEXT NULL,
    status TEXT NOT NULL DEFAULT 'claimed' CHECK (status IN ('claimed', 'used', 'expired')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id) -- 每个用户只能领取一次免单
);

-- 为users表添加免单相关字段
ALTER TABLE users ADD COLUMN free_drink_eligible BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN free_drink_claimed BOOLEAN DEFAULT FALSE;

-- 创建触发器：更新免单配置的updated_at字段
CREATE TRIGGER IF NOT EXISTS update_free_drink_config_timestamp
AFTER UPDATE ON free_drink_config
FOR EACH ROW
BEGIN
    UPDATE free_drink_config SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_user_free_drinks_user_id ON user_free_drinks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_free_drinks_status ON user_free_drinks(status);
CREATE INDEX IF NOT EXISTS idx_users_free_drink_eligible ON users(free_drink_eligible);
CREATE INDEX IF NOT EXISTS idx_users_free_drink_claimed ON users(free_drink_claimed);