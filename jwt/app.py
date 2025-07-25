import requests
import random
import string
import time
import json
from datetime import datetime, timedelta, timezone
from supabase import create_client, Client
import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # 允许跨域请求

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SPUG_URL = os.getenv("SPUG_URL")

# 开发模式 - 如果没有配置真实的Supabase，使用模拟模式
DEVELOPMENT_MODE = not SUPABASE_URL or SUPABASE_URL == "your_supabase_project_url" or not SUPABASE_KEY or "example" in SUPABASE_URL.lower()

if DEVELOPMENT_MODE:
    print("⚠️  开发模式：未配置真实的Supabase，将使用模拟数据")
    supabase = None
else:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def generate_verification_code():
    return ''.join(random.choices(string.digits, k=6))

# 开发模式的内存存储
dev_verification_codes = {}
dev_users = {}

def store_verification_code(phone_number, code):
    if DEVELOPMENT_MODE:
        # 开发模式：存储到内存
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
        dev_verification_codes[phone_number] = {
            'code': code,
            'expires_at': expires_at,
            'used': False,
            'created_at': datetime.now(timezone.utc)
        }
        return {"success": True}
    else:
        # 生产模式：存储到Supabase
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
        
        result = supabase.table('verification_codes').upsert({
            'phone_number': phone_number,
            'code': code,
            'expires_at': expires_at.isoformat(),
            'used': False
        }).execute()
        
        return result

def send_verification_code(phone_number):
    code = generate_verification_code()
    
    store_result = store_verification_code(phone_number, code)
    
    if DEVELOPMENT_MODE:
        # 开发模式：模拟发送成功，并在控制台显示验证码
        print(f"📱 开发模式 - 验证码已生成: {phone_number} -> {code}")
        return {"success": True, "message": "验证码发送成功（开发模式）", "dev_code": code}
    else:
        # 生产模式：真实发送短信
        body = {'name': '验证码', 'code': code, 'targets': phone_number}
        response = requests.post(SPUG_URL, json=body)
        
        if response.status_code == 200:
            return {"success": True, "message": "验证码发送成功"}
        else:
            return {"success": False, "message": "验证码发送失败"}

def verify_code(phone_number, input_code):
    if DEVELOPMENT_MODE:
        # 开发模式：从内存验证
        if phone_number not in dev_verification_codes:
            return {"success": False, "message": "验证码不存在或已使用"}
        
        code_record = dev_verification_codes[phone_number]
        
        if code_record['used']:
            return {"success": False, "message": "验证码不存在或已使用"}
        
        # 检查是否过期
        if datetime.now(timezone.utc) > code_record['expires_at']:
            return {"success": False, "message": "验证码已过期"}
        
        # 验证验证码
        if code_record['code'] != input_code:
            return {"success": False, "message": "验证码错误"}
        
        # 标记为已使用
        code_record['used'] = True
        return {"success": True, "message": "验证码验证成功"}
    else:
        # 生产模式：从Supabase验证
        result = supabase.table('verification_codes').select('*').eq('phone_number', phone_number).eq('used', False).order('created_at', desc=True).limit(1).execute()
        
        if not result.data:
            return {"success": False, "message": "验证码不存在或已使用"}
        
        code_record = result.data[0]
        expires_at_str = code_record['expires_at']
        if expires_at_str.endswith('+00:00'):
            expires_at_str = expires_at_str.replace('+00:00', 'Z')
        expires_at = datetime.fromisoformat(expires_at_str.replace('Z', '+00:00'))
        
        if datetime.now(timezone.utc) > expires_at:
            return {"success": False, "message": "验证码已过期"}
        
        if code_record['code'] != input_code:
            return {"success": False, "message": "验证码错误"}
        
        # 标记验证码为已使用
        supabase.table('verification_codes').update({'used': True}).eq('id', code_record['id']).execute()
        
        return {"success": True, "message": "验证码验证成功"}

def login_with_phone(phone_number, verification_code):
    verify_result = verify_code(phone_number, verification_code)
    
    if not verify_result["success"]:
        return verify_result
    
    if DEVELOPMENT_MODE:
        # 开发模式：使用内存存储用户
        if phone_number not in dev_users:
            # 创建新用户
            user_id = f"dev_user_{len(dev_users) + 1}"
            dev_users[phone_number] = {
                'id': user_id,
                'phone_number': phone_number,
                'created_at': datetime.now(timezone.utc).isoformat()
            }
        else:
            user_id = dev_users[phone_number]['id']
        
        print(f"✅ 开发模式 - 用户登录成功: {phone_number} (ID: {user_id})")
    else:
        # 生产模式：使用Supabase
        user_result = supabase.table('users').select('*').eq('phone_number', phone_number).execute()
        
        if not user_result.data:
            new_user = supabase.table('users').insert({
                'phone_number': phone_number,
                'created_at': datetime.now(timezone.utc).isoformat()
            }).execute()
            user_id = new_user.data[0]['id']
        else:
            user_id = user_result.data[0]['id']
    
    return {
        "success": True,
        "message": "登录成功",
        "user_id": user_id,
        "phone_number": phone_number
    }

# Flask API路由

@app.route('/send-verification-code', methods=['POST'])
def api_send_verification_code():
    """发送验证码API"""
    try:
        data = request.get_json()
        phone_number = data.get('phone_number')
        
        if not phone_number:
            return jsonify({"success": False, "message": "手机号不能为空"}), 400
        
        # 验证手机号格式
        if len(phone_number) != 11 or not phone_number.isdigit():
            return jsonify({"success": False, "message": "请输入正确的11位手机号码"}), 400
        
        result = send_verification_code(phone_number)
        
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 500
            
    except Exception as e:
        return jsonify({"success": False, "message": f"服务器错误: {str(e)}"}), 500

@app.route('/login-with-phone', methods=['POST'])
def api_login_with_phone():
    """验证码登录API"""
    try:
        data = request.get_json()
        phone_number = data.get('phone_number')
        verification_code = data.get('verification_code')
        
        if not phone_number or not verification_code:
            return jsonify({"success": False, "message": "手机号和验证码不能为空"}), 400
        
        # 验证手机号格式
        if len(phone_number) != 11 or not phone_number.isdigit():
            return jsonify({"success": False, "message": "请输入正确的11位手机号码"}), 400
        
        # 验证验证码格式
        if len(verification_code) != 6 or not verification_code.isdigit():
            return jsonify({"success": False, "message": "请输入6位数字验证码"}), 400
        
        result = login_with_phone(phone_number, verification_code)
        
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({"success": False, "message": f"服务器错误: {str(e)}"}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """健康检查API"""
    return jsonify({"status": "healthy", "message": "API服务正常运行"}), 200

if __name__ == '__main__':
    print("=== 手机验证码登录API服务 ===")
    print("API服务启动中...")
    app.run(host='0.0.0.0', port=5000, debug=True)