-- 邀请系统扩展迁移 - 002_invite_system.sql

-- 1. 为users表添加邀请码字段
ALTER TABLE users ADD COLUMN user_invite_code TEXT UNIQUE;

-- 2. 修改invite_codes表结构，添加新字段
ALTER TABLE invite_codes ADD COLUMN invite_type TEXT DEFAULT 'activity' CHECK (invite_type IN ('activity', 'user'));
ALTER TABLE invite_codes ADD COLUMN max_uses INTEGER DEFAULT 1;
ALTER TABLE invite_codes ADD COLUMN current_uses INTEGER DEFAULT 0;
ALTER TABLE invite_codes ADD COLUMN owner_user_id TEXT; -- 用户邀请码的拥有者

-- 3. 创建邀请关系表，记录谁邀请了谁
CREATE TABLE invitations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inviter_user_id TEXT NOT NULL, -- 邀请人用户ID
    invitee_user_id TEXT NOT NULL, -- 被邀请人用户ID
    invite_code TEXT NOT NULL, -- 使用的邀请码
    invited_at TEXT DEFAULT (datetime('now')), -- 邀请时间
    invitee_phone TEXT NOT NULL, -- 被邀请人手机号
    
    FOREIGN KEY (inviter_user_id) REFERENCES users(id),
    FOREIGN KEY (invitee_user_id) REFERENCES users(id),
    FOREIGN KEY (invite_code) REFERENCES invite_codes(code)
);

-- 4. 创建索引优化查询
CREATE INDEX idx_invitations_inviter ON invitations(inviter_user_id);
CREATE INDEX idx_invitations_invitee ON invitations(invitee_user_id);
CREATE INDEX idx_invitations_code ON invitations(invite_code);
CREATE INDEX idx_invite_codes_type ON invite_codes(invite_type);
CREATE INDEX idx_invite_codes_owner ON invite_codes(owner_user_id);
CREATE INDEX idx_users_invite_code ON users(user_invite_code);

-- 5. 更新现有的活动邀请码，设置类型和使用次数
UPDATE invite_codes SET 
    invite_type = 'activity',
    max_uses = 1,
    current_uses = CASE WHEN used = 1 THEN 1 ELSE 0 END
WHERE code IN ('1234', 'WELCOME', 'LANDE', 'OMNILAZE');

-- 6. 特别处理ADVX2025，设置为10次使用
UPDATE invite_codes SET 
    invite_type = 'activity',
    max_uses = 10,
    current_uses = CASE WHEN used = 1 THEN 1 ELSE 0 END
WHERE code = 'ADVX2025';

-- 7. 为现有用户生成邀请码（如果还没有的话）
-- 这部分将在后端代码中处理，因为需要生成唯一的随机码