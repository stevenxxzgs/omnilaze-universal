-- 为orders表添加用户序号字段
-- 执行时间: 2025-07-26

-- 为orders表添加user_sequence字段
ALTER TABLE orders ADD COLUMN user_sequence INTEGER;

-- 更新现有订单的用户序号（从users表获取）
UPDATE orders 
SET user_sequence = (
    SELECT user_sequence 
    FROM users 
    WHERE users.id = orders.user_id
)
WHERE user_sequence IS NULL;

-- 创建触发器：在创建新订单时自动填充用户序号
CREATE TRIGGER IF NOT EXISTS set_order_user_sequence
AFTER INSERT ON orders
FOR EACH ROW
WHEN NEW.user_sequence IS NULL
BEGIN
    UPDATE orders 
    SET user_sequence = (
        SELECT user_sequence 
        FROM users 
        WHERE users.id = NEW.user_id
    )
    WHERE id = NEW.id;
END;

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_orders_user_sequence ON orders(user_sequence);
CREATE INDEX IF NOT EXISTS idx_orders_user_sequence_date ON orders(user_sequence, order_date);