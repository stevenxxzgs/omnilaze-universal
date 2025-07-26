# Cloudflare Workers 部署指南 - OmniLaze Universal

本文档将指导你如何将 OmniLaze Universal 部署到 Cloudflare Workers。

## 🚀 快速开始

### 1. 环境准备

首先安装 Cloudflare Wrangler CLI：

```bash
npm install -g wrangler
```

登录到你的 Cloudflare 账户：

```bash
wrangler login
```

### 2. 一键部署

运行自动部署脚本：

```bash
./deploy.sh
```

这个脚本会自动：
- 创建 D1 数据库
- 创建 KV 命名空间
- 更新配置文件
- 执行数据库迁移
- 部署 Worker

### 3. 更新前端配置

部署完成后，将输出的 Worker URL 更新到你的前端配置中：

```bash
# 更新 .env 文件
echo "REACT_APP_API_URL=https://your-worker.your-subdomain.workers.dev" > .env
```

## 🔧 手动部署（高级用户）

如果你想手动控制每个步骤：

### 1. 创建 D1 数据库

```bash
wrangler d1 create omnilaze-orders
```

复制输出的 `database_id`，更新 `wrangler.toml` 文件。

### 2. 创建 KV 命名空间

```bash
wrangler kv:namespace create VERIFICATION_KV
```

复制输出的 `id`，更新 `wrangler.toml` 文件。

### 3. 执行数据库迁移

```bash
wrangler d1 execute omnilaze-orders --file=./migrations/001_initial.sql
```

### 4. 部署 Worker

```bash
wrangler deploy
```

## 📋 配置说明

### wrangler.toml 配置

关键配置项说明：

```toml
name = "omnilaze-universal-api"              # Worker 名称
main = "worker.js"                     # 入口文件
compatibility_date = "2024-01-15"      # 兼容性日期

# D1 数据库配置
[[d1_databases]]
binding = "DB"                         # 在代码中的绑定名
database_name = "omnilaze-orders"      # 数据库名
database_id = "your-database-id"       # 替换为实际的数据库 ID

# KV 存储配置
[[kv_namespaces]]
binding = "VERIFICATION_KV"            # 在代码中的绑定名
id = "your-kv-namespace-id"           # 替换为实际的 KV ID

# 环境变量
[vars]
ALLOWED_ORIGINS = '["https://your-domain.com"]'  # 允许的跨域源
SPUG_URL = "your-sms-service-url"                # 短信服务 URL
```

### 环境变量配置

在 Cloudflare Dashboard 中配置以下环境变量：

1. **ALLOWED_ORIGINS**: 允许的跨域来源（JSON 数组格式）
   ```json
   ["https://your-frontend-domain.com", "http://localhost:8081"]
   ```

2. **SPUG_URL**: 短信服务的 API 地址
   
3. **ENVIRONMENT**: 环境标识（`development` 或 `production`）

## 🗄️ 数据库结构

### 主要表结构：

1. **users**: 用户信息表
   - `id`: 用户唯一标识
   - `phone_number`: 手机号（唯一）
   - `created_at`: 创建时间
   - `invite_code`: 使用的邀请码

2. **invite_codes**: 邀请码表
   - `code`: 邀请码
   - `used`: 是否已使用
   - `used_by`: 使用者手机号

3. **orders**: 订单表
   - `id`: 订单唯一标识
   - `order_number`: 订单号
   - `user_id`: 用户 ID
   - `status`: 订单状态
   - `delivery_address`: 配送地址
   - `dietary_restrictions`: 忌口信息（JSON）
   - `food_preferences`: 饮食偏好（JSON）
   - `budget_amount`: 预算金额
   - `user_rating`: 用户评分
   - `user_feedback`: 用户反馈

### KV 存储：

- **验证码存储**: `verification:{phone_number}` -> 验证码信息
  - 自动过期时间：10分钟

## 🔍 API 端点

部署后的 API 端点：

- `GET /health` - 健康检查
- `POST /send-verification-code` - 发送验证码
- `POST /login-with-phone` - 手机号登录
- `POST /verify-invite-code` - 验证邀请码
- `POST /create-order` - 创建订单
- `POST /submit-order` - 提交订单
- `POST /order-feedback` - 提交订单反馈
- `GET /orders/{user_id}` - 获取用户订单列表

## 🧪 测试部署

部署完成后，可以测试你的 API：

```bash
# 健康检查
curl https://your-worker.your-subdomain.workers.dev/health

# 测试发送验证码（开发模式）
curl -X POST https://your-worker.your-subdomain.workers.dev/send-verification-code \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "13800138000"}'
```

## 🔧 开发模式 vs 生产模式

### 开发模式
- 设置环境变量 `ENVIRONMENT=development`
- 验证码会在响应中返回（不发送真实短信）
- 使用预设的邀请码列表

### 生产模式
- 设置环境变量 `ENVIRONMENT=production`
- 集成真实的短信服务
- 验证码不在响应中显示
- 需要配置 `SPUG_URL` 短信服务地址

## 📱 前端部署

### 使用 Cloudflare Pages

1. 构建前端项目：
   ```bash
   npm run build
   ```

2. 创建 Cloudflare Pages 项目并上传构建文件

3. 配置环境变量：
   - `REACT_APP_API_URL`: 你的 Worker API 地址

### 使用其他平台

更新 `.env` 文件中的 API 地址，然后按照平台说明部署。

## 🛠️ 故障排除

### 常见问题：

1. **CORS 错误**
   - 检查 `ALLOWED_ORIGINS` 环境变量是否包含你的前端域名
   - 确保前端的 API URL 配置正确

2. **数据库连接错误**
   - 验证 `wrangler.toml` 中的 `database_id` 是否正确
   - 确保数据库迁移已执行

3. **验证码发送失败**
   - 生产模式下检查 `SPUG_URL` 配置
   - 开发模式下验证码会在控制台显示

4. **KV 存储错误**
   - 验证 `wrangler.toml` 中的 KV namespace `id` 是否正确

### 查看日志：

```bash
# 查看实时日志
wrangler tail

# 查看特定时间段的日志
wrangler tail --since 2024-01-01
```

## 📊 监控和分析

在 Cloudflare Dashboard 中可以查看：
- Worker 调用次数
- 响应时间
- 错误率
- D1 数据库使用情况
- KV 存储使用情况

## 🔄 更新部署

当代码有更新时：

```bash
# 重新部署
wrangler deploy

# 如果数据库结构有更新
wrangler d1 execute omnilaze-orders --file=./migrations/new_migration.sql
```

## 💰 费用说明

Cloudflare Workers 的定价：

- **Workers**: 前 100,000 次请求/天免费
- **D1 数据库**: 前 5GB 存储 + 2500 万次读取免费
- **KV 存储**: 前 10GB 免费

对于小型应用，基本可以免费使用。

## 🔒 安全建议

1. **环境变量**: 敏感信息（如短信服务密钥）应通过环境变量配置
2. **CORS**: 严格配置允许的跨域源
3. **输入验证**: 所有用户输入都经过验证
4. **SQL 注入防护**: 使用参数化查询
5. **速率限制**: 考虑对 API 添加速率限制（可使用 Cloudflare Rate Limiting）

## 📞 支持

如果遇到问题：

1. 查看 Cloudflare Workers 文档
2. 检查 `wrangler tail` 日志
3. 验证所有配置文件
4. 确保所有依赖项都已正确配置