-- 添加用户序号字段到订单表
-- Migration 002: Add user sequence number to orders table

-- 添加用户序号列
ALTER TABLE orders ADD COLUMN user_sequence_number INTEGER;

-- 创建用户序号的索引
CREATE INDEX idx_orders_user_sequence ON orders(user_id, user_sequence_number);

-- 为现有订单设置序号（按创建时间排序）
-- 注意：这个查询会为每个用户的现有订单按时间顺序分配序号
UPDATE orders 
SET user_sequence_number = (
    SELECT ROW_NUMBER() OVER (
        PARTITION BY user_id 
        ORDER BY created_at ASC
    )
    FROM (
        SELECT user_id, id, created_at 
        FROM orders o2 
        WHERE o2.user_id = orders.user_id 
        AND o2.id = orders.id
    )
)
WHERE user_sequence_number IS NULL;