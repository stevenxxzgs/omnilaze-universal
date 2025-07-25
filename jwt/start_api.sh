#!/bin/bash

# 手机验证码API服务启动脚本

echo "=== 手机验证码API服务启动脚本 ==="

# 检查是否在虚拟环境中
if [[ "$VIRTUAL_ENV" == "" ]]; then
    echo "警告: 建议在Python虚拟环境中运行"
    echo "可以使用以下命令创建虚拟环境:"
    echo "python -m venv venv"
    echo "source venv/bin/activate  # Linux/Mac"
    echo "# 或 venv\\Scripts\\activate  # Windows"
    echo ""
fi

# 检查requirements.txt是否存在
if [ ! -f "requirements.txt" ]; then
    echo "错误: requirements.txt 文件不存在"
    exit 1
fi

# 安装依赖
echo "正在安装Python依赖..."
pip install -r requirements.txt

if [ $? -ne 0 ]; then
    echo "错误: 依赖安装失败"
    exit 1
fi

# 检查环境变量文件
if [ ! -f ".env" ]; then
    echo "警告: .env 文件不存在，请确保已配置以下环境变量:"
    echo "  SUPABASE_URL=your_supabase_url"
    echo "  SUPABASE_KEY=your_supabase_key"
    echo "  SPUG_URL=your_spug_sms_url"
    echo ""
fi

# 启动Flask应用
echo "正在启动API服务..."
echo "服务将运行在: http://localhost:5000"
echo "按 Ctrl+C 停止服务"
echo ""

python app.py