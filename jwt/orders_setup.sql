-- 创建订单表
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL, -- 订单唯一编号，格式如: ORD20240126001
    user_id VARCHAR(50) NOT NULL, -- 关联用户ID
    phone_number VARCHAR(20) NOT NULL, -- 用户手机号
    
    -- 订单基本信息
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'processing', 'completed', 'cancelled')),
    order_date DATE NOT NULL DEFAULT CURRENT_DATE, -- 订单日期（年月日）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- 订单创建时间
    submitted_at TIMESTAMP WITH TIME ZONE, -- 订单提交时间
    
    -- 配送信息
    delivery_address TEXT NOT NULL, -- 配送地址
    delivery_latitude DECIMAL(10, 8), -- 配送纬度
    delivery_longitude DECIMAL(11, 8), -- 配送经度
    delivery_notes TEXT, -- 配送备注
    
    -- 用户偏好信息
    dietary_restrictions TEXT, -- 忌口信息，JSON格式存储多个选择
    food_preferences TEXT, -- 饮食偏好，JSON格式存储多个选择  
    budget_amount DECIMAL(10, 2) NOT NULL, -- 预算金额
    budget_currency VARCHAR(3) DEFAULT 'CNY', -- 货币类型
    
    -- 推荐餐厅信息（可选，后续扩展用）
    recommended_restaurants TEXT, -- JSON格式存储推荐的餐厅列表
    selected_restaurant_id VARCHAR(50), -- 用户选择的餐厅ID
    
    -- 用户反馈
    user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5), -- 用户评分 1-5星
    user_feedback TEXT, -- 用户反馈文本
    feedback_submitted_at TIMESTAMP WITH TIME ZONE, -- 反馈提交时间
    
    -- 系统字段
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- 最后更新时间
    metadata JSONB, -- 额外的元数据，灵活存储其他信息
    
    -- 软删除标记
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 创建订单号生成函数
CREATE OR REPLACE FUNCTION generate_order_number() 
RETURNS VARCHAR(50) AS $$
DECLARE
    order_date TEXT;
    daily_count INTEGER;
    new_order_number VARCHAR(50);
BEGIN
    -- 获取当前日期，格式: YYYYMMDD
    order_date := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
    
    -- 获取当天已有订单数量
    SELECT COUNT(*) + 1 INTO daily_count
    FROM orders 
    WHERE order_date = CURRENT_DATE 
    AND is_deleted = FALSE;
    
    -- 生成订单号: ORD + 日期 + 3位序号
    new_order_number := 'ORD' || order_date || LPAD(daily_count::TEXT, 3, '0');
    
    -- 检查是否已存在，如果存在则递增序号
    WHILE EXISTS (SELECT 1 FROM orders WHERE order_number = new_order_number) LOOP
        daily_count := daily_count + 1;
        new_order_number := 'ORD' || order_date || LPAD(daily_count::TEXT, 3, '0');
    END LOOP;
    
    RETURN new_order_number;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器自动生成订单号
CREATE OR REPLACE FUNCTION set_order_number_trigger() 
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := generate_order_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 绑定触发器到订单表
CREATE TRIGGER trigger_set_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION set_order_number_trigger();

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 创建索引以提高查询性能
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_phone_number ON orders(phone_number);
CREATE INDEX idx_orders_order_date ON orders(order_date);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_submitted_at ON orders(submitted_at DESC);
CREATE INDEX idx_orders_user_rating ON orders(user_rating);
CREATE INDEX idx_orders_is_deleted ON orders(is_deleted);

-- 创建复合索引
CREATE INDEX idx_orders_user_date ON orders(user_id, order_date DESC);
CREATE INDEX idx_orders_status_date ON orders(status, created_at DESC);

-- 插入一些示例数据来测试
INSERT INTO orders (
    user_id, 
    phone_number, 
    delivery_address, 
    dietary_restrictions, 
    food_preferences, 
    budget_amount,
    status
) VALUES 
(
    'dev_user_1', 
    '13800138000', 
    '北京市朝阳区三里屯soho A座1001室', 
    '["无辣", "无花生"]', 
    '["川菜", "清淡"]', 
    50.00,
    'draft'
);

-- 查看表结构
\d orders;

-- 查看示例数据
SELECT 
    order_number,
    user_id,
    phone_number,
    status,
    order_date,
    delivery_address,
    budget_amount,
    created_at
FROM orders 
WHERE is_deleted = FALSE
ORDER BY created_at DESC;