import React, { useState, useEffect } from 'react';
import { View, Text, Image, Animated, StyleSheet } from 'react-native';
import { ActionButton } from './ActionButton';
import { COLORS } from '../constants';

interface PaymentComponentProps {
  budget: string;
  animationValue: Animated.Value;
  onConfirmOrder: () => void;
}

export const PaymentComponent: React.FC<PaymentComponentProps> = ({
  budget,
  animationValue,
  onConfirmOrder,
}) => {
  const [showQRCode, setShowQRCode] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const qrCodeAnimation = new Animated.Value(0);
  const buttonAnimation = new Animated.Value(0);

  useEffect(() => {
    // 2秒后显示二维码
    const qrTimer = setTimeout(() => {
      setShowQRCode(true);
      Animated.spring(qrCodeAnimation, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }, 2000);

    // 4秒后显示按钮
    const buttonTimer = setTimeout(() => {
      setShowButton(true);
      Animated.spring(buttonAnimation, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }, 4000);

    return () => {
      clearTimeout(qrTimer);
      clearTimeout(buttonTimer);
    };
  }, []);

  const WrapperComponent = animationValue ? Animated.View : View;
  const wrapperProps = animationValue 
    ? {
        style: [
          styles.container,
          {
            opacity: animationValue,
            transform: [{
              translateY: animationValue.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            }],
          },
        ],
      }
    : { style: styles.container };

  return (
    <WrapperComponent {...wrapperProps}>
      {/* 支付问题文本 */}
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>请扫码支付订单金额并确认下单</Text>
      </View>
      
      {showQRCode && (
        <Animated.View 
          style={[
            styles.paymentSection,
            {
              opacity: qrCodeAnimation,
              transform: [{
                translateY: qrCodeAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                }),
              }],
            },
          ]}
        >
          <View style={styles.qrCodeContainer}>
            <Image 
              source={require('../../assets/food/支付二维码.png')} 
              style={styles.qrCodeImage}
              resizeMode="contain"
            />
            <Text style={styles.budgetText}>支付金额：¥{budget}</Text>
          </View>
        </Animated.View>
      )}
      
      {showButton && (
        <Animated.View
          style={[
            styles.buttonContainer,
            {
              opacity: buttonAnimation,
              transform: [{
                translateY: buttonAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              }],
            },
          ]}
        >
          <ActionButton
            onPress={onConfirmOrder}
            title="确认下单"
            isActive={true}
            animationValue={new Animated.Value(1)}
          />
        </Animated.View>
      )}
    </WrapperComponent>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  questionContainer: {
    marginBottom: 16,
  },
  questionText: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'left',
    lineHeight: 32,
  },
  paymentSection: {
    marginBottom: 24,
  },
  qrCodeContainer: {
    alignItems: 'flex-start', // 靠左对齐
    paddingLeft: 0,
  },
  qrCodeImage: {
    width: 180,
    height: 180,
    marginBottom: 12,
  },
  budgetText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  buttonContainer: {
    marginTop: 16,
  },
});