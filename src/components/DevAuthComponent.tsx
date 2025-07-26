import React from 'react';
import { View, Text } from 'react-native';
import { ActionButton } from './ActionButton';
import { AuthResult, AuthComponentProps } from './AuthComponent';
import { DEV_CONFIG } from '../constants';

export const DevAuthComponent: React.FC<AuthComponentProps> = ({
  onAuthSuccess,
  onError,
  onQuestionChange,
  animationValue,
  triggerShake,
  changeEmotion,
}) => {
  const handleDevLogin = () => {
    changeEmotion('🔧');
    
    // 模拟开发登录成功
    const mockAuthResult: AuthResult = {
      success: true,
      isNewUser: DEV_CONFIG.MOCK_USER.is_new_user,
      userId: DEV_CONFIG.MOCK_USER.user_id,
      phoneNumber: DEV_CONFIG.MOCK_USER.phone_number,
      message: '开发模式登录成功'
    };
    
    setTimeout(() => {
      changeEmotion('✅');
      onAuthSuccess(mockAuthResult);
    }, 500);
  };

  return (
    <View>
      <View style={{
        backgroundColor: '#FFF3CD',
        borderWidth: 1,
        borderColor: '#FFEAA7',
        borderRadius: 8,
        padding: 16,
        marginBottom: 20,
      }}>
        <Text style={{
          color: '#8B6914',
          fontSize: 14,
          fontWeight: '500',
          textAlign: 'center',
          marginBottom: 8,
        }}>
          🔧 开发模式
        </Text>
        <Text style={{
          color: '#8B6914',
          fontSize: 12,
          textAlign: 'center',
          lineHeight: 16,
        }}>
          当前处于开发模式，将跳过JWT认证步骤{'\n'}
          点击下方按钮直接进入应用
        </Text>
      </View>
      
      <ActionButton
        onPress={handleDevLogin}
        title="开发模式登录"
        disabled={false}
        isActive={true}
        animationValue={animationValue}
      />
      
      <Text style={{
        color: '#6B7280',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 12,
        fontStyle: 'italic',
      }}>
        模拟用户: {DEV_CONFIG.MOCK_USER.phone_number}
      </Text>
    </View>
  );
};