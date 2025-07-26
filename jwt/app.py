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

# 更详细的CORS配置，支持开发环境
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:8081", "http://localhost:3000", "http://localhost:19006"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SPUG_URL = os.getenv("SPUG_URL")

# 开发模式 - 如果没有配置真实的Supabase，使用模拟模式
DEVELOPMENT_MODE = not SUPABASE_URL or SUPABASE_URL == "your_supabase_project_url" or not SUPABASE_KEY or "example" in SUPABASE_URL.lower()

# 强制开发模式用于测试（可以通过环境变量覆盖）
if os.getenv("FORCE_DEV_MODE", "false").lower() == "true":
    DEVELOPMENT_MODE = True
    print("🔧 强制开发模式已启用")

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
dev_invite_codes = {'1234': True, 'WELCOME': True, 'LANDE': True, 'OMNILAZE': True, 'ADVX2025': True}  # 有效的邀请码

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
    print(f"🔐 开始登录验证: {phone_number}")
    verify_result = verify_code(phone_number, verification_code)
    
    if not verify_result["success"]:
        print(f"❌ 验证码验证失败: {verify_result['message']}")
        return verify_result
    
    print(f"✅ 验证码验证成功: {phone_number}")
    is_new_user = False
    
    if DEVELOPMENT_MODE:
        # 开发模式：使用内存存储用户
        print(f"📝 当前用户列表: {list(dev_users.keys())}")
        if phone_number not in dev_users:
            # 新用户，但暂不创建，等待邀请码验证
            is_new_user = True
            user_id = f"dev_user_{len(dev_users) + 1}"
            print(f"🆕 检测到新用户: {phone_number}")
        else:
            user_id = dev_users[phone_number]['id']
            print(f"👤 老用户登录: {phone_number} (ID: {user_id})")
        
        print(f"✅ 开发模式 - 用户验证成功: {phone_number} (新用户: {is_new_user})")
    else:
        # 生产模式：使用Supabase
        user_result = supabase.table('users').select('*').eq('phone_number', phone_number).execute()
        
        if not user_result.data:
            # 新用户，但暂不创建，等待邀请码验证
            is_new_user = True
            user_id = f"temp_user_{phone_number}"  # 临时ID
            print(f"🆕 检测到新用户: {phone_number}")
        else:
            user_id = user_result.data[0]['id']
            print(f"👤 老用户登录: {phone_number} (ID: {user_id})")
    
    result = {
        "success": True,
        "message": "验证成功" if not is_new_user else "新用户验证成功，请输入邀请码",
        "user_id": user_id if not is_new_user else None,
        "phone_number": phone_number,
        "is_new_user": is_new_user
    }
    
    print(f"📤 返回结果: {result}")
    return result

# Flask API路由

@app.route('/send-verification-code', methods=['POST'])
def api_send_verification_code():
    """发送验证码API"""
    print(f"📱 收到发送验证码请求 - Origin: {request.headers.get('Origin', 'Unknown')}")
    try:
        data = request.get_json()
        phone_number = data.get('phone_number')
        
        print(f"📱 手机号: {phone_number}")
        
        if not phone_number:
            return jsonify({"success": False, "message": "手机号不能为空"}), 400
        
        # 验证手机号格式
        if len(phone_number) != 11 or not phone_number.isdigit():
            return jsonify({"success": False, "message": "请输入正确的11位手机号码"}), 400
        
        result = send_verification_code(phone_number)
        
        if result["success"]:
            print(f"✅ 验证码发送成功: {phone_number}")
            return jsonify(result), 200
        else:
            print(f"❌ 验证码发送失败: {result['message']}")
            return jsonify(result), 500
            
    except Exception as e:
        print(f"❌ 服务器错误: {str(e)}")
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

def verify_invite_code_and_create_user(phone_number, invite_code):
    """验证邀请码并创建新用户"""
    print(f"🔑 验证邀请码: {phone_number} -> {invite_code}")
    
    if DEVELOPMENT_MODE:
        # 开发模式：检查内存中的邀请码
        print(f"📝 可用邀请码: {list(dev_invite_codes.keys())}")
        if invite_code not in dev_invite_codes:
            print(f"❌ 邀请码无效: {invite_code}")
            return {"success": False, "message": "邀请码无效"}
        
        # 创建新用户
        user_id = f"dev_user_{len(dev_users) + 1}"
        dev_users[phone_number] = {
            'id': user_id,
            'phone_number': phone_number,
            'created_at': datetime.now(timezone.utc).isoformat(),
            'invite_code': invite_code
        }
        
        print(f"✅ 开发模式 - 新用户创建成功: {phone_number} (ID: {user_id})")
        return {
            "success": True,
            "message": "新用户注册成功",
            "user_id": user_id,
            "phone_number": phone_number
        }
    else:
        # 生产模式：从Supabase验证邀请码
        invite_result = supabase.table('invite_codes').select('*').eq('code', invite_code).eq('used', False).execute()
        
        if not invite_result.data:
            return {"success": False, "message": "邀请码无效或已使用"}
        
        try:
            # 创建新用户
            new_user = supabase.table('users').insert({
                'phone_number': phone_number,
                'created_at': datetime.now(timezone.utc).isoformat(),
                'invite_code': invite_code
            }).execute()
            
            # 标记邀请码为已使用
            supabase.table('invite_codes').update({'used': True, 'used_by': phone_number}).eq('code', invite_code).execute()
            
            return {
                "success": True,
                "message": "新用户注册成功",
                "user_id": new_user.data[0]['id'],
                "phone_number": phone_number
            }
        except Exception as e:
            return {"success": False, "message": f"用户创建失败: {str(e)}"}

@app.route('/verify-invite-code', methods=['POST'])
def api_verify_invite_code():
    """验证邀请码并创建新用户API"""
    try:
        data = request.get_json()
        phone_number = data.get('phone_number')
        invite_code = data.get('invite_code')
        
        if not phone_number or not invite_code:
            return jsonify({"success": False, "message": "手机号和邀请码不能为空"}), 400
        
        # 验证手机号格式
        if len(phone_number) != 11 or not phone_number.isdigit():
            return jsonify({"success": False, "message": "请输入正确的11位手机号码"}), 400
        
        result = verify_invite_code_and_create_user(phone_number, invite_code)
        
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({"success": False, "message": f"服务器错误: {str(e)}"}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """健康检查API"""
    return jsonify({
        "status": "healthy", 
        "message": "API服务正常运行",
        "cors_origins": ["http://localhost:8081", "http://localhost:3000", "http://localhost:19006"],
        "development_mode": DEVELOPMENT_MODE
    }), 200

if __name__ == '__main__':
    print("=== 手机验证码登录API服务 ===")
    print(f"🔧 开发模式: {DEVELOPMENT_MODE}")
    print("🌐 CORS已配置，支持以下源：")
    print("   - http://localhost:8081 (Expo开发服务器)")
    print("   - http://localhost:3000 (React开发服务器)")
    print("   - http://localhost:19006 (Expo Web)")
    print("📡 API服务启动中...")
    print("🔗 测试连接: http://localhost:5001/health")
    app.run(host='0.0.0.0', port=5001, debug=True)  # 改为5001端口