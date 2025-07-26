/**
 * API服务层 - 处理与后端验证码系统和地址搜索的通信
 * 
 * 功能模块：
 * 1. 手机验证码发送和验证
 * 2. 邀请码验证和用户创建  
 * 3. 高德地图地址搜索（核心功能）
 * 
 * 地址搜索优化策略：
 * - 至少4个汉字才开始搜索
 * - 500ms防抖延迟减少API调用
 * - 5分钟智能缓存机制
 * - 最多返回8个建议
 * - API失败时不显示模拟数据
 */

import { ENV_CONFIG } from '../config/env';

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

// 地址搜索相关接口
export interface AddressSuggestion {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  location?: {
    lat: number;
    lng: number;
  };
}

export interface AddressSearchResponse {
  success: boolean;
  message: string;
  predictions: AddressSuggestion[];
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

 * 搜索地址建议 - 集成高德地图API
 * 优化策略：
 * 1. 最少输入4个汉字才开始搜索
 * 2. 防抖延迟500ms减少API调用
 * 3. 缓存搜索结果，相同关键词不重复调用
 * 4. 最多返回8个建议减少界面复杂度
 */

// 缓存搜索结果
const searchCache = new Map<string, { results: AddressSuggestion[], timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

export async function searchAddresses(query: string): Promise<AddressSearchResponse> {
  try {
    // 输入验证：至少4个汉字
    const trimmedQuery = query.trim();
    const chineseCharCount = (trimmedQuery.match(/[\u4e00-\u9fff]/g) || []).length;

    if (!trimmedQuery || chineseCharCount < 4) {
      return {
        success: true,
        message: '请至少输入4个汉字',
        predictions: []
      };
    }

    const keywords = trimmedQuery;

    // 检查缓存
    const cached = searchCache.get(keywords);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return {
        success: true,
        message: '搜索成功（缓存）',
        predictions: cached.results
      };
    }

    // 调用高德地图API
    // 使用配置的API Key
    const AMAP_KEY = 'f5c712f69f486f3c20627dee943e0a32';
    //无奈之举，被发现就被发现吧

    console.log('高德API Key状态:', AMAP_KEY ? '已配置' : '未配置');

    if (!AMAP_KEY) {
      console.warn('高德地图API Key未配置，使用模拟数据');
      return getFallbackResults(keywords);
    }

    const apiUrl = `https://restapi.amap.com/v3/assistant/inputtips?key=${AMAP_KEY}&keywords=${encodeURIComponent(keywords)}`;
    console.log('调用高德API:', apiUrl);

    const response = await fetch(apiUrl);

    if (!response.ok) {
      console.error(`HTTP错误 ${response.status}: ${response.statusText}`);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('高德API响应:', data);

    // 检查高德API返回状态
    if (data.status !== '1') {
      console.error('高德API错误:', {
        status: data.status,
        info: data.info,
        infocode: data.infocode
      });
      return getFallbackResults(keywords);
    }

    // 转换高德API数据格式为我们的格式
    const suggestions: AddressSuggestion[] = (data.tips || [])
      .slice(0, 8) // 最多8个建议
      .map((tip: any, index: number) => {
        // 解析经纬度信息
        let location = undefined;
        if (tip.location) {
          const [lng, lat] = tip.location.split(',').map(Number);
          if (!isNaN(lat) && !isNaN(lng)) {
            location = { lat, lng };
          }
        }

        return {
          place_id: tip.id || `${keywords}_${index}`,
          description: formatAddress(tip),
          structured_formatting: {
            main_text: tip.name || keywords,
            secondary_text: formatSecondaryText(tip)
          },
          location
        };
      });

    // 缓存结果
    searchCache.set(keywords, {
      results: suggestions,
      timestamp: Date.now()
    });

    // 清理过期缓存（简单的内存管理）
    if (searchCache.size > 100) {
      const now = Date.now();
      for (const [key, value] of searchCache.entries()) {
        if (now - value.timestamp > CACHE_DURATION) {
          searchCache.delete(key);
        }
      }
    }

    return {
      success: true,
      message: '搜索成功',
      predictions: suggestions
    };

  } catch (error) {
    console.error('地址搜索错误:', error);

    // 降级处理：返回模拟数据
    return getFallbackResults(query.trim());
  }
}

/**
 * 格式化地址显示
 */
function formatAddress(tip: any): string {
  const parts = [];

  if (tip.name) parts.push(tip.name);
  if (tip.address && tip.address !== tip.name) parts.push(tip.address);
  if (tip.district) parts.push(tip.district);

  return parts.join(', ') || tip.name || '未知地址';
}

/**
 * 格式化次要文本
 */
function formatSecondaryText(tip: any): string {
  const parts = [];

  if (tip.address && tip.address !== tip.name) parts.push(tip.address);
  if (tip.district) parts.push(tip.district);

  return parts.join(', ') || '详细地址';
}

/**
 * 获取降级结果（当API失败时返回空结果）
 */
function getFallbackResults(keywords: string): AddressSearchResponse {
  console.warn('地址搜索API失败，返回空结果');
  return {
    success: false,
    message: '地址搜索服务暂时不可用，请稍后重试',
    predictions: []
  };
}

/**
 * 获取腾讯地图静态地图URL
 */
export function getTencentStaticMapUrl(lat: number, lng: number): string {
  const TENCENT_MAP_KEY = 'O6QBZ-JLIW3-LHK3Q-RKTV6-TBFZ5-BYBMX';
  const baseUrl = 'https://apis.map.qq.com/ws/staticmap/v2/';

  const params = new URLSearchParams({
    center: `${lat},${lng}`,
    zoom: '17',
    size: '400*300',
    maptype: 'roadmap',
    markers: `size:large|color:0xFF5722|label:k|${lat},${lng}`,
    key: TENCENT_MAP_KEY
  });

  return `${baseUrl}?${params.toString()}`;
}

/**
 * 获取地址的经纬度信息
 */
export async function getAddressLocation(address: string): Promise<{ lat: number, lng: number } | null> {
  try {
    const response = await searchAddresses(address);
    if (response.success && response.predictions.length > 0) {
      const firstResult = response.predictions[0];
      return firstResult.location || null;
    }
    return null;
  } catch (error) {
    console.error('获取地址经纬度失败:', error);
    return null;
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