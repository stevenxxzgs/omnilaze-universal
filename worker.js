// Cloudflare Workers API for OmniLaze Universal
// 替代原来的Flask app.py

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // CORS处理
    const corsHeaders = {
      'Access-Control-Allow-Origin': getAllowedOrigin(request, env),
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    };

    // 处理预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      let response;
      
      // 路由匹配
      switch (url.pathname) {
        case '/health':
          response = await handleHealth(env);
          break;
        case '/send-verification-code':
          response = await handleSendVerificationCode(request, env);
          break;
        case '/login-with-phone':
          response = await handleLoginWithPhone(request, env);
          break;
        case '/verify-invite-code':
          response = await handleVerifyInviteCode(request, env);
          break;
        case '/create-order':
          response = await handleCreateOrder(request, env);
          break;
        case '/submit-order':
          response = await handleSubmitOrder(request, env);
          break;
        case '/order-feedback':
          response = await handleOrderFeedback(request, env);
          break;
        default:
          if (url.pathname.startsWith('/orders/')) {
            const userId = url.pathname.split('/')[2];
            response = await handleGetUserOrders(userId, env);
          } else {
            response = new Response('Not Found', { status: 404 });
          }
          break;
      }

      // 添加CORS头到响应
      Object.keys(corsHeaders).forEach(key => {
        response.headers.set(key, corsHeaders[key]);
      });

      return response;
    } catch (error) {
      console.error('Worker error:', error);
      const errorResponse = new Response(
        JSON.stringify({ 
          success: false, 
          message: '服务器内部错误' 
        }), 
        { 
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          }
        }
      );
      return errorResponse;
    }
  },
};

// 获取允许的CORS源
function getAllowedOrigin(request, env) {
  const origin = request.headers.get('Origin');
  const allowedOrigins = JSON.parse(env.ALLOWED_ORIGINS || '["*"]');
  
  if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
    return origin || '*';
  }
  
  return allowedOrigins[0] || '*';
}

// 健康检查端点
async function handleHealth(env) {
  return new Response(JSON.stringify({
    status: 'healthy',
    message: 'Cloudflare Workers API正常运行',
    environment: env.ENVIRONMENT || 'development',
    timestamp: new Date().toISOString()
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// 生成6位验证码
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 发送验证码
async function handleSendVerificationCode(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const data = await request.json();
  const phoneNumber = data.phone_number;

  if (!phoneNumber) {
    return new Response(JSON.stringify({
      success: false,
      message: '手机号不能为空'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 验证手机号格式
  if (phoneNumber.length !== 11 || !/^\d{11}$/.test(phoneNumber)) {
    return new Response(JSON.stringify({
      success: false,
      message: '请输入正确的11位手机号码'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10分钟后过期

  // 存储验证码到KV
  const codeData = {
    code,
    expires_at: expiresAt.toISOString(),
    used: false,
    created_at: new Date().toISOString()
  };

  await env.VERIFICATION_KV.put(
    `verification:${phoneNumber}`, 
    JSON.stringify(codeData),
    { expirationTtl: 600 } // 10分钟TTL
  );

  // 开发模式：返回验证码，生产模式：发送短信
  if (env.ENVIRONMENT === 'development') {
    console.log(`📱 开发模式 - 验证码: ${phoneNumber} -> ${code}`);
    return new Response(JSON.stringify({
      success: true,
      message: '验证码发送成功（开发模式）',
      dev_code: code
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } else {
    // 生产模式：调用短信服务
    try {
      const smsResponse = await fetch(env.SPUG_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '验证码',
          code: code,
          targets: phoneNumber
        })
      });

      if (smsResponse.ok) {
        return new Response(JSON.stringify({
          success: true,
          message: '验证码发送成功'
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        throw new Error('SMS service failed');
      }
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        message: '验证码发送失败'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
}

// 验证码登录
async function handleLoginWithPhone(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const data = await request.json();
  const { phone_number: phoneNumber, verification_code: code } = data;

  if (!phoneNumber || !code) {
    return new Response(JSON.stringify({
      success: false,
      message: '手机号和验证码不能为空'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 验证格式
  if (phoneNumber.length !== 11 || !/^\d{11}$/.test(phoneNumber)) {
    return new Response(JSON.stringify({
      success: false,
      message: '请输入正确的11位手机号码'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (code.length !== 6 || !/^\d{6}$/.test(code)) {
    return new Response(JSON.stringify({
      success: false,
      message: '请输入6位数字验证码'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 从KV获取验证码
  const codeDataStr = await env.VERIFICATION_KV.get(`verification:${phoneNumber}`);
  if (!codeDataStr) {
    return new Response(JSON.stringify({
      success: false,
      message: '验证码不存在或已使用'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const codeData = JSON.parse(codeDataStr);
  
  // 检查是否已使用
  if (codeData.used) {
    return new Response(JSON.stringify({
      success: false,
      message: '验证码不存在或已使用'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 检查是否过期
  if (new Date() > new Date(codeData.expires_at)) {
    return new Response(JSON.stringify({
      success: false,
      message: '验证码已过期'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 验证验证码
  if (codeData.code !== code) {
    return new Response(JSON.stringify({
      success: false,
      message: '验证码错误'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 标记验证码为已使用
  codeData.used = true;
  await env.VERIFICATION_KV.put(
    `verification:${phoneNumber}`, 
    JSON.stringify(codeData),
    { expirationTtl: 60 } // 1分钟后删除
  );

  // 检查用户是否存在
  const userQuery = `SELECT * FROM users WHERE phone_number = ?`;
  const userResult = await env.DB.prepare(userQuery).bind(phoneNumber).first();

  let isNewUser = !userResult;
  let userId = userResult ? userResult.id : null;

  return new Response(JSON.stringify({
    success: true,
    message: isNewUser ? '新用户验证成功，请输入邀请码' : '验证成功',
    user_id: userId,
    phone_number: phoneNumber,
    is_new_user: isNewUser
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// 验证邀请码并创建新用户
async function handleVerifyInviteCode(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const data = await request.json();
  const { phone_number: phoneNumber, invite_code: inviteCode } = data;

  if (!phoneNumber || !inviteCode) {
    return new Response(JSON.stringify({
      success: false,
      message: '手机号和邀请码不能为空'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 验证邀请码
  const inviteQuery = `SELECT * FROM invite_codes WHERE code = ? AND used = 0`;
  const inviteResult = await env.DB.prepare(inviteQuery).bind(inviteCode).first();

  if (!inviteResult) {
    return new Response(JSON.stringify({
      success: false,
      message: '邀请码无效或已使用'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // 创建新用户
    const userId = crypto.randomUUID();
    const createUserQuery = `
      INSERT INTO users (id, phone_number, created_at, invite_code) 
      VALUES (?, ?, ?, ?)
    `;
    await env.DB.prepare(createUserQuery)
      .bind(userId, phoneNumber, new Date().toISOString(), inviteCode)
      .run();

    // 标记邀请码为已使用
    const updateInviteQuery = `
      UPDATE invite_codes 
      SET used = 1, used_by = ?, used_at = ? 
      WHERE code = ?
    `;
    await env.DB.prepare(updateInviteQuery)
      .bind(phoneNumber, new Date().toISOString(), inviteCode)
      .run();

    return new Response(JSON.stringify({
      success: true,
      message: '新用户注册成功',
      user_id: userId,
      phone_number: phoneNumber
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Create user error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '用户创建失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 生成订单号
function generateOrderNumber() {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD${today}${randomPart}`;
}

// 创建订单
async function handleCreateOrder(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const data = await request.json();
  const { user_id: userId, phone_number: phoneNumber, form_data: formData } = data;

  if (!userId || !phoneNumber) {
    return new Response(JSON.stringify({
      success: false,
      message: '用户信息不能为空'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!formData.address) {
    return new Response(JSON.stringify({
      success: false,
      message: '配送地址不能为空'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!formData.budget || parseFloat(formData.budget) <= 0) {
    return new Response(JSON.stringify({
      success: false,
      message: '预算金额无效'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const orderId = crypto.randomUUID();
    const orderNumber = generateOrderNumber();
    const now = new Date().toISOString();

    const createOrderQuery = `
      INSERT INTO orders (
        id, order_number, user_id, phone_number, status, order_date, 
        created_at, delivery_address, dietary_restrictions, 
        food_preferences, budget_amount, budget_currency, is_deleted
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await env.DB.prepare(createOrderQuery).bind(
      orderId,
      orderNumber,
      userId,
      phoneNumber,
      'draft',
      new Date().toISOString().slice(0, 10),
      now,
      formData.address,
      JSON.stringify(formData.allergies || []),
      JSON.stringify(formData.preferences || []),
      parseFloat(formData.budget),
      'CNY',
      0
    ).run();

    return new Response(JSON.stringify({
      success: true,
      message: '订单创建成功',
      order_id: orderId,
      order_number: orderNumber
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Create order error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '订单创建失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 提交订单
async function handleSubmitOrder(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const data = await request.json();
  const { order_id: orderId } = data;

  if (!orderId) {
    return new Response(JSON.stringify({
      success: false,
      message: '订单ID不能为空'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const updateQuery = `
      UPDATE orders 
      SET status = ?, submitted_at = ?, updated_at = ? 
      WHERE id = ?
    `;
    
    const result = await env.DB.prepare(updateQuery)
      .bind('submitted', new Date().toISOString(), new Date().toISOString(), orderId)
      .run();

    if (result.changes === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: '订单不存在'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 获取订单号
    const orderQuery = `SELECT order_number FROM orders WHERE id = ?`;
    const orderResult = await env.DB.prepare(orderQuery).bind(orderId).first();

    return new Response(JSON.stringify({
      success: true,
      message: '订单提交成功',
      order_number: orderResult.order_number
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Submit order error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '订单提交失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 订单反馈
async function handleOrderFeedback(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const data = await request.json();
  const { order_id: orderId, rating, feedback } = data;

  if (!orderId) {
    return new Response(JSON.stringify({
      success: false,
      message: '订单ID不能为空'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
    return new Response(JSON.stringify({
      success: false,
      message: '评分必须在1-5之间'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const updateQuery = `
      UPDATE orders 
      SET user_rating = ?, user_feedback = ?, feedback_submitted_at = ?, updated_at = ? 
      WHERE id = ?
    `;
    
    const result = await env.DB.prepare(updateQuery)
      .bind(rating, feedback || '', new Date().toISOString(), new Date().toISOString(), orderId)
      .run();

    if (result.changes === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: '订单不存在'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: '反馈提交成功'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Order feedback error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '反馈提交失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 获取用户订单列表
async function handleGetUserOrders(userId, env) {
  if (!userId) {
    return new Response(JSON.stringify({
      success: false,
      message: '用户ID不能为空'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const ordersQuery = `
      SELECT * FROM orders 
      WHERE user_id = ? AND is_deleted = 0 
      ORDER BY created_at DESC
    `;
    
    const result = await env.DB.prepare(ordersQuery).bind(userId).all();

    return new Response(JSON.stringify({
      success: true,
      orders: result.results || [],
      count: result.results ? result.results.length : 0
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '获取订单列表失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}