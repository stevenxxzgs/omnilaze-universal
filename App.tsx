"use client"

import React, { useState, useEffect, useRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
  View,
  Animated,
} from 'react-native';

// 导入全局CSS样式来移除焦点边框
import './src/styles/global.css';

// Components
import { ProgressSteps } from './src/components/ProgressSteps';
import { CompletedQuestion } from './src/components/CompletedQuestion';
import { CurrentQuestion } from './src/components/CurrentQuestion';
import { BaseInput } from './src/components/BaseInput';
import { BudgetInput } from './src/components/BudgetInput';
import { MapComponent } from './src/components/MapComponent';
import { ActionButton } from './src/components/ActionButton';
import { ImageCheckbox } from './src/components/ImageCheckbox';
import { AuthComponent, AuthResult } from './src/components/AuthComponent';

// Services - 移除鉴权相关API导入，因为AuthComponent已经包含
// import { sendVerificationCode, verifyCodeAndLogin } from './src/services/api';
import { createOrder, submitOrder } from './src/services/api';

// Hooks
import { 
  useTypewriterEffect, 
  useValidation, 
  useScrollCalculation, 
  useAnimations 
} from './src/hooks';

// Data & Types
import { STEP_CONTENT } from './src/data/stepContent';
import { ALLERGY_OPTIONS, PREFERENCE_OPTIONS } from './src/data/checkboxOptions';
import type { CompletedAnswers, InputFocus, Answer } from './src/types';

// Styles
import { globalStyles, rightContentStyles } from './src/styles/globalStyles';
import { TIMING } from './src/constants';

export default function LemonadeApp() {
  // State - 移除鉴权相关状态，由AuthComponent管理
  const [address, setAddress] = useState('');
  // const [phoneNumber, setPhoneNumber] = useState(''); // 移除，由AuthComponent管理
  const [budget, setBudget] = useState('');
  const [allergies, setAllergies] = useState('');
  const [preferences, setPreferences] = useState('');
  // 新增复选框状态
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [isAddressConfirmed, setIsAddressConfirmed] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedAnswers, setCompletedAnswers] = useState<CompletedAnswers>({});
  const [editingStep, setEditingStep] = useState<number | null>(null);
  const [originalAnswerBeforeEdit, setOriginalAnswerBeforeEdit] = useState<Answer | null>(null);
  
  // 鉴权相关状态 - 由AuthComponent管理
  // const [verificationCode, setVerificationCode] = useState('');
  // const [isVerificationCodeSent, setIsVerificationCodeSent] = useState(false);
  // const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  // const [countdown, setCountdown] = useState(0);
  
  // 新增鉴权状态
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authResult, setAuthResult] = useState<AuthResult | null>(null);
  const [authQuestionText, setAuthQuestionText] = useState('请输入手机号获取验证码'); // 鉴权阶段的问题文本
  
  // 订单相关状态
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [isOrderSubmitting, setIsOrderSubmitting] = useState(false);

  // Custom hooks
  const { displayedText, isTyping, showCursor, typeText, setDisplayedText } = useTypewriterEffect();
  const { inputError, validateInput, validatePhoneNumber, setInputError } = useValidation();
  const scrollViewRef = useRef<any>(null);
  const [contentHeight, setContentHeight] = useState(800);
  const { 
    questionAnimations,
    answerAnimations, 
    currentQuestionAnimation,
    mapAnimation,
    emotionAnimation,
    shakeAnimation,
    inputSectionAnimation,
    triggerShake,
    changeEmotion 
  } = useAnimations();

  // Effects
  useEffect(() => {
    // 只在非编辑模式下触发打字机效果
    if (editingStep === null && currentStep < STEP_CONTENT.length && !completedAnswers[currentStep]) {
      inputSectionAnimation.setValue(0);
      currentQuestionAnimation.setValue(1);
      
      // 立即设置新问题的第一个字符，避免显示旧问题文本造成的闪烁
      const newMessage = getCurrentStepData().message;
      setDisplayedText(newMessage.substring(0, 1));
      
      // 然后开始打字机效果（从第二个字符开始）
      setTimeout(() => {
        typeText(newMessage, 80);
      }, 10); // 很短的延迟确保第一个字符已经设置
    }
  }, [currentStep, completedAnswers, editingStep]);

  // Handle editing mode - skip typewriter effect and set up immediately
  useEffect(() => {
    if (editingStep !== null) {
      const stepData = STEP_CONTENT[editingStep];
      setDisplayedText(stepData.message);
      inputSectionAnimation.setValue(1);
      currentQuestionAnimation.setValue(1);
    }
  }, [editingStep]);

  // Only trigger input animation in normal mode, not during editing
  useEffect(() => {
    if (editingStep === null && displayedText && !isTyping) {
      setTimeout(() => {
        Animated.spring(inputSectionAnimation, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }).start();
      }, TIMING.ANIMATION_DELAY);
    }
  }, [displayedText, isTyping, editingStep]);

  // 倒计时相关逻辑已移动到AuthComponent

  // 鉴权成功回调
  const handleAuthSuccess = (result: AuthResult) => {
    setIsAuthenticated(true);
    setAuthResult(result);
    
    // 保存用户信息到本地存储
    if (result.userId) {
      localStorage.setItem('user_id', result.userId);
      localStorage.setItem('phone_number', result.phoneNumber);
    }
    
    console.log('鉴权成功:', result);
    
    // 鉴权成功后，添加手机号作为第一个完成的答案
    const phoneAnswer = { type: 'phone', value: result.phoneNumber };
    setCompletedAnswers({ [-1]: phoneAnswer }); // 使用-1作为手机号步骤的索引
    
    // 开始订单收集流程
    setTimeout(() => {
      setCurrentStep(0); // 设置为第一个订单收集步骤（地址）
      // useEffect会自动触发打字机效果，不需要手动调用
    }, 500);
  };
  
  // 鉴权问题文本变化回调
  const handleAuthQuestionChange = (question: string) => {
    setAuthQuestionText(question);
    // 触发打字机效果重新显示新问题
    typeText(question, 80);
  };
  
  // 鉴权错误回调
  const handleAuthError = (error: string) => {
    setInputError(error);
  };

  // Helper functions
  const getCurrentStepData = () => {
    if (!isAuthenticated) {
      // 未鉴权时显示动态的鉴权问题文本
      return {
        message: authQuestionText,
        showPhoneInput: true,
        inputType: 'phone'
      };
    }
    // 鉴权后开始正常流程
    return STEP_CONTENT[currentStep];
  };

  const getCurrentAnswer = (): Answer | null => {
    // 编辑模式下使用编辑步骤，否则使用当前步骤
    const stepToUse = editingStep !== null ? editingStep : currentStep;
    switch (stepToUse) {
      // case 0: return { type: 'phone', value: phoneNumber }; // 移除手机号步骤，由AuthComponent管理
      case 0: return { type: 'address', value: address }; // 地址成为第一步
      case 1: {
        // 将选中的过敏原ID转换为中文标签
        const allergyLabels = selectedAllergies.map(id => {
          const option = ALLERGY_OPTIONS.find(opt => opt.id === id);
          return option ? option.label : id;
        });
        return { type: 'allergy', value: allergyLabels.length > 0 ? allergyLabels.join(', ') : '无忌口' };
      }
      case 2: {
        // 将选中的偏好ID转换为中文标签
        const preferenceLabels = selectedPreferences.map(id => {
          const option = PREFERENCE_OPTIONS.find(opt => opt.id === id);
          return option ? option.label : id;
        });
        return { type: 'preference', value: preferenceLabels.length > 0 ? preferenceLabels.join(', ') : '无特殊偏好' };
      }
      case 3: return { type: 'budget', value: budget };
      default: return null;
    }
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

  const canProceed = () => {
    // 未鉴权时不能继续
    if (!isAuthenticated) {
      return false;
    }
    
    // 编辑模式下的验证逻辑
    if (editingStep !== null) {
      const stepData = STEP_CONTENT[editingStep];
      switch (stepData.inputType) {
        // case 'phone': // 移除手机号验证，由AuthComponent管理
        case 'address':
          return !!address.trim() && address.trim().length >= 5;
        case 'allergy':
        case 'preference':
          return true;
        case 'budget':
          return !!budget.trim() && parseFloat(budget) >= 10;
        default:
          return true;
      }
    }
    
    // 正常流程的验证逻辑
    const stepData = getCurrentStepData();
    switch (stepData.inputType) {
      // case 'phone': // 移除手机号验证，由AuthComponent管理
      case 'address':
        return isAddressConfirmed && !!address.trim();
      case 'allergy':
      case 'preference':
        return true;
      case 'budget':
        return !!budget.trim() && parseFloat(budget) >= 10;
      default:
        return true;
    }
  };

  // Event handlers
  // handleSendVerificationCode 和 handleVerifyCode 已移动到 AuthComponent

  const handleAddressConfirm = () => {
    if (!validateInput(1, address).isValid) {
      triggerShake();
      return;
    }
    
    setIsAddressConfirmed(true);
    changeEmotion('✅');
    
    Animated.timing(mapAnimation, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();
    
    setTimeout(() => {
      setShowMap(true);
    }, 500);
  };

  const handleNext = () => {
    const currentAnswer = getCurrentAnswer();
    const inputValue = currentAnswer?.value;
    
    if (!validateInput(currentStep, inputValue).isValid) {
      triggerShake();
      return;
    }
    
    changeEmotion('🎉');
    
    setCompletedAnswers(prev => ({
      ...prev,
      [currentStep]: currentAnswer!
    }));
    
    Animated.spring(answerAnimations[currentStep], {
      toValue: 1,
      tension: 60,
      friction: 8,
      useNativeDriver: true,
    }).start(() => {
      // 减少延迟以避免闪烁
      setTimeout(() => {
        if (currentStep < STEP_CONTENT.length - 1) {
          setCurrentStep(currentStep + 1);
        } else {
          // 最后一步完成，创建订单
          handleCreateOrder();
        }
      }, 200); // 减少延迟从400ms到200ms
    });
  };

  // 创建订单
  const handleCreateOrder = async () => {
    if (!authResult?.userId || !authResult?.phoneNumber) {
      setInputError('用户信息缺失，请重新登录');
      return;
    }

    const orderData = {
      address: address,
      allergies: selectedAllergies,
      preferences: selectedPreferences,
      budget: budget
    };

    try {
      setIsOrderSubmitting(true);
      changeEmotion('📝');
      
      const result = await createOrder(authResult.userId, authResult.phoneNumber, orderData);
      
      if (result.success) {
        setCurrentOrderId(result.order_id || null);
        console.log('订单创建成功:', result.order_number);
        
        // 立即提交订单
        handleSubmitOrder(result.order_id!);
      } else {
        setInputError(result.message);
        triggerShake();
        changeEmotion('😰');
      }
    } catch (error) {
      setInputError('创建订单失败，请重试');
      triggerShake();
      changeEmotion('😰');
      console.error('创建订单错误:', error);
    } finally {
      setIsOrderSubmitting(false);
    }
  };

  // 提交订单
  const handleSubmitOrder = async (orderId: string) => {
    try {
      changeEmotion('🚀');
      
      const result = await submitOrder(orderId);
      
      if (result.success) {
        console.log('订单提交成功:', result.order_number);
        
        // 显示完成界面
        setCurrentStep(5);
        changeEmotion('🎉');
        
        setTimeout(() => {
          changeEmotion('🍕');
          typeText('🎊 完美！订单已提交，正在为您匹配餐厅...', 40);
        }, TIMING.COMPLETION_DELAY);
      } else {
        setInputError(result.message);
        triggerShake();
        changeEmotion('😰');
      }
    } catch (error) {
      setInputError('提交订单失败，请重试');
      triggerShake();
      changeEmotion('😰');
      console.error('提交订单错误:', error);
    }
  };

  const handleEditAddress = () => {
    setIsAddressConfirmed(false);
    setShowMap(false);
    setAddress('');
    mapAnimation.setValue(0);
  };

  const handleEditAnswer = (stepIndex: number) => {
    // 获取当前要编辑的答案
    const answerToEdit = completedAnswers[stepIndex];
    if (!answerToEdit) return;
    
    // 保存原始答案以便取消时恢复
    setOriginalAnswerBeforeEdit(answerToEdit);
    
    // 恢复编辑步骤的输入值
    switch (answerToEdit.type) {
      // case 'phone': // 手机号不能编辑，由AuthComponent管理
      case 'address':
        setAddress(answerToEdit.value);
        setIsAddressConfirmed(false);
        setShowMap(false);
        mapAnimation.setValue(0);
        break;
      case 'allergy':
        setAllergies(answerToEdit.value);
        // 从中文标签转换回ID
        if (answerToEdit.value !== '无忌口') {
          const labels = answerToEdit.value.split(', ');
          const ids = labels.map(label => {
            const option = ALLERGY_OPTIONS.find(opt => opt.label === label);
            return option ? option.id : label;
          });
          setSelectedAllergies(ids);
        } else {
          setSelectedAllergies([]);
        }
        break;
      case 'preference':
        setPreferences(answerToEdit.value);
        // 从中文标签转换回ID
        if (answerToEdit.value !== '无特殊偏好') {
          const labels = answerToEdit.value.split(', ');
          const ids = labels.map(label => {
            const option = PREFERENCE_OPTIONS.find(opt => opt.label === label);
            return option ? option.id : label;
          });
          setSelectedPreferences(ids);
        } else {
          setSelectedPreferences([]);
        }
        break;
      case 'budget':
        setBudget(answerToEdit.value);
        break;
    }
    
    // 设置编辑模式（最后设置以避免useEffect冲突）
    setEditingStep(stepIndex);
  };

  const handleFinishEditing = () => {
    const currentAnswer = getCurrentAnswer();
    if (currentAnswer && editingStep !== null) {
      // 验证输入
      if (!validateInput(editingStep, currentAnswer.value).isValid) {
        triggerShake();
        return;
      }
      
      // 保存编辑后的答案
      setCompletedAnswers(prev => ({
        ...prev,
        [editingStep]: currentAnswer
      }));
      
      // 特殊处理地址步骤
      if (editingStep === 0) {
        setIsAddressConfirmed(true);
        Animated.timing(mapAnimation, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }).start();
        setTimeout(() => setShowMap(true), 500);
      }
      
      // 退出编辑模式
      setEditingStep(null);
      setOriginalAnswerBeforeEdit(null);
    }
  };

  const handleCancelEditing = () => {
    if (editingStep !== null && originalAnswerBeforeEdit) {
      // 恢复原始答案的输入值
      switch (originalAnswerBeforeEdit.type) {
        // case 'phone': // 手机号不能编辑，由AuthComponent管理
        case 'address':
          setAddress(originalAnswerBeforeEdit.value);
          setIsAddressConfirmed(true);
          setShowMap(true);
          mapAnimation.setValue(1);
          break;
        case 'allergy':
          setAllergies(originalAnswerBeforeEdit.value);
          // 从中文标签转换回ID
          if (originalAnswerBeforeEdit.value !== '无忌口') {
            const labels = originalAnswerBeforeEdit.value.split(', ');
            const ids = labels.map(label => {
              const option = ALLERGY_OPTIONS.find(opt => opt.label === label);
              return option ? option.id : label;
            });
            setSelectedAllergies(ids);
          } else {
            setSelectedAllergies([]);
          }
          break;
        case 'preference':
          setPreferences(originalAnswerBeforeEdit.value);
          // 从中文标签转换回ID
          if (originalAnswerBeforeEdit.value !== '无特殊偏好') {
            const labels = originalAnswerBeforeEdit.value.split(', ');
            const ids = labels.map(label => {
              const option = PREFERENCE_OPTIONS.find(opt => opt.label === label);
              return option ? option.id : label;
            });
            setSelectedPreferences(ids);
          } else {
            setSelectedPreferences([]);
          }
          break;
        case 'budget':
          setBudget(originalAnswerBeforeEdit.value);
          break;
      }
      
      // 退出编辑模式
      setEditingStep(null);
      setOriginalAnswerBeforeEdit(null);
    }
  };

  // Render current step input
  const renderCurrentInput = () => {
    // 编辑模式下使用编辑步骤的数据，否则使用当前步骤
    const stepData = editingStep !== null ? STEP_CONTENT[editingStep] : getCurrentStepData();
    
    if (stepData.showAddressInput) {
      return (
        <View>
          <BaseInput
            value={address}
            onChangeText={(text) => {
              if (!isAddressConfirmed || editingStep === 0) {
                setAddress(text);
              }
            }}
            placeholder="请输入地址"
            iconName="location-on"
            editable={!isAddressConfirmed || editingStep === 0}
            isDisabled={isAddressConfirmed && editingStep !== 0}
            showClearButton={!isAddressConfirmed || editingStep === 0}
            showEditButton={isAddressConfirmed && editingStep !== 0}
            onClear={() => setAddress('')}
            onEdit={handleEditAddress}
            onSubmitEditing={editingStep === 0 ? handleFinishEditing : handleAddressConfirm}
            animationValue={inputSectionAnimation}
            errorMessage={inputError}
          />
          
          {/* Map Container - 编辑地址时显示 */}
          {showMap && editingStep === 0 && (
            <Animated.View 
              style={[
                {
                  opacity: mapAnimation,
                  transform: [{
                    translateY: mapAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [16, 0],
                    }),
                  }],
                },
              ]}
            >
              <View style={{ backgroundColor: '#ffffff', borderRadius: 8, overflow: 'hidden', marginTop: 16 }}>
                <MapComponent showMap={showMap} mapAnimation={mapAnimation} />
              </View>
            </Animated.View>
          )}
        </View>
      );
    }
    
    // 手机号输入已移动到AuthComponent
    
    if (stepData.showBudgetInput) {
      return (
        <BudgetInput
          value={budget}
          onChangeText={setBudget}
          animationValue={inputSectionAnimation}
          onSubmitEditing={editingStep === 3 ? handleFinishEditing : undefined}
          errorMessage={inputError}
        />
      );
    }
    
    if (stepData.showAllergyInput) {
      return (
        <ImageCheckbox
          options={ALLERGY_OPTIONS}
          selectedIds={selectedAllergies}
          onSelectionChange={setSelectedAllergies}
          animationValue={inputSectionAnimation}
        />
      );
    }
    
    if (stepData.showPreferenceInput) {
      return (
        <ImageCheckbox
          options={PREFERENCE_OPTIONS}
          selectedIds={selectedPreferences}
          onSelectionChange={setSelectedPreferences}
          animationValue={inputSectionAnimation}
          singleSelect={true}
        />
      );
    }
    
    return null;
  };

  const renderActionButton = () => {
    // 编辑模式下的按钮
    if (editingStep !== null) {
      return (
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <ActionButton
            onPress={handleFinishEditing}
            title="保存"
            disabled={!canProceed()}
            isActive={canProceed()}
            animationValue={inputSectionAnimation}
          />
          <ActionButton
            onPress={handleCancelEditing}
            title="取消"
            disabled={false}
            isActive={false}
            animationValue={inputSectionAnimation}
          />
        </View>
      );
    }
    
    // 手机号步骤的按钮逻辑已移动到AuthComponent
    
    // 正常流程的按钮 - 地址确认现在是第一步（步骤0）
    if (currentStep === 0 && !isAddressConfirmed) {
      return (
        <ActionButton
          onPress={handleAddressConfirm}
          title="确认地址"
          disabled={!address.trim()}
          isActive={!!address.trim()}
          animationValue={inputSectionAnimation}
        />
      );
    }
    
    if (canProceed()) {
      return (
        <ActionButton
          onPress={handleNext}
          title={currentStep === STEP_CONTENT.length - 1 ? '确认订单' : '确认'}
          variant="next"
          animationValue={inputSectionAnimation}
        />
      );
    }
    
    return null;
  };

  return (
    <KeyboardAvoidingView 
      style={globalStyles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F2" />
      
      <ProgressSteps currentStep={currentStep} />

      <ScrollView 
        ref={scrollViewRef}
        style={globalStyles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          globalStyles.scrollContent
        ]}
      >
        <View style={globalStyles.mainContent}>
          <View style={globalStyles.contentContainer}>
            <View style={rightContentStyles.rightContent}>
              {/* Completed Questions */}
              {Object.keys(completedAnswers)
                .sort((a, b) => parseInt(a) - parseInt(b))
                .map((stepIndex) => {
                  const index = parseInt(stepIndex);
                  const answer = completedAnswers[index];
                  const isCurrentlyEditing = editingStep === index;
                  
                  // 为手机号问题（index: -1）提供特殊处理
                  const questionText = index === -1 ? 
                    '你的手机号码是多少？' : 
                    STEP_CONTENT[index]?.message || '';
                  
                  return (
                    <CompletedQuestion
                      key={index}
                      question={questionText}
                      answer={answer}
                      index={index}
                      questionAnimation={questionAnimations[Math.max(0, index)] || new Animated.Value(1)}
                      answerAnimation={answerAnimations[Math.max(0, index)] || new Animated.Value(1)}
                      onEdit={() => handleEditAnswer(index)}
                      formatAnswerDisplay={formatAnswerDisplay}
                      isEditing={isCurrentlyEditing}
                      editingInput={isCurrentlyEditing ? renderCurrentInput() : undefined}
                      editingButtons={isCurrentlyEditing ? renderActionButton() : undefined}
                      canEdit={index >= 0} // 手机号（index: -1）不可编辑
                    />
                  );
                })}

              {/* 鉴权组件 - 未鉴权时显示 */}
              {!isAuthenticated && (
                <CurrentQuestion
                  displayedText={displayedText}
                  isTyping={isTyping}
                  showCursor={showCursor}
                  inputError={inputError}
                  currentStep={0}
                  currentQuestionAnimation={currentQuestionAnimation}
                  emotionAnimation={emotionAnimation}
                  shakeAnimation={shakeAnimation}
                >
                  <AuthComponent
                    onAuthSuccess={handleAuthSuccess}
                    onError={handleAuthError}
                    onQuestionChange={handleAuthQuestionChange}
                    animationValue={inputSectionAnimation}
                    validatePhoneNumber={validatePhoneNumber}
                    triggerShake={triggerShake}
                    changeEmotion={changeEmotion}
                  />
                </CurrentQuestion>
              )}

              {/* Current Question - 只在正常流程下显示，编辑模式下不显示 */}
              {isAuthenticated && editingStep === null && currentStep < STEP_CONTENT.length && !completedAnswers[currentStep] && (
                <CurrentQuestion
                  displayedText={displayedText}
                  isTyping={isTyping}
                  showCursor={showCursor}
                  inputError={inputError}
                  currentStep={editingStep !== null ? editingStep : currentStep}
                  currentQuestionAnimation={currentQuestionAnimation}
                  emotionAnimation={emotionAnimation}
                  shakeAnimation={shakeAnimation}
                >
                  {/* Map Container - 地址确认时显示（现在是第0步） */}
                  {showMap && (currentStep === 0 || editingStep === 0) && editingStep === null && (
                    <Animated.View 
                      style={[
                        {
                          opacity: mapAnimation,
                          transform: [{
                            translateY: mapAnimation.interpolate({
                              inputRange: [0, 1],
                              outputRange: [16, 0],
                            }),
                          }],
                        },
                      ]}
                    >
                      <View style={{ backgroundColor: '#ffffff', borderRadius: 8, overflow: 'hidden', marginBottom: 24 }}>
                        <MapComponent showMap={showMap} mapAnimation={mapAnimation} />
                      </View>
                    </Animated.View>
                  )}

                  {/* Input Section */}
                  {renderCurrentInput()}

                  {/* Action Button */}
                  {renderActionButton()}
                </CurrentQuestion>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}