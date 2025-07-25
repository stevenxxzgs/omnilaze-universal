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

// Hooks
import { 
  useTypewriterEffect, 
  useValidation, 
  useScrollCalculation, 
  useAnimations 
} from './src/hooks';

// Data & Types
import { STEP_CONTENT } from './src/data/stepContent';
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
  const [showMap, setShowMap] = useState(false);
  const [isAddressConfirmed, setIsAddressConfirmed] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedAnswers, setCompletedAnswers] = useState<CompletedAnswers>({});
  const [editingStep, setEditingStep] = useState<number | null>(null);
  const [originalAnswerBeforeEdit, setOriginalAnswerBeforeEdit] = useState<Answer | null>(null);

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

  // Helper functions
  const getCurrentStepData = () => STEP_CONTENT[currentStep];

  const getCurrentAnswer = (): Answer | null => {
    // 编辑模式下使用编辑步骤，否则使用当前步骤
    const stepToUse = editingStep !== null ? editingStep : currentStep;
    switch (stepToUse) {
      case 0: return { type: 'address', value: address };
      case 1: return { type: 'phone', value: phoneNumber };
      case 2: return { type: 'budget', value: budget };
      case 3: return { type: 'allergy', value: allergies };
      case 4: return { type: 'preference', value: preferences };
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
        case 'address':
          return !!address.trim() && address.trim().length >= 5;
        case 'phone':
          return validatePhoneNumber(phoneNumber) && phoneNumber.length === 11;
        case 'budget':
          return !!budget.trim() && parseFloat(budget) >= 10;
        case 'allergy':
        case 'preference':
          return true;
        default:
          return true;
      }
    }
    
    // 正常流程的验证逻辑
    const stepData = getCurrentStepData();
    switch (stepData.inputType) {
      case 'address':
        return isAddressConfirmed && !!address.trim();
      case 'phone':
        return validatePhoneNumber(phoneNumber) && phoneNumber.length === 11;
      case 'budget':
        return !!budget.trim() && parseFloat(budget) >= 10;
      case 'allergy':
      case 'preference':
        return true;
      default:
        return true;
    }
  };

  // Event handlers
  const handleAddressConfirm = () => {
    if (!validateInput(0, address).isValid) {
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
      case 'address':
        setAddress(answerToEdit.value);
        setIsAddressConfirmed(false);
        setShowMap(false);
        mapAnimation.setValue(0);
        break;
      case 'phone':
        setPhoneNumber(answerToEdit.value);
        break;
      case 'budget':
        setBudget(answerToEdit.value);
        break;
      case 'allergy':
        setAllergies(answerToEdit.value);
        break;
      case 'preference':
        setPreferences(answerToEdit.value);
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
        case 'address':
          setAddress(originalAnswerBeforeEdit.value);
          setIsAddressConfirmed(true);
          setShowMap(true);
          mapAnimation.setValue(1);
          break;
        case 'phone':
          setPhoneNumber(originalAnswerBeforeEdit.value);
          break;
        case 'budget':
          setBudget(originalAnswerBeforeEdit.value);
          break;
        case 'allergy':
          setAllergies(originalAnswerBeforeEdit.value);
          break;
        case 'preference':
          setPreferences(originalAnswerBeforeEdit.value);
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
    
    if (stepData.showPhoneInput) {
      return (
        <BaseInput
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          placeholder="请输入11位手机号"
          iconName="phone"
          keyboardType="numeric"
          maxLength={11}
          isError={!validatePhoneNumber(phoneNumber) && phoneNumber.length > 0}
          onClear={() => setPhoneNumber('')}
          onSubmitEditing={editingStep === 1 ? handleFinishEditing : undefined}
          animationValue={inputSectionAnimation}
        />
      );
    }
    
    if (stepData.showBudgetInput) {
      return (
        <BudgetInput
          value={budget}
          onChangeText={setBudget}
          animationValue={inputSectionAnimation}
        />
      );
    }
    
    if (stepData.showAllergyInput) {
      return (
        <BaseInput
          value={allergies}
          onChangeText={setAllergies}
          placeholder="忌口食物，如：海鲜、花生等（可选）"
          iconName="warning"
          multiline
          onClear={() => setAllergies('')}
          animationValue={inputSectionAnimation}
        />
      );
    }
    
    if (stepData.showPreferenceInput) {
      return (
        <BaseInput
          value={preferences}
          onChangeText={setPreferences}
          placeholder="口味偏好，如：不要太辣、多放香菜等（可选）"
          iconName="favorite"
          multiline
          onClear={() => setPreferences('')}
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
    
    // 正常流程的按钮
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