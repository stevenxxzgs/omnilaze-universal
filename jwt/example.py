from python import send_verification_code, login_with_phone

# 使用示例

# 1. 发送验证码
phone = "13066905418"
result = send_verification_code(phone)
print("发送验证码结果:", result)

# 2. 验证码登录（在实际使用中，用户会收到验证码并输入）
# code = input("请输入收到的验证码: ")
# login_result = login_with_phone(phone, code)
# print("登录结果:", login_result)