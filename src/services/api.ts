// API服务层 - 处理与后端验证码系统的通信

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface VerificationResponse {
  success: boolean;
  message: string;
  user_id?: string;
  phone_number?: string;
  is_new_user?: boolean;
}

export interface InviteCodeResponse {
  success: boolean;
  message: string;
  user_id?: string;
  phone_number?: string;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

/**
 * 发送手机验证码
 */
export async function sendVerificationCode(phoneNumber: string): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/send-verification-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone_number: phoneNumber
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '发送验证码失败');
    }

    return data;
  } catch (error) {
    console.error('发送验证码错误:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '网络错误，请重试'
    };
  }
}

/**
 * 验证手机验证码并登录/注册
 */
export async function verifyCodeAndLogin(phoneNumber: string, code: string): Promise<VerificationResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/login-with-phone`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone_number: phoneNumber,
        verification_code: code
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '验证码验证失败');
    }

    return data;
  } catch (error) {
    console.error('验证码验证错误:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '网络错误，请重试'
    };
  }
}

/**
 * 验证邀请码并创建新用户
 */
export async function verifyInviteCodeAndCreateUser(phoneNumber: string, inviteCode: string): Promise<InviteCodeResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/verify-invite-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone_number: phoneNumber,
        invite_code: inviteCode
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '邀请码验证失败');
    }

    return data;
  } catch (error) {
    console.error('邀请码验证错误:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '网络错误，请重试'
    };
  }
}