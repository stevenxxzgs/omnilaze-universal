# 手机验证码登录系统

一个基于 Python 和 Supabase 的手机验证码登录系统，支持验证码发送、验证和用户登录功能。

## 功能特性

- 📱 手机验证码发送
- ⏰ 验证码10分钟有效期
- 🔒 防重复使用机制
- 👤 自动用户注册
- 🗄️ Supabase 数据库存储
- 🖥️ 交互式命令行界面

## 技术栈

- **后端**: Python 3.7+
- **数据库**: Supabase (PostgreSQL)
- **验证码发送**: 第三方推送服务
- **依赖**: requests, supabase

## 快速开始

### 1. 环境要求

- Python 3.7 或更高版本
- pip 包管理器

### 2. 安装依赖

```bash
pip install supabase requests
```

### 3. 配置数据库

在 Supabase 控制台中执行以下 SQL 语句创建必要的数据表：

```sql
-- 创建验证码表
CREATE TABLE verification_codes (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(20) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建用户表
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX idx_verification_codes_phone ON verification_codes(phone_number);
CREATE INDEX idx_verification_codes_expires_at ON verification_codes(expires_at);
CREATE INDEX idx_users_phone ON users(phone_number);
```

### 4. 配置环境变量

在 `app.py` 中更新您的 Supabase 配置：

```python
SUPABASE_URL = "your_supabase_url"
SUPABASE_KEY = "your_supabase_anon_key"
```

### 5. 运行程序

```bash
python3 app.py
```

## 使用方法

### 命令行界面

1. 运行程序后，输入手机号码
2. 系统自动发送6位数验证码
3. 输入收到的验证码进行验证
4. 验证成功后自动完成登录或注册

```
=== 手机验证码登录系统 ===
请输入手机号: 13800138000
正在向 13800138000 发送验证码...
验证码已发送，请查收短信
请输入6位验证码 (输入 'q' 退出): 123456
✓ 验证码验证成功
✓ 登录成功！用户ID: 1
```

### 编程接口

您也可以直接使用模块中的函数：

```python
from app import send_verification_code, login_with_phone

# 发送验证码
result = send_verification_code("13800138000")
print(result)

# 验证登录
login_result = login_with_phone("13800138000", "123456")
print(login_result)
```

## API 参考

### `send_verification_code(phone_number)`

发送验证码到指定手机号

**参数:**
- `phone_number` (str): 手机号码

**返回:**
```python
{
    "success": True/False,
    "message": "状态消息"
}
```

### `verify_code(phone_number, input_code)`

验证验证码是否正确

**参数:**
- `phone_number` (str): 手机号码  
- `input_code` (str): 用户输入的验证码

**返回:**
```python
{
    "success": True/False,
    "message": "验证结果消息"
}
```

### `login_with_phone(phone_number, verification_code)`

使用手机号和验证码登录

**参数:**
- `phone_number` (str): 手机号码
- `verification_code` (str): 验证码

**返回:**
```python
{
    "success": True/False,
    "message": "登录结果消息",
    "user_id": 用户ID,
    "phone_number": "手机号码"
}
```

## 数据库结构

### verification_codes 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL | 主键 |
| phone_number | VARCHAR(20) | 手机号码 |
| code | VARCHAR(6) | 验证码 |
| expires_at | TIMESTAMP | 过期时间 |
| used | BOOLEAN | 是否已使用 |
| created_at | TIMESTAMP | 创建时间 |

### users 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL | 主键 |
| phone_number | VARCHAR(20) | 手机号码(唯一) |
| created_at | TIMESTAMP | 注册时间 |

## 安全特性

- ✅ 验证码10分钟自动过期
- ✅ 验证码一次性使用，防止重放攻击
- ✅ 手机号码唯一性校验
- ✅ 输入验证和错误处理
- ✅ UTC时区处理，避免时间混乱

## 文件结构

```
jwt/
├── app.py              # 主程序文件
├── python.py           # 原始验证码发送逻辑
├── example.py          # 使用示例
├── supabase_setup.sql  # 数据库初始化脚本
└── README.md           # 项目文档
```

## 注意事项

1. **生产环境部署前**，请确保：
   - 更换为您自己的 Supabase 项目配置
   - 配置合适的验证码发送服务
   - 添加适当的速率限制和安全措施

2. **验证码发送服务**：
   - 当前使用的是示例推送服务
   - 生产环境建议使用专业的短信服务商

3. **数据库安全**：
   - 妥善保管 Supabase API 密钥
   - 定期清理过期的验证码记录

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目。

## 许可证

MIT License

## 联系方式

如有问题，请通过 GitHub Issues 联系。