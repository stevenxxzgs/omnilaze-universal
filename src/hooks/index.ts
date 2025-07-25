import { useState, useRef, useEffect } from 'react';
import { Animated, Dimensions } from 'react-native';
import { TIMING, VALIDATION } from '../constants';
import type { Answer, ValidationResult } from '../types';

const { height } = Dimensions.get('window');

export const useTypewriterEffect = () => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, TIMING.CURSOR_BLINK);
    
    return () => clearInterval(cursorInterval);
  }, []);

  const typeText = (text: string, speed: number = TIMING.TYPING_SPEED) => {
    setIsTyping(true);
    setDisplayedText('');
    
    let index = 0;
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.substring(0, index + 1));
        index++;
      } else {
        setIsTyping(false);
        clearInterval(timer);
      }
    }, speed);
    
    return timer;
  };

  return {
    displayedText,
    isTyping,
    showCursor,
    typeText,
    setDisplayedText,
  };
};

export const useValidation = () => {
  const [inputError, setInputError] = useState('');

  const validatePhoneNumber = (phone: string): boolean => {
    return VALIDATION.PHONE_REGEX.test(phone);
  };

  const validateInput = (step: number, value: any): ValidationResult => {
    setInputError('');
    
    switch (step) {
      case 0: // 地址
        if (!value || value.trim().length < VALIDATION.MIN_ADDRESS_LENGTH) {
          const errorMessage = '请输入完整的配送地址';
          setInputError(errorMessage);
          return { isValid: false, errorMessage };
        }
        return { isValid: true };
        
      case 1: // 手机号
        if (!validatePhoneNumber(value)) {
          const errorMessage = '请输入正确的11位手机号码';
          setInputError(errorMessage);
          return { isValid: false, errorMessage };
        }
        return { isValid: true };
        
      case 2: // 预算
        const budgetNum = parseFloat(value);
        if (!value || budgetNum <= 0) {
          const errorMessage = '请设置一个合理的预算金额';
          setInputError(errorMessage);
          return { isValid: false, errorMessage };
        }
        if (budgetNum < VALIDATION.MIN_BUDGET) {
          const errorMessage = '预算至少需要10元哦';
          setInputError(errorMessage);
          return { isValid: false, errorMessage };
        }
        return { isValid: true };
        
      case 3: // 忌口
      case 4: // 偏好
        return { isValid: true };
        
      default:
        return { isValid: true };
    }
  };

  return {
    inputError,
    validateInput,
    validatePhoneNumber,
    setInputError,
  };
};

export const useScrollCalculation = (completedAnswers: any, stepContent: any[]) => {
  const scrollViewRef = useRef<any>(null);
  const [contentHeight, setContentHeight] = useState(800);

  const calculateScrollPosition = (predictNextStep = false) => {
    const questionLineHeight = 32;
    const answerLineHeight = 36;
    const questionMargin = 53;
    const answerMargin = 44;
    const currentQuestionMargin = 80;
    const inputSectionHeight = 100;
    const buttonHeight = 50;
    
    let totalHeight = 0;
    
    Object.keys(completedAnswers).forEach((stepIndex) => {
      const index = parseInt(stepIndex);
      const answer = completedAnswers[index];
      
      const questionText = stepContent[index].message;
      const questionLines = Math.ceil(questionText.length / VALIDATION.CHARACTERS_PER_LINE);
      const questionHeight = questionLines * questionLineHeight + 32;
      
      const answerText = formatAnswerDisplay(answer);
      const answerLines = Math.ceil(answerText.length / VALIDATION.ANSWER_CHARACTERS_PER_LINE);
      const answerHeight = answerLines * answerLineHeight + answerMargin;
      
      totalHeight += questionHeight + answerHeight + questionMargin;
    });
    
    const targetStep = predictNextStep ? 
      Math.min(Object.keys(completedAnswers).length, stepContent.length - 1) : 
      Object.keys(completedAnswers).length;
      
    if (targetStep < stepContent.length) {
      const targetQuestionText = stepContent[targetStep].message;
      const targetQuestionLines = Math.ceil(targetQuestionText.length / VALIDATION.CHARACTERS_PER_LINE);
      const targetQuestionHeight = targetQuestionLines * questionLineHeight + 32;
      
      totalHeight += targetQuestionHeight + inputSectionHeight + buttonHeight + currentQuestionMargin;
    }
    
    const targetFromBottom = height * 0.25;
    const scrollToPosition = Math.max(0, totalHeight - height + targetFromBottom);
    
    return scrollToPosition;
  };

  const formatAnswerDisplay = (answer: Answer) => {
    if (!answer) return '';
    switch (answer.type) {
      case 'address': return answer.value;
      case 'phone': return answer.value;
      case 'budget': return `¥${answer.value}`;
      case 'allergy': return answer.value || '无忌口';
      case 'preference': return answer.value || '无特殊偏好';
      default: return answer.value;
    }
  };

  const handleScrollAfterAnswer = () => {
    const scrollPosition = calculateScrollPosition(true);
    
    const requiredHeight = scrollPosition + height;
    if (requiredHeight > contentHeight) {
      setContentHeight(requiredHeight + 200);
    }
    
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: scrollPosition,
        animated: true
      });
    }, 100);
  };

  return {
    scrollViewRef,
    contentHeight,
    handleScrollAfterAnswer,
    calculateScrollPosition,
  };
};

export const useAnimations = () => {
  const [questionAnimations] = useState(() => 
    Array.from({ length: 5 }, () => new Animated.Value(1))
  );
  const [answerAnimations] = useState(() => 
    Array.from({ length: 5 }, () => new Animated.Value(0))
  );
  const [currentQuestionAnimation] = useState(new Animated.Value(0));
  const [mapAnimation] = useState(new Animated.Value(0));
  const [emotionAnimation] = useState(new Animated.Value(1));
  const [shakeAnimation] = useState(new Animated.Value(0));
  const [inputSectionAnimation] = useState(new Animated.Value(0));
  const [themeAnimation] = useState(new Animated.Value(0));

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: TIMING.SHAKE_DURATION, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: TIMING.SHAKE_DURATION, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: TIMING.SHAKE_DURATION, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: TIMING.SHAKE_DURATION, useNativeDriver: true }),
    ]).start();
  };

  const changeEmotion = (newEmotion: string, callback?: () => void) => {
    Animated.sequence([
      Animated.timing(emotionAnimation, {
        toValue: 0.5,
        duration: TIMING.EMOTION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(emotionAnimation, {
        toValue: 1,
        duration: TIMING.EMOTION_DURATION,
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback?.();
    });
  };

  return {
    questionAnimations,
    answerAnimations,
    currentQuestionAnimation,
    mapAnimation,
    emotionAnimation,
    shakeAnimation,
    inputSectionAnimation,
    themeAnimation,
    triggerShake,
    changeEmotion,
  };
};