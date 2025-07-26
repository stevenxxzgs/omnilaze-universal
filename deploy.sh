#!/bin/bash

echo "🚀 开始部署 OmniLaze Universal 到 Cloudflare Workers"

# 检查是否安装了 wrangler
if ! command -v wrangler &> /dev/null; then
    echo "❌ 未检测到 wrangler CLI，请先安装："
    echo "npm install -g wrangler"
    exit 1
fi

# 检查是否已登录
if ! wrangler whoami &> /dev/null; then
    echo "🔐 请先登录 Cloudflare："
    wrangler login
fi

echo "📦 正在创建 D1 数据库..."
# 创建 D1 数据库
DB_OUTPUT=$(wrangler d1 create omnilaze-orders)
DB_ID=$(echo "$DB_OUTPUT" | grep "database_id" | cut -d'"' -f4)

if [ -z "$DB_ID" ]; then
    echo "❌ 创建数据库失败"
    exit 1
fi

echo "✅ 数据库创建成功，ID: $DB_ID"

echo "📊 正在创建 KV 命名空间..."
# 创建 KV 命名空间
KV_OUTPUT=$(wrangler kv:namespace create VERIFICATION_KV)
KV_ID=$(echo "$KV_OUTPUT" | grep "id" | cut -d'"' -f4)

if [ -z "$KV_ID" ]; then
    echo "❌ 创建 KV 命名空间失败"
    exit 1
fi

echo "✅ KV 命名空间创建成功，ID: $KV_ID"

echo "🔧 正在更新 wrangler.toml 配置..."
# 更新 wrangler.toml 中的 database_id 和 kv id
sed -i.bak "s/database_id = \"your-database-id-here\"/database_id = \"$DB_ID\"/" wrangler.toml
sed -i.bak "s/id = \"your-kv-namespace-id-here\"/id = \"$KV_ID\"/" wrangler.toml

echo "📋 正在执行数据库迁移..."
# 执行数据库迁移
wrangler d1 execute omnilaze-orders --file=./migrations/001_initial.sql

echo "🌐 正在部署 Worker..."
# 部署 Worker
wrangler deploy

echo ""
echo "🎉 部署完成！"
echo ""
echo "📝 部署信息："
echo "- D1 数据库 ID: $DB_ID"
echo "- KV 命名空间 ID: $KV_ID"
echo ""
echo "🔗 你的 API 地址："
WORKER_URL=$(wrangler deployment list | grep "https://" | head -1 | awk '{print $3}')
echo "$WORKER_URL"
echo ""
echo "⚠️  请更新前端的 API URL 配置："
echo "REACT_APP_API_URL=$WORKER_URL"
echo ""
echo "🧪 测试你的 API："
echo "curl $WORKER_URL/health"