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
    if [ $? -ne 0 ]; then
        echo "❌ 登录失败"
        exit 1
    fi
fi

echo "📋 正在执行数据库迁移..."
# 执行数据库迁移（假设数据库已存在）
echo "执行初始数据库迁移..."
wrangler d1 execute omnilaze-orders --file=./migrations/001_initial.sql --remote

echo "执行邀请系统迁移..."
wrangler d1 execute omnilaze-orders --file=./migrations/002_invite_system.sql --remote

if [ $? -ne 0 ]; then
    echo "⚠️ 数据库迁移可能已执行过，继续部署..."
fi

echo "🌐 正在部署 Worker..."
# 部署 Worker
wrangler deploy

if [ $? -ne 0 ]; then
    echo "❌ Worker 部署失败"
    exit 1
fi

echo ""
echo "🎉 后端部署完成！"
echo ""

# 获取 Worker URL
WORKER_URL=$(wrangler whoami | grep "Account ID" -A 10 | grep -o "https://.*workers\.dev" | head -1)
if [ -z "$WORKER_URL" ]; then
    WORKER_URL="https://omnilaze-universal-api.steven-wu.workers.dev"
fi

echo "🔗 你的 API 地址："
echo "$WORKER_URL"
echo ""
echo "🧪 测试你的 API："
echo "curl $WORKER_URL/health"
echo ""
echo "📝 接下来部署前端："
echo "./deploy-frontend.sh"