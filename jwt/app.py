import requests
import random
import string
import time
import json
from datetime import datetime, timedelta, timezone
from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SPUG_URL = os.getenv("SPUG_URL")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def generate_verification_code():
    return ''.join(random.choices(string.digits, k=6))

def store_verification_code(phone_number, code):
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
    
    body = {'name': '验证码', 'code': code, 'targets': phone_number}
    response = requests.post(SPUG_URL:, json=body)
    
    if response.status_code == 200:
        return {"success": True, "message": "验证码发送成功"}
    else:
        return {"success": False, "message": "验证码发送失败"}

def verify_code(phone_number, input_code):
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
    
    supabase.table('verification_codes').update({'used': True}).eq('id', code_record['id']).execute()
    
    return {"success": True, "message": "验证码验证成功"}

def login_with_phone(phone_number, verification_code):
    verify_result = verify_code(phone_number, verification_code)
    
    if not verify_result["success"]:
        return verify_result
    
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

def main():
    print("=== 手机验证码登录系统 ===")
    
    phone_number = input("请输入手机号: ").strip()
    
    if not phone_number:
        print("手机号不能为空")
        return
    
    print(f"正在向 {phone_number} 发送验证码...")
    send_result = send_verification_code(phone_number)
    
    if not send_result["success"]:
        print(f"发送失败: {send_result['message']}")
        return
    
    print("验证码已发送，请查收短信")
    
    while True:
        try:
            code = input("请输入6位验证码 (输入 'q' 退出): ").strip()
            
            if code.lower() == 'q':
                print("退出程序")
                break
            
            if not code or len(code) != 6 or not code.isdigit():
                print("请输入6位数字验证码")
                continue
            
            verify_result = verify_code(phone_number, code)
            
            if verify_result["success"]:
                print(f"✓ {verify_result['message']}")
                
                login_result = login_with_phone(phone_number, code)
                if login_result["success"]:
                    print(f"✓ 登录成功！用户ID: {login_result['user_id']}")
                break
            else:
                print(f"✗ {verify_result['message']}")
                
                if "已过期" in verify_result['message']:
                    retry = input("验证码已过期，是否重新发送？(y/n): ").strip().lower()
                    if retry == 'y':
                        print("正在重新发送验证码...")
                        send_result = send_verification_code(phone_number)
                        if send_result["success"]:
                            print("验证码已重新发送")
                        else:
                            print(f"发送失败: {send_result['message']}")
                            break
                    else:
                        break
                        
        except KeyboardInterrupt:
            print("\n程序被中断")
            break
        except Exception as e:
            print(f"发生错误: {e}")

if __name__ == "__main__":
    main()