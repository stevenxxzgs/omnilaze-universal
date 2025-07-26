#!/bin/bash

echo "🎨 开始部署前端到 Cloudflare Pages"

# 检查是否安装了必要的依赖
if ! command -v npm &> /dev/null; then
    echo "❌ 未检测到 npm，请先安装 Node.js"
    exit 1
fi

# 安装依赖
echo "📦 安装依赖..."
npm install

# 构建前端项目
echo "🔨 构建前端项目..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 构建失败"
    exit 1
fi

echo "✅ 前端构建完成"

# 检查是否安装了 wrangler（用于 Pages 部署）
if command -v wrangler &> /dev/null; then
    echo "🚀 使用 Wrangler 部署到 Cloudflare Pages..."
    
    # 如果用户已经配置了 Pages 项目，可以直接部署
    # wrangler pages publish dist --project-name=lemonade-app-frontend
    
    echo "💡 请手动上传 dist/ 目录到 Cloudflare Pages，或配置 wrangler pages 命令"
else
    echo "💡 构建完成！请将 dist/ 目录上传到 Cloudflare Pages"
fi

echo ""
echo "📁 构建文件位置: ./dist/"
echo ""
echo "🌐 Cloudflare Pages 部署步骤："
echo "1. 登录 Cloudflare Dashboard"
echo "2. 进入 Pages 页面"
echo "3. 创建新项目或更新现有项目"
echo "4. 上传 dist/ 目录中的所有文件"
echo "5. 配置环境变量 REACT_APP_API_URL"
echo ""
echo "🔧 不要忘记更新 API URL:"
echo "REACT_APP_API_URL=https://your-worker.your-subdomain.workers.dev"