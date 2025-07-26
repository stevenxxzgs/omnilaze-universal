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
  // State
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
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
  
  // 验证码相关状态
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerificationCodeSent, setIsVerificationCodeSent] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [countdown, setCountdown] = useState(0);

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
      // 先清空文本，避免闪现
      setDisplayedText('');
      inputSectionAnimation.setValue(0);
      currentQuestionAnimation.setValue(1);
      
      setTimeout(() => {
        typeText(getCurrentStepData().message, 80);
      }, 100);
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

  // Helper functions
  const getCurrentStepData = () => STEP_CONTENT[currentStep];

  const getCurrentAnswer = (): Answer | null => {
    // 编辑模式下使用编辑步骤，否则使用当前步骤
    const stepToUse = editingStep !== null ? editingStep : currentStep;
    switch (stepToUse) {
      case 0: return { type: 'phone', value: phoneNumber };
      case 1: return { type: 'address', value: address };
      case 2: {
        // 将选中的过敏原ID转换为中文标签
        const allergyLabels = selectedAllergies.map(id => {
          const option = ALLERGY_OPTIONS.find(opt => opt.id === id);
          return option ? option.label : id;
        });
        return { type: 'allergy', value: allergyLabels.length > 0 ? allergyLabels.join(', ') : '无忌口' };
      }
      case 3: {
        // 将选中的偏好ID转换为中文标签
        const preferenceLabels = selectedPreferences.map(id => {
          const option = PREFERENCE_OPTIONS.find(opt => opt.id === id);
          return option ? option.label : id;
        });
        return { type: 'preference', value: preferenceLabels.length > 0 ? preferenceLabels.join(', ') : '无特殊偏好' };
      }
      case 4: return { type: 'budget', value: budget };
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
    // 编辑模式下的验证逻辑
    if (editingStep !== null) {
      const stepData = STEP_CONTENT[editingStep];
      switch (stepData.inputType) {
        case 'phone':
          return validatePhoneNumber(phoneNumber) && phoneNumber.length === 11 && isPhoneVerified;
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
      case 'phone':
        return validatePhoneNumber(phoneNumber) && phoneNumber.length === 11 && isPhoneVerified;
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
  const handleSendVerificationCode = () => {
    if (!validatePhoneNumber(phoneNumber) || phoneNumber.length !== 11) {
      triggerShake();
      return;
    }
    
    // 模拟发送验证码
    setIsVerificationCodeSent(true);
    setCountdown(180); // 3分钟倒计时
    changeEmotion('📱');
    
    // 这里可以添加实际的API调用
    console.log('发送验证码到:', phoneNumber);
  };

  const handleVerifyCode = () => {
    if (verificationCode.length !== 6) {
      setInputError('请输入6位验证码');
      triggerShake();
      return;
    }
    
    // 模拟验证码验证（在实际项目中这里应该调用API）
    if (verificationCode === '123456') {
      setIsPhoneVerified(true);
      setInputError('');
      changeEmotion('✅');
    } else {
      setInputError('验证码错误，请重新输入');
      triggerShake();
    }
  };

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
      setTimeout(() => {
        if (currentStep < STEP_CONTENT.length - 1) {
          setCurrentStep(currentStep + 1);
        } else {
          setCurrentStep(5);
          changeEmotion('🎉');
          
          setTimeout(() => {
            changeEmotion('🍕');
            typeText('🎊 完美！已为您找到3家符合要求的餐厅，正在跳转...', 40);
          }, TIMING.COMPLETION_DELAY);
        }
      }, TIMING.SCROLL_DELAY);
    });
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
      case 'phone':
        setPhoneNumber(answerToEdit.value);
        // 重置验证码状态
        setVerificationCode('');
        setIsVerificationCodeSent(false);
        setIsPhoneVerified(false);
        setCountdown(0);
        break;
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
      if (editingStep === 1) {
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
        case 'phone':
          setPhoneNumber(originalAnswerBeforeEdit.value);
          // 假设原来的手机号已经验证过，恢复验证状态
          setIsPhoneVerified(true);
          setIsVerificationCodeSent(true);
          setVerificationCode('');
          setCountdown(0);
          break;
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
              if (!isAddressConfirmed || editingStep === 1) {
                setAddress(text);
              }
            }}
            placeholder="请输入地址"
            iconName="location-on"
            editable={!isAddressConfirmed || editingStep === 1}
            isDisabled={isAddressConfirmed && editingStep !== 1}
            showClearButton={!isAddressConfirmed || editingStep === 1}
            showEditButton={isAddressConfirmed && editingStep !== 1}
            onClear={() => setAddress('')}
            onEdit={handleEditAddress}
            onSubmitEditing={editingStep === 1 ? handleFinishEditing : handleAddressConfirm}
            animationValue={inputSectionAnimation}
          />
          
          {/* Map Container - 编辑地址时显示 */}
          {showMap && editingStep === 1 && (
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
    
    if (stepData.showPhoneInput) {
      return (
        <View>
          <BaseInput
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="请输入11位手机号"
            iconName="phone"
            keyboardType="numeric"
            maxLength={11}
            isError={!validatePhoneNumber(phoneNumber) && phoneNumber.length > 0}
            onClear={() => setPhoneNumber('')}
            onSubmitEditing={editingStep === 0 ? handleFinishEditing : undefined}
            animationValue={inputSectionAnimation}
          />
          
          {/* 验证码输入框 - 只有发送验证码后才显示 */}
          {isVerificationCodeSent && !isPhoneVerified && (
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
                animationValue={inputSectionAnimation}
              />
            </View>
          )}
        </View>
      );
    }
    
    if (stepData.showBudgetInput) {
      return (
        <BudgetInput
          value={budget}
          onChangeText={setBudget}
          animationValue={inputSectionAnimation}
          onSubmitEditing={editingStep === 4 ? handleFinishEditing : undefined}
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
    
    // 手机号步骤的按钮逻辑
    if (currentStep === 0) {
      if (!isVerificationCodeSent) {
        // 发送验证码按钮
        return (
          <ActionButton
            onPress={handleSendVerificationCode}
            title="发送验证码"
            disabled={!validatePhoneNumber(phoneNumber) || phoneNumber.length !== 11}
            isActive={validatePhoneNumber(phoneNumber) && phoneNumber.length === 11}
            animationValue={inputSectionAnimation}
          />
        );
      } else if (!isPhoneVerified) {
        // 验证码相关按钮
        return (
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <ActionButton
              onPress={handleVerifyCode}
              title="确认"
              disabled={verificationCode.length !== 6}
              isActive={verificationCode.length === 6}
              animationValue={inputSectionAnimation}
            />
            <ActionButton
              onPress={handleSendVerificationCode}
              title={countdown > 0 ? `重新发送(${countdown}s)` : "重新发送"}
              disabled={countdown > 0}
              isActive={countdown === 0}
              animationValue={inputSectionAnimation}
            />
          </View>
        );
      }
    }
    
    // 正常流程的按钮
    if (currentStep === 1 && !isAddressConfirmed) {
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
                  
                  return (
                    <CompletedQuestion
                      key={index}
                      question={STEP_CONTENT[index].message}
                      answer={answer}
                      index={index}
                      questionAnimation={questionAnimations[index]}
                      answerAnimation={answerAnimations[index]}
                      onEdit={() => handleEditAnswer(index)}
                      formatAnswerDisplay={formatAnswerDisplay}
                      isEditing={isCurrentlyEditing}
                      editingInput={isCurrentlyEditing ? renderCurrentInput() : undefined}
                      editingButtons={isCurrentlyEditing ? renderActionButton() : undefined}
                    />
                  );
                })}

              {/* Current Question - 只在正常流程下显示，编辑模式下不显示 */}
              {editingStep === null && currentStep < STEP_CONTENT.length && !completedAnswers[currentStep] && (
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
                  {/* Map Container */}
                  {showMap && (currentStep === 1 || editingStep === 1) && editingStep === null && (
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