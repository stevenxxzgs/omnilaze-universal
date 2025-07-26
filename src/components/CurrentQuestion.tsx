import React from 'react';
import { View, Text, Image, Animated } from 'react-native';
import { questionStyles, avatarStyles, loadingStyles } from '../styles/globalStyles';

interface CurrentQuestionProps {
  displayedText: string;
  isTyping: boolean;
  showCursor: boolean;
  inputError: string;
  currentStep: number;
  currentQuestionAnimation: Animated.Value;
  emotionAnimation: Animated.Value;
  shakeAnimation: Animated.Value;
  children?: React.ReactNode;
}

export const CurrentQuestion: React.FC<CurrentQuestionProps> = ({
  displayedText,
  isTyping,
  showCursor,
  inputError,
  currentStep,
  currentQuestionAnimation,
  emotionAnimation,
  shakeAnimation,
  children,
}) => {
  return (
    <Animated.View
      style={[
        {
          opacity: currentQuestionAnimation,
          transform: [{
            translateY: currentQuestionAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [30, 0],
            }),
          }],
        },
      ]}
    >
      <View style={questionStyles.currentQuestionCard}>
        <View style={questionStyles.questionHeader}>
          <Animated.View 
            style={[
              avatarStyles.avatarSimple,
              {
                transform: [{
                  scale: emotionAnimation,
                }],
              },
            ]}
          >
            <Image 
              source={require('../../assets/icon.png')} 
              style={avatarStyles.avatarImage}
            />
          </Animated.View>
          <Animated.View 
            style={[
              questionStyles.questionTextContainer,
              {
                transform: [{
                  translateX: shakeAnimation,
                }],
              },
            ]}
          >
            <Text style={questionStyles.currentQuestionText}>
              {displayedText}
              {isTyping && showCursor && <Text style={questionStyles.cursor}>|</Text>}
            </Text>
            
            {/* 移除了刷新图标 - 原来在这里显示旋转的"⟳"符号 */}
          </Animated.View>
        </View>

        {children}
      </View>
    </Animated.View>
  );
};