-- 添加用户序号字段迁移
-- 执行时间: 2025-07-26

-- 为users表添加user_sequence字段（先不添加UNIQUE约束）
ALTER TABLE users ADD COLUMN user_sequence INTEGER;

-- 创建序列计数器表（用于生成递增的用户序号）
CREATE TABLE IF NOT EXISTS user_sequence_counter (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    current_sequence INTEGER NOT NULL DEFAULT 0
);

-- 初始化序列计数器
INSERT OR IGNORE INTO user_sequence_counter (id, current_sequence) VALUES (1, 0);

-- 为现有用户分配序号（按创建时间排序）
UPDATE users SET user_sequence = (
    SELECT ROW_NUMBER() OVER (ORDER BY created_at ASC)
    FROM users AS u2 
    WHERE u2.id = users.id
) WHERE user_sequence IS NULL;

-- 更新序列计数器到当前最大值
UPDATE user_sequence_counter 
SET current_sequence = (SELECT COALESCE(MAX(user_sequence), 0) FROM users)
WHERE id = 1;

-- 创建触发器：自动为新用户分配序号
CREATE TRIGGER IF NOT EXISTS assign_user_sequence
AFTER INSERT ON users
FOR EACH ROW
WHEN NEW.user_sequence IS NULL
BEGIN
    -- 更新序列计数器
    UPDATE user_sequence_counter SET current_sequence = current_sequence + 1 WHERE id = 1;
    
    -- 为新用户分配序号
    UPDATE users 
    SET user_sequence = (SELECT current_sequence FROM user_sequence_counter WHERE id = 1)
    WHERE id = NEW.id;
END;

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_users_sequence ON users(user_sequence);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);