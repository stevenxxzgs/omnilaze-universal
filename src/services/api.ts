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

export interface OrderData {
  address: string;
  allergies: string[];
  preferences: string[];
  budget: string;
}

export interface CreateOrderResponse {
  success: boolean;
  message: string;
  order_id?: string;
  order_number?: string;
}

export interface SubmitOrderResponse {
  success: boolean;
  message: string;
  order_number?: string;
}

export interface FeedbackResponse {
  success: boolean;
  message: string;
}

export interface OrdersResponse {
  success: boolean;
  orders: any[];
  count: number;
}

// API 基础 URL 配置
const getApiBaseUrl = () => {
  // 生产环境：优先使用自定义域名
  if (process.env.NODE_ENV === 'production') {
    return process.env.REACT_APP_API_URL || 'https://api.omnilaze.co';
  }
  
  // 开发环境：检查本地服务器或使用线上地址
  const localUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
  
  // 如果设置了生产 URL 作为开发环境的备选，使用它
  if (localUrl.startsWith('https://') && (localUrl.includes('workers.dev') || localUrl.includes('omnilaze.co'))) {
    return localUrl;
  }
  
  return localUrl;
};

const API_BASE_URL = getApiBaseUrl();

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

/**
 * 创建订单
 */
export async function createOrder(userId: string, phoneNumber: string, formData: OrderData): Promise<CreateOrderResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        phone_number: phoneNumber,
        form_data: formData
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '创建订单失败');
    }

    return data;
  } catch (error) {
    console.error('创建订单错误:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '网络错误，请重试'
    };
  }
}

/**
 * 提交订单
 */
export async function submitOrder(orderId: string): Promise<SubmitOrderResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/submit-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order_id: orderId
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '提交订单失败');
    }

    return data;
  } catch (error) {
    console.error('提交订单错误:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '网络错误，请重试'
    };
  }
}

/**
 * 提交订单反馈
 */
export async function submitOrderFeedback(orderId: string, rating: number, feedback: string): Promise<FeedbackResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/order-feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order_id: orderId,
        rating: rating,
        feedback: feedback
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '提交反馈失败');
    }

    return data;
  } catch (error) {
    console.error('提交反馈错误:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '网络错误，请重试'
    };
  }
}

/**
 * 获取用户订单列表
 */
export async function getUserOrders(userId: string): Promise<OrdersResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '获取订单列表失败');
    }

    return data;
  } catch (error) {
    console.error('获取订单列表错误:', error);
    return {
      success: false,
      orders: [],
      count: 0
    };
  }
}