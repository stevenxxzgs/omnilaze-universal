import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Platform } from 'react-native';
import { SimpleIcon } from './SimpleIcon';
import { COLORS } from '../constants';

interface InviteModalProps {
  isVisible: boolean;
  onClose: () => void;
  userPhoneNumber: string;
}

export const InviteModal: React.FC<InviteModalProps> = ({
  isVisible,
  onClose,
  userPhoneNumber,
}) => {
  const [copied, setCopied] = useState(false);

  // 生成邀请码（基于手机号的简单算法）
  const generateInviteCode = (phoneNumber: string): string => {
    // 简单的邀请码生成逻辑，实际项目中应该从后端获取
    const hash = phoneNumber.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return `INV${Math.abs(hash).toString().substr(0, 6)}`;
  };

  const inviteCode = generateInviteCode(userPhoneNumber);
  const inviteText = `我在用懒得点外卖，体验非常棒！使用我的邀请码 ${inviteCode} 到order.omnilaze.co注册，一起享受智能点餐服务吧！🎉`;

  // Web环境下使用navigator.clipboard，React Native使用不同的API
  const copyToClipboard = async (text: string) => {
    try {
      if (Platform.OS === 'web') {
        // Web环境
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(text);
        } else {
          // 降级方案：创建临时输入框
          const textArea = document.createElement('textarea');
          textArea.value = text;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
        }
      } else {
        // React Native环境 - 这里可以使用Clipboard
        // await Clipboard.setString(text);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('复制失败:', error);
      // 即使复制失败也显示提示
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyInviteCode = () => copyToClipboard(inviteCode);
  const handleCopyInviteText = () => copyToClipboard(inviteText);

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        
        <View style={styles.modal}>
          {/* 标题栏 */}
          <View style={styles.header}>
            <Text style={styles.title}>邀请朋友</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <SimpleIcon name="close" size={20} color={COLORS.TEXT_SECONDARY} />
            </TouchableOpacity>
          </View>

          {/* 内容 */}
          <View style={styles.content}>
            <Text style={styles.description}>
              分享你的邀请码，让朋友也体验智能外卖服务
            </Text>

            {/* 邀请码 */}
            <View style={styles.inviteCodeContainer}>
              <Text style={styles.inviteCodeLabel}>你的邀请码</Text>
              <View style={styles.inviteCodeBox}>
                <Text style={styles.inviteCodeText}>{inviteCode}</Text>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={handleCopyInviteCode}
                  activeOpacity={0.7}
                >
                  <SimpleIcon 
                    name={copied ? "check" : "copy"} 
                    size={16} 
                    color={copied ? "#10b981" : COLORS.PRIMARY} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* 邀请文本 */}
            <View style={styles.inviteTextContainer}>
              <Text style={styles.inviteTextLabel}>分享文本</Text>
              <View style={styles.inviteTextBox}>
                <Text style={styles.inviteText}>{inviteText}</Text>
              </View>
              <TouchableOpacity
                style={styles.copyTextButton}
                onPress={handleCopyInviteText}
                activeOpacity={0.7}
              >
                <SimpleIcon name="copy" size={16} color={COLORS.WHITE} />
                <Text style={styles.copyTextButtonText}>复制邀请文本</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modal: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 20,
  },
  description: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 20,
    lineHeight: 24,
  },
  inviteCodeContainer: {
    marginBottom: 24,
  },
  inviteCodeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  inviteCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
  },
  inviteCodeText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.PRIMARY,
    fontFamily: 'monospace',
  },
  copyButton: {
    padding: 8,
  },
  inviteTextContainer: {
    marginBottom: 8,
  },
  inviteTextLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  inviteTextBox: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inviteText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 20,
  },
  copyTextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  copyTextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.WHITE,
    marginLeft: 8,
  },
});