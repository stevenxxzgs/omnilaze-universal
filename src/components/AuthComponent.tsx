import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { BaseInput } from './BaseInput';
import { ActionButton } from './ActionButton';
import { sendVerificationCode, verifyCodeAndLogin, verifyInviteCodeAndCreateUser } from '../services/api';

export interface AuthResult {
  success: boolean;
  isNewUser: boolean;
  userId?: string;
  phoneNumber: string;
  message?: string;
}

export interface AuthComponentProps {
  onAuthSuccess: (result: AuthResult) => void;
  onError: (error: string) => void;
  onQuestionChange: (question: string) => void; // 新增：更新问题文本的回调
  animationValue: any;
  validatePhoneNumber: (phone: string) => boolean;
  triggerShake: () => void;
  changeEmotion: (emoji: string) => void;
}

export const AuthComponent: React.FC<AuthComponentProps> = ({
  onAuthSuccess,
  onError,
  onQuestionChange,
  animationValue,
  validatePhoneNumber,
  triggerShake,
  changeEmotion,
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isVerificationCodeSent, setIsVerificationCodeSent] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [inputError, setInputError] = useState('');

  // 初始化时设置问题文本
  useEffect(() => {
    onQuestionChange('请输入手机号获取验证码');
  }, []);

  // 倒计时 useEffect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendVerificationCode = async () => {
    if (!validatePhoneNumber(phoneNumber) || phoneNumber.length !== 11) {
      triggerShake();
      setInputError('请输入正确的11位手机号');
      return;
    }
    
    try {
      const result = await sendVerificationCode(phoneNumber);
      
      if (result.success) {
        setIsVerificationCodeSent(true);
        setCountdown(180); // 3分钟倒计时
        changeEmotion('📱');
        setInputError('');
        onQuestionChange('请输入收到的6位验证码'); // 更新问题文本
      } else {
        setInputError(result.message);
        triggerShake();
      }
    } catch (error) {
      setInputError('发送验证码失败，请重试');
      triggerShake();
      console.error('发送验证码错误:', error);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      setInputError('请输入6位验证码');
      triggerShake();
      return;
    }
    
    try {
      const result = await verifyCodeAndLogin(phoneNumber, verificationCode);
      
      if (result.success) {
        setIsPhoneVerified(true);
        setInputError('');
        changeEmotion('✅');
        
        // 判断是否为新用户（这里需要后端API返回新的字段）
        const isUserNew = result.is_new_user || false;
        setIsNewUser(isUserNew);
        
        if (isUserNew) {
          // 新用户需要输入邀请码
          changeEmotion('🔑');
          onQuestionChange('欢迎新用户！请输入邀请码完成注册'); // 更新问题文本
        } else {
          // 老用户直接成功
          onAuthSuccess({
            success: true,
            isNewUser: false,
            userId: result.user_id,
            phoneNumber: result.phone_number || phoneNumber,
          });
        }
      } else {
        setInputError(result.message);
        triggerShake();
      }
    } catch (error) {
      setInputError('验证失败，请重试');
      triggerShake();
      console.error('验证码验证错误:', error);
    }
  };

  const handleVerifyInviteCode = async () => {
    if (inviteCode.length < 4) {
      setInputError('请输入有效的邀请码');
      triggerShake();
      return;
    }

    try {
      const result = await verifyInviteCodeAndCreateUser(phoneNumber, inviteCode);
      
      if (result.success) {
        changeEmotion('🎉');
        setInputError('');
        
        onAuthSuccess({
          success: true,
          isNewUser: true,
          userId: result.user_id,
          phoneNumber: result.phone_number || phoneNumber,
        });
      } else {
        setInputError(result.message);
        triggerShake();
      }
    } catch (error) {
      setInputError('验证邀请码失败，请重试');
      triggerShake();
      console.error('邀请码验证错误:', error);
    }
  };

  const renderPhoneInput = () => (
    <BaseInput
      value={phoneNumber}
      onChangeText={setPhoneNumber}
      placeholder="请输入11位手机号"
      iconName="phone"
      keyboardType="numeric"
      maxLength={11}
      isError={!validatePhoneNumber(phoneNumber) && phoneNumber.length > 0}
      onClear={() => setPhoneNumber('')}
      animationValue={animationValue}
    />
  );

  const renderVerificationCodeInput = () => (
    <View style={{ marginTop: 16 }}>
      <BaseInput
        value={verificationCode}
        onChangeText={setVerificationCode}
        placeholder="请输入6位验证码"
        iconName="security"
        keyboardType="numeric"
        maxLength={6}
        isError={inputError.includes('验证码')}
        onClear={() => setVerificationCode('')}
        onSubmitEditing={handleVerifyCode}
        animationValue={animationValue}
      />
    </View>
  );

  const renderInviteCodeInput = () => (
    <View style={{ marginTop: 16 }}>
      <BaseInput
        value={inviteCode}
        onChangeText={setInviteCode}
        placeholder="请输入邀请码"
        iconName="card-membership"
        isError={inputError.includes('邀请码')}
        onClear={() => setInviteCode('')}
        onSubmitEditing={handleVerifyInviteCode}
        animationValue={animationValue}
      />
    </View>
  );

  const renderActionButtons = () => {
    // 新用户邀请码验证阶段
    if (isPhoneVerified && isNewUser) {
      return (
        <ActionButton
          onPress={handleVerifyInviteCode}
          title="验证邀请码"
          disabled={inviteCode.length < 4}
          isActive={inviteCode.length >= 4}
          animationValue={animationValue}
        />
      );
    }
    
    // 手机号步骤的按钮逻辑
    if (!isVerificationCodeSent) {
      return (
        <ActionButton
          onPress={handleSendVerificationCode}
          title="发送验证码"
          disabled={!validatePhoneNumber(phoneNumber) || phoneNumber.length !== 11}
          isActive={validatePhoneNumber(phoneNumber) && phoneNumber.length === 11}
          animationValue={animationValue}
        />
      );
    } else if (!isPhoneVerified) {
      return (
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <ActionButton
            onPress={handleVerifyCode}
            title="确认"
            disabled={verificationCode.length !== 6}
            isActive={verificationCode.length === 6}
            animationValue={animationValue}
          />
          <ActionButton
            onPress={handleSendVerificationCode}
            title={countdown > 0 ? `重新发送(${countdown}s)` : "重新发送"}
            disabled={countdown > 0}
            isActive={countdown === 0}
            animationValue={animationValue}
          />
        </View>
      );
    }
    
    return null;
  };

  return (
    <View>
      {renderPhoneInput()}
      
      {isVerificationCodeSent && !isPhoneVerified && renderVerificationCodeInput()}
      
      {isPhoneVerified && isNewUser && renderInviteCodeInput()}
      
      {inputError && (
        <Text style={{
          color: '#ff4444',
          fontSize: 14,
          marginTop: 8,
          textAlign: 'center'
        }}>
          {inputError}
        </Text>
      )}
      
      <View style={{ marginTop: 16 }}>
        {renderActionButtons()}
      </View>
    </View>
  );
};