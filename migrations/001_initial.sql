-- Cloudflare D1 数据库初始化脚本 - OmniLaze Universal
-- 创建用户表
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    phone_number TEXT UNIQUE NOT NULL,
    created_at TEXT NOT NULL,
    invite_code TEXT,
    is_active INTEGER DEFAULT 1,
    metadata TEXT -- JSON格式存储额外信息
);

-- 创建邀请码表
CREATE TABLE invite_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    created_by TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    used INTEGER DEFAULT 0,
    used_by TEXT,
    used_at TEXT,
    expires_at TEXT,
    is_active INTEGER DEFAULT 1
);

-- 创建订单表
CREATE TABLE orders (
    id TEXT PRIMARY KEY,
    order_number TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    
    -- 订单基本信息
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'processing', 'completed', 'cancelled')),
    order_date TEXT NOT NULL DEFAULT (date('now')), -- 订单日期（年月日）
    created_at TEXT DEFAULT (datetime('now')), -- 订单创建时间
    submitted_at TEXT, -- 订单提交时间
    
    -- 配送信息
    delivery_address TEXT NOT NULL, -- 配送地址
    delivery_latitude REAL, -- 配送纬度
    delivery_longitude REAL, -- 配送经度
    delivery_notes TEXT, -- 配送备注
    
    -- 用户偏好信息
    dietary_restrictions TEXT, -- 忌口信息，JSON格式存储多个选择
    food_preferences TEXT, -- 饮食偏好，JSON格式存储多个选择  
    budget_amount REAL NOT NULL, -- 预算金额
    budget_currency TEXT DEFAULT 'CNY', -- 货币类型
    
    -- 推荐餐厅信息（可选，后续扩展用）
    recommended_restaurants TEXT, -- JSON格式存储推荐的餐厅列表
    selected_restaurant_id TEXT, -- 用户选择的餐厅ID
    
    -- 用户反馈
    user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5), -- 用户评分 1-5星
    user_feedback TEXT, -- 用户反馈文本
    feedback_submitted_at TEXT, -- 反馈提交时间
    
    -- 系统字段
    updated_at TEXT DEFAULT (datetime('now')), -- 最后更新时间
    metadata TEXT, -- 额外的元数据，JSON格式存储其他信息
    
    -- 软删除标记
    is_deleted INTEGER DEFAULT 0,
    deleted_at TEXT,
    
    -- 外键约束
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 创建索引以提高查询性能
CREATE INDEX idx_users_phone_number ON users(phone_number);
CREATE INDEX idx_invite_codes_code ON invite_codes(code);
CREATE INDEX idx_invite_codes_used ON invite_codes(used);

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

-- 插入一些示例邀请码
INSERT INTO invite_codes (code, created_by, created_at) VALUES 
('1234', 'system', datetime('now')),
('WELCOME', 'system', datetime('now')),
('LANDE', 'system', datetime('now')),
('OMNILAZE', 'system', datetime('now')),
('ADVX2025', 'system', datetime('now'));

-- 插入示例数据来测试（可选）
INSERT INTO users (id, phone_number, created_at, invite_code) VALUES 
('dev_user_1', '13800138000', datetime('now'), '1234');

INSERT INTO orders (
    id, order_number, user_id, phone_number, delivery_address, 
    dietary_restrictions, food_preferences, budget_amount, status
) VALUES (
    'test_order_1', 
    'ORD20240126001', 
    'dev_user_1', 
    '13800138000', 
    '北京市朝阳区三里屯soho A座1001室', 
    '["无辣", "无花生"]', 
    '["川菜", "清淡"]', 
    50.00,
    'draft'
);