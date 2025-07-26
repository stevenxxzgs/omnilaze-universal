-- 修复用户序号，为现有用户分配正确的序号
-- 执行时间: 2025-07-26

-- 重新为现有用户分配正确的序号（按创建时间排序）
WITH user_ranking AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as new_sequence
    FROM users
)
UPDATE users 
SET user_sequence = (
    SELECT new_sequence 
    FROM user_ranking 
    WHERE user_ranking.id = users.id
);

-- 更新序列计数器到当前最大值
UPDATE user_sequence_counter 
SET current_sequence = (SELECT COALESCE(MAX(user_sequence), 0) FROM users)
WHERE id = 1;