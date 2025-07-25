"use client"

import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Animated,
  StatusBar,
  Dimensions,
  KeyboardAvoidingView,
  Platform
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'

// Create a simple MapComponent that handles cross-platform rendering
const MapComponent = ({ showMap, mapAnimation }: { showMap: boolean; mapAnimation: any }) => {
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webMapContainer}>
        <View style={styles.webMapBackground}>
          {/* Street lines simulation */}
          <View style={styles.streetLines}>
            <View style={[styles.streetLine, { top: 80, left: 0, width: '100%', height: 1 }]} />
            <View style={[styles.streetLine, { top: 160, left: 0, width: '100%', height: 1 }]} />
            <View style={[styles.streetLine, { top: 240, left: 0, width: '100%', height: 1 }]} />
            <View style={[styles.streetLine, { left: 128, top: 0, width: 1, height: '100%' }]} />
            <View style={[styles.streetLine, { left: 256, top: 0, width: 1, height: '100%' }]} />
          </View>
          
          {/* Street labels */}
          <Text style={[styles.streetLabel, { top: 64, left: 16, transform: [{ rotate: '-12deg' }] }]}>
            Williamsburg Bridge
          </Text>
          <Text style={[styles.streetLabel, { top: 144, left: 32 }]}>S 4th St</Text>
          <Text style={[styles.streetLabel, { top: 224, left: 32 }]}>S 5th St</Text>
          <Text style={[styles.streetLabel, { top: 96, left: 160, transform: [{ rotate: '90deg' }] }]}>
            Kent Ave
          </Text>
          
          {/* Location Pin */}
          <View style={styles.webMapPin}>
            <View style={styles.webMapPinCircle}>
              <View style={styles.webMapPinInner} />
            </View>
            <View style={styles.webMapPinStem} />
          </View>
          
          {/* Map branding */}
          <View style={styles.webMapBranding}>
            <Text style={styles.webMapBrandingText}>Google</Text>
          </View>
          <Text style={styles.webMapCopyright}>Map data ©2025 Google</Text>
        </View>
      </View>
    )
  }
  
  // For native platforms, we'll use a placeholder for now
  return (
    <View style={styles.map}>
      <View style={styles.nativeMapPlaceholder}>
        <MaterialIcons name="location-on" size={48} color="#66CC99" />
        <Text style={styles.nativeMapText}>Map View (Native)</Text>
        <Text style={styles.nativeMapSubtext}>325 Kent Ave, Brooklyn, NY</Text>
      </View>
    </View>
  )
}

const { width, height } = Dimensions.get('window')

export default function LemonadeApp() {
  const [address, setAddress] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [budget, setBudget] = useState('')
  const [allergies, setAllergies] = useState('')
  const [preferences, setPreferences] = useState('')
  const [showMap, setShowMap] = useState(false)
  const [isAddressConfirmed, setIsAddressConfirmed] = useState(false)
  const [currentStep, setCurrentStep] = useState(0) // 0-4: 5 questions
  const [mapAnimation] = useState(new Animated.Value(0))
  const [completedAnswers, setCompletedAnswers] = useState<{[key: number]: any}>({})
  const [contentHeight, setContentHeight] = useState(800) // 页面内容高度
  const [inputFocus, setInputFocus] = useState({
    address: false,
    phone: false,
    budget: false,
    allergies: false,
    preferences: false
  }) // 跟踪输入框焦点状态
  const [lastAnswerHeight, setLastAnswerHeight] = useState(0) // 记录最新答案的高度
  
  // 浮动标签动画
  const [labelAnimations] = useState(() => ({
    address: new Animated.Value(0),
    phone: new Animated.Value(0),
    budget: new Animated.Value(0),
    allergies: new Animated.Value(0),
    preferences: new Animated.Value(0)
  }))
  const scrollViewRef = useRef<ScrollView>(null)
  
  // 动画状态
  const [questionAnimations] = useState(() => 
    Array.from({ length: 5 }, () => new Animated.Value(1)) // 问题始终显示，不做动画
  )
  const [answerAnimations] = useState(() => 
    Array.from({ length: 5 }, () => new Animated.Value(0))
  )
  const [currentQuestionAnimation] = useState(new Animated.Value(0))
  
  // 打字机效果状态
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showCursor, setShowCursor] = useState(true)
  
  // 表情状态
  const [currentEmotion, setCurrentEmotion] = useState('😊')
  const [emotionAnimation] = useState(new Animated.Value(1))
  
  // 错误状态
  const [inputError, setInputError] = useState('')
  const [shakeAnimation] = useState(new Animated.Value(0))
  
  // 光标闪烁效果
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev)
    }, 500)
    
    return () => clearInterval(cursorInterval)
  }, [])
  
  // 打字机效果函数
  const typeText = (text: string, speed: number = 50) => {
    setIsTyping(true)
    setDisplayedText('')
    
    let index = 0
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.substring(0, index + 1))
        index++
      } else {
        setIsTyping(false)
        clearInterval(timer)
      }
    }, speed)
    
    return timer
  }
  
  // 表情变化动画
  const changeEmotion = (newEmotion: string) => {
    Animated.sequence([
      Animated.timing(emotionAnimation, {
        toValue: 0.5,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(emotionAnimation, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentEmotion(newEmotion)
    })
  }
  
  // 错误震动动画
  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start()
  }
  
  // 计算精确的滚动位置（可以预测下一个问题）
  const calculateScrollPosition = (predictNextStep = false) => {
    // 基础高度设置 - 根据实际字体大小调整
    const questionLineHeight = 32 // 更新为实际行高
    const answerLineHeight = 36   // 更新为实际行高  
    const questionMargin = 53     // 更新为实际间距
    const answerMargin = 44
    const currentQuestionMargin = 80 // 当前问题的底部边距
    const inputSectionHeight = 100
    const buttonHeight = 50
    
    let totalHeight = 0
    
    // 计算所有已完成问题的高度
    Object.keys(completedAnswers).forEach((stepIndex) => {
      const index = parseInt(stepIndex)
      const answer = completedAnswers[index]
      
      // 问题文本高度（估算，基于字符数）
      const questionText = stepContent[index].message
      const questionLines = Math.ceil(questionText.length / 20) // 估算每行20字符
      const questionHeight = questionLines * questionLineHeight + 32 // +32 for avatar area
      
      // 答案文本高度
      const answerText = formatAnswerDisplay(answer)
      const answerLines = Math.ceil(answerText.length / 25) // 估算每行25字符  
      const answerHeight = answerLines * answerLineHeight + answerMargin
      
      totalHeight += questionHeight + answerHeight + questionMargin
    })
    
    // 当前问题的高度（如果预测下一步，则计算下一个问题）
    const targetStep = predictNextStep ? currentStep + 1 : currentStep
    if (targetStep < stepContent.length) {
      const targetQuestionText = stepContent[targetStep].message
      const targetQuestionLines = Math.ceil(targetQuestionText.length / 20)
      const targetQuestionHeight = targetQuestionLines * questionLineHeight + 32
      
      totalHeight += targetQuestionHeight + inputSectionHeight + buttonHeight + currentQuestionMargin
    }
    
    // 计算需要滚动的距离，让当前问题出现在屏幕底部往上1/4的位置
    const targetFromBottom = height * 0.25 // 距离底部25%的位置
    const scrollToPosition = Math.max(0, totalHeight - height + targetFromBottom)
    
    return scrollToPosition
  }
  
  // 精确滚动到计算位置
  const scrollToCalculatedPosition = (predictNext = false) => {
    const scrollPosition = calculateScrollPosition(predictNext)
    scrollViewRef.current?.scrollTo({
      y: scrollPosition,
      animated: true
    })
  }
  
  // 当前问题出现动画 + 打字机效果
  useEffect(() => {
    if (currentStep < stepContent.length && !completedAnswers[currentStep]) {
      // 重置显示状态
      setDisplayedText('')
      setIsTyping(false)
      
      // 直接设置透明度为1，移除出现动画
      currentQuestionAnimation.setValue(1)
      
      // 开始打字机效果
      setTimeout(() => {
        typeText(getCurrentStepData().message, 30)
      }, 100) // 减少延迟
    }
  }, [currentStep, completedAnswers])
  
  // 5个外卖问题
  const stepContent = [
    {
      message: "你想在哪里收到你的外卖？",
      showAddressInput: true,
      inputType: "address"
    },
    {
      message: "你的手机号码是多少？",
      showPhoneInput: true,
      inputType: "phone"
    },
    {
      message: "我可以花多少钱帮你点外卖？",
      showBudgetInput: true,
      inputType: "budget"
    },
    {
      message: "你有什么忌口？",
      showAllergyInput: true,
      inputType: "allergy"
    },
    {
      message: "你有什么口味偏好？",
      showPreferenceInput: true,
      inputType: "preference"
    },
    {
      message: "太棒了！正在为您推荐最合适的外卖...",
      showCompleted: true,
      inputType: "completed"
    }
  ]
  
  const stepTitles = [
    "配送地址",
    "联系方式", 
    "预算设置",
    "忌口说明",
    "口味偏好"
  ]

  // 改进的滚动逻辑：使用精确计算的滚动位置
  const handleScrollAfterAnswer = () => {
    // 使用精确的滚动位置计算，预测下一个问题的位置
    const scrollPosition = calculateScrollPosition(true)
    
    console.log('计算的滚动位置:', scrollPosition)
    
    // 扩展页面高度以确保有足够的滚动空间
    const requiredHeight = scrollPosition + height
    if (requiredHeight > contentHeight) {
      console.log('扩展页面高度:', contentHeight, '->', requiredHeight)
      setContentHeight(requiredHeight + 200) // 额外200px缓冲
    }
    
    // 滚动到计算的位置
    setTimeout(() => {
      console.log('滚动到位置:', scrollPosition)
      scrollViewRef.current?.scrollTo({
        y: scrollPosition,
        animated: true
      })
    }, 100)
  }

  // 处理输入框焦点和标签动画
  const handleInputFocus = (inputName: string, isFocused: boolean, hasValue: boolean) => {
    setInputFocus(prev => ({ ...prev, [inputName]: isFocused }))
    
    const shouldAnimateUp = isFocused || hasValue
    Animated.timing(labelAnimations[inputName], {
      toValue: shouldAnimateUp ? 1 : 0,
      duration: 200,
      useNativeDriver: false, // 因为要改变position，不能使用native driver
    }).start()
  }

  const handleAddressConfirm = () => {
    // 验证地址输入
    if (!validateInput(0, address)) {
      return // 验证失败，不继续
    }
    
    setIsAddressConfirmed(true)
    changeEmotion('✅')
    
    // 只显示地图动画，不自动进行下一步
    Animated.timing(mapAnimation, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start()
    
    setTimeout(() => {
      setShowMap(true)
    }, 500)
  }

  const validatePhoneNumber = (phone: string) => {
    const phoneRegex = /^1[3-9]\d{9}$/
    return phoneRegex.test(phone)
  }
  
  // 智能输入验证和错误提示
  const validateInput = (step: number, value: any) => {
    setInputError('')
    
    switch (step) {
      case 0: // 地址
        if (!value || value.trim().length < 5) {
          setInputError('请输入完整的配送地址')
          changeEmotion('😕')
          triggerShake()
          return false
        }
        changeEmotion('😊')
        return true
        
      case 1: // 手机号
        if (!validatePhoneNumber(value)) {
          setInputError('请输入正确的11位手机号码')
          changeEmotion('😅')
          triggerShake()
          return false
        }
        changeEmotion('😊')
        return true
        
      case 2: // 预算
        const budgetNum = parseFloat(value)
        if (!value || budgetNum <= 0) {
          setInputError('请设置一个合理的预算金额')
          changeEmotion('😅')
          triggerShake()
          return false
        }
        if (budgetNum < 10) {
          setInputError('预算至少需要10元哦')
          changeEmotion('😅')
          triggerShake()
          return false
        }
        changeEmotion('💰')
        return true
        
      case 3: // 忌口
        changeEmotion('😊')
        return true // 可选
        
      case 4: // 偏好
        changeEmotion('😋')
        return true // 可选
        
      default:
        return true
    }
  }

  const handleNext = () => {
    const currentAnswer = getCurrentAnswer()
    const inputValue = currentAnswer?.value
    
    // 验证输入
    if (!validateInput(currentStep, inputValue)) {
      return // 验证失败，不继续
    }
    
    // 成功反馈
    changeEmotion('🎉')
    
    // 1. 保存答案到状态
    setCompletedAnswers(prev => ({
      ...prev,
      [currentStep]: currentAnswer
    }))
    
    // 2. 播放答案出现动画
    Animated.spring(answerAnimations[currentStep], {
      toValue: 1,
      tension: 60,
      friction: 8,
      useNativeDriver: true,
    }).start(() => {
      // 3. 执行滚动：扩展页面并滚动
      handleScrollAfterAnswer()
      
      // 4. 等待滚动后，进入下一步
      setTimeout(() => {
        if (currentStep < stepContent.length - 1) {
          setCurrentStep(currentStep + 1)
        } else {
          // 所有问题完成，进入最终确认状态
          setCurrentStep(5)
          changeEmotion('🎉')
          
          // 延迟显示完成消息，不进行滚动
          // 3秒后显示最终结果
          setTimeout(() => {
            changeEmotion('🍕')
            typeText('🎊 完美！已为您找到3家符合要求的餐厅，正在跳转...', 40)
          }, 3000)
        }
      }, 400) // 让滚动先开始
    })
  }

  const getCurrentAnswer = () => {
    switch (currentStep) {
      case 0: return { type: 'address', value: address }
      case 1: return { type: 'phone', value: phoneNumber }
      case 2: return { type: 'budget', value: budget }
      case 3: return { type: 'allergy', value: allergies }
      case 4: return { type: 'preference', value: preferences }
      default: return null
    }
  }

  const formatAnswerDisplay = (answer: any) => {
    if (!answer) return ''
    switch (answer.type) {
      case 'address': return answer.value
      case 'phone': return answer.value
      case 'budget': return `¥${answer.value}`
      case 'allergy': return answer.value || '无忌口'
      case 'preference': return answer.value || '无特殊偏好'
      default: return answer.value
    }
  }

  const handleEditAddress = () => {
    setIsAddressConfirmed(false)
    setShowMap(false)
    setAddress('')
    mapAnimation.setValue(0)
  }

  const getCurrentStepData = () => stepContent[currentStep]

  const canProceed = () => {
    const stepData = getCurrentStepData()
    const currentAnswer = getCurrentAnswer()
    const inputValue = currentAnswer?.value
    
    switch (stepData.inputType) {
      case 'address':
        return isAddressConfirmed && address.trim()
      case 'phone':
        return validatePhoneNumber(phoneNumber) && phoneNumber.length === 11
      case 'budget':
        return budget.trim() && parseFloat(budget) >= 10
      case 'allergy':
        return true // 忌口可选
      case 'preference':
        return true // 口味偏好可选
      default:
        return true
    }
  }
  
  // 主题动画系统
  const [themeAnimation] = useState(new Animated.Value(0))
  
  useEffect(() => {
    // 根据步骤切换主题色调
    const themeColors = [
      { r: 236, g: 72, b: 153 },  // 地址 - 粉色
      { r: 59, g: 130, b: 246 },  // 手机 - 蓝色  
      { r: 34, g: 197, b: 94 },   // 预算 - 绿色
      { r: 245, g: 101, b: 101 }, // 忌口 - 红色
      { r: 251, g: 146, b: 60 },  // 偏好 - 橙色
    ]
    
    Animated.timing(themeAnimation, {
      toValue: currentStep,
      duration: 800,
      useNativeDriver: false, // 颜色动画不能使用原生驱动
    }).start()
  }, [currentStep])
  
  const getThemeColor = () => {
    return themeAnimation.interpolate({
      inputRange: [0, 1, 2, 3, 4],
      outputRange: [
        'rgb(236, 72, 153)',
        'rgb(59, 130, 246)', 
        'rgb(34, 197, 94)',
        'rgb(245, 101, 101)',
        'rgb(251, 146, 60)',
      ]
    })
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F2" />
      
      {/* Progress Steps - Fixed Position */}
      <View style={styles.progressContainer}>
        <View style={styles.progressSteps}>
          {stepTitles.map((title, index) => (
            <View key={index} style={styles.stepItem}>
              <View style={currentStep >= index ? styles.activeStep : styles.inactiveStep}>
                {currentStep >= index && <View style={styles.activeStepInner} />}
              </View>
              <Text style={currentStep >= index ? styles.activeStepText : styles.inactiveStepText}>
                {title}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { 
            minHeight: contentHeight // 使用动态的内容高度
          }
        ]}
      >
        <View style={styles.mainContent}>
          <View style={styles.contentContainer}>
            {/* Main Content - Right Side */}
            <View style={styles.rightContent}>
              {/* 按顺序渲染所有问题（已完成的问题在上，当前问题在下） */}
              
              {/* 渲染所有已完成的问题和答案 */}
              {Object.keys(completedAnswers)
                .sort((a, b) => parseInt(a) - parseInt(b))
                .map((stepIndex) => {
                  const index = parseInt(stepIndex)
                  const answer = completedAnswers[index]
                  return (
                    <Animated.View 
                      key={index} 
                      style={[
                        styles.completedQuestionContainer,
                        {
                          opacity: questionAnimations[index],
                          transform: [{
                            translateY: questionAnimations[index].interpolate({
                              inputRange: [0, 1],
                              outputRange: [20, 0],
                            }),
                          }],
                        },
                      ]}
                    >
                      {/* 已完成的问题 */}
                      <View style={styles.completedQuestionRow}>
                        <View style={styles.questionHeader}>
                          <View style={styles.avatarSimple}>
                            <Text style={styles.avatarInitial}>AI</Text>
                          </View>
                          <Text style={styles.questionText}>
                            {stepContent[index].message}
                          </Text>
                        </View>
                        
                        {/* 已完成的答案 */}
                        <Animated.View 
                          style={[
                            styles.completedAnswerText,
                            {
                              opacity: answerAnimations[index],
                              transform: [{
                                scale: answerAnimations[index].interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0.95, 1],
                                }),
                              }],
                            },
                          ]}
                          onLayout={(event) => {
                            // 记录最新答案的实际高度
                            if (index === Object.keys(completedAnswers).length - 1) {
                              setLastAnswerHeight(event.nativeEvent.layout.height)
                            }
                          }}
                        >
                          <Text style={styles.answerValue}>
                            {formatAnswerDisplay(answer)}
                          </Text>
                        </Animated.View>
                      </View>
                    </Animated.View>
                  )
                })}

              {/* 当前问题 - 总是在最后，通过滚动确保出现在固定位置 */}
              {currentStep < stepContent.length && !completedAnswers[currentStep] && (
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
                  <View style={styles.currentQuestionCard}>
                    <View style={styles.questionHeader}>
                      <Animated.View 
                        style={[
                          styles.avatarSimple,
                          {
                            transform: [{
                              scale: emotionAnimation,
                            }],
                          },
                        ]}
                      >
                        <Text style={styles.avatarInitial}>AI</Text>
                      </Animated.View>
                      <Animated.View 
                        style={[
                          styles.questionTextContainer,
                          {
                            transform: [{
                              translateX: shakeAnimation,
                            }],
                          },
                        ]}
                      >
                        <Text style={styles.currentQuestionText}>
                          {displayedText}
                          {isTyping && showCursor && <Text style={styles.cursor}>|</Text>}
                        </Text>
                        {inputError && (
                          <Text style={styles.errorText}>{inputError}</Text>
                        )}
                        
                        {/* 完成状态的加载动画 */}
                        {currentStep === 5 && (
                          <View style={styles.loadingContainer}>
                            <Animated.View
                              style={[
                                styles.loadingSpinner,
                                {
                                  transform: [{
                                    rotate: currentQuestionAnimation.interpolate({
                                      inputRange: [0, 1],
                                      outputRange: ['0deg', '360deg'],
                                    }),
                                  }],
                                },
                              ]}
                            >
                              <Text style={styles.loadingEmoji}>⟳</Text>
                            </Animated.View>
                          </View>
                        )}
                      </Animated.View>
                    </View>

                  {/* Map Container */}
                  {showMap && currentStep === 0 && (
                    <Animated.View 
                      style={[
                        styles.mapContainer,
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
                      <MapComponent showMap={showMap} mapAnimation={mapAnimation} />
                    </Animated.View>
                  )}

                  {/* Address Input - 第一个问题 */}
                  {getCurrentStepData().showAddressInput && (
                    <View style={styles.inputSection}>
                      <View style={[
                        styles.simpleInputWrapper,
                        isAddressConfirmed && styles.disabledSimpleInputWrapper
                      ]}>
                        <MaterialIcons 
                          name="location-on" 
                          size={20} 
                          color="#B0B0B0" 
                          style={styles.simpleInputIcon}
                        />
                        <TextInput
                          style={styles.simpleTextInput}
                          placeholder="请输入地址"
                          value={address}
                          onChangeText={(text) => {
                            if (!isAddressConfirmed) {
                              setAddress(text)
                              handleInputFocus('address', inputFocus.address, text.length > 0)
                            }
                          }}
                          onFocus={() => handleInputFocus('address', true, address.length > 0)}
                          onBlur={() => handleInputFocus('address', false, address.length > 0)}
                          editable={!isAddressConfirmed}
                          onSubmitEditing={handleAddressConfirm}
                          returnKeyType="done"
                        />
                        {address && !isAddressConfirmed && (
                          <TouchableOpacity 
                            onPress={() => setAddress('')}
                            style={styles.simpleInputClearButton}
                          >
                            <MaterialIcons name="close" size={18} color="#9ca3af" />
                          </TouchableOpacity>
                        )}
                        {isAddressConfirmed && (
                          <TouchableOpacity 
                            onPress={handleEditAddress}
                            style={styles.simpleInputEditButton}
                          >
                            <MaterialIcons name="edit" size={18} color="#6b7280" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  )}

                  {/* Phone Input - 第二个问题 */}
                  {getCurrentStepData().showPhoneInput && (
                    <View style={styles.inputSection}>
                      <View style={[
                        styles.simpleInputWrapper,
                        !validatePhoneNumber(phoneNumber) && phoneNumber.length > 0 && styles.errorSimpleInputWrapper
                      ]}>
                        <MaterialIcons 
                          name="phone" 
                          size={20} 
                          color="#B0B0B0" 
                          style={styles.simpleInputIcon}
                        />
                        <TextInput
                          style={styles.simpleTextInput}
                          placeholder="请输入11位手机号"
                          value={phoneNumber}
                          onChangeText={setPhoneNumber}
                          keyboardType="numeric"
                          maxLength={11}
                          returnKeyType="done"
                        />
                        {phoneNumber && (
                          <TouchableOpacity 
                            onPress={() => setPhoneNumber('')}
                            style={styles.simpleInputClearButton}
                          >
                            <MaterialIcons name="close" size={18} color="#9ca3af" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  )}

                  {/* Budget Input - 第三个问题 */}
                  {getCurrentStepData().showBudgetInput && (
                    <View style={styles.inputSection}>
                      {/* 预设金额按钮 */}
                      <View style={styles.budgetOptionsContainer}>
                        {['30', '50', '100', '200'].map((amount) => (
                          <TouchableOpacity
                            key={amount}
                            onPress={() => setBudget(amount)}
                            style={[
                              styles.budgetOptionButton,
                              budget === amount && styles.selectedBudgetOptionButton
                            ]}
                          >
                            <Text style={[
                              styles.budgetOptionText,
                              budget === amount && styles.selectedBudgetOptionText
                            ]}>
                              ¥{amount}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      
                      {/* 自定义金额输入 */}
                      <View style={styles.simpleInputWrapper}>
                        <MaterialIcons 
                          name="attach-money" 
                          size={20} 
                          color="#B0B0B0" 
                          style={styles.simpleInputIcon}
                        />
                        <TextInput
                          style={styles.simpleTextInput}
                          placeholder="或输入自定义金额"
                          value={budget}
                          onChangeText={setBudget}
                          keyboardType="numeric"
                          returnKeyType="done"
                        />
                        {budget && (
                          <TouchableOpacity 
                            onPress={() => setBudget('')}
                            style={styles.simpleInputClearButton}
                          >
                            <MaterialIcons name="close" size={18} color="#9ca3af" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  )}

                  {/* Allergy Input - 第四个问题 */}
                  {getCurrentStepData().showAllergyInput && (
                    <View style={styles.inputSection}>
                      <View style={styles.simpleInputWrapper}>
                        <MaterialIcons 
                          name="warning" 
                          size={20} 
                          color="#B0B0B0" 
                          style={styles.simpleInputIcon}
                        />
                        <TextInput
                          style={[styles.simpleTextInput, styles.multilineInput]}
                          placeholder="忌口食物，如：海鲜、花生等（可选）"
                          value={allergies}
                          onChangeText={setAllergies}
                          multiline={true}
                          numberOfLines={2}
                          returnKeyType="done"
                        />
                        {allergies && (
                          <TouchableOpacity 
                            onPress={() => setAllergies('')}
                            style={styles.simpleInputClearButton}
                          >
                            <MaterialIcons name="close" size={18} color="#9ca3af" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  )}

                  {/* Preference Input - 第五个问题 */}
                  {getCurrentStepData().showPreferenceInput && (
                    <View style={styles.inputSection}>
                      <View style={styles.simpleInputWrapper}>
                        <MaterialIcons 
                          name="favorite" 
                          size={20} 
                          color="#B0B0B0" 
                          style={styles.simpleInputIcon}
                        />
                        <TextInput
                          style={[styles.simpleTextInput, styles.multilineInput]}
                          placeholder="口味偏好，如：不要太辣、多放香菜等（可选）"
                          value={preferences}
                          onChangeText={setPreferences}
                          multiline={true}
                          numberOfLines={2}
                          returnKeyType="done"
                        />
                        {preferences && (
                          <TouchableOpacity 
                            onPress={() => setPreferences('')}
                            style={styles.simpleInputClearButton}
                          >
                            <MaterialIcons name="close" size={18} color="#9ca3af" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  )}

                  {/* Action Button */}
                  {currentStep === 0 && !isAddressConfirmed ? (
                    <TouchableOpacity
                      onPress={handleAddressConfirm}
                      disabled={!address.trim()}
                      style={[
                        styles.simpleButton,
                        address.trim() ? styles.activeSimpleButton : styles.disabledSimpleButton
                      ]}
                    >
                      <Text style={[
                        styles.simpleButtonText,
                        address.trim() ? styles.activeSimpleButtonText : styles.disabledSimpleButtonText
                      ]}>
                        确认地址
                      </Text>
                    </TouchableOpacity>
                  ) : canProceed() ? (
                    <TouchableOpacity 
                      onPress={handleNext}
                      style={styles.nextSimpleButton}
                    >
                      <Text style={styles.nextSimpleButtonText}>
                        {currentStep === stepContent.length - 1 ? '确认订单' : '确认'}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                  </View>
                </Animated.View>
              )}
            </View>
          </View>
        </View>
        
        {/* 透明占位元素，用于强制扩展ScrollView高度 */}
        <View style={{ height: Math.max(0, contentHeight - 800) }} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 896,
    alignSelf: 'center',
    width: '100%',
  },
  headerTitle: {
    fontSize: Platform.OS === 'ios' ? 30 : 25, // 30→60, 26→52
    fontWeight: 'bold',
    color: '#444444',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    // 移除minHeight，让内容自然撑开页面
    // 每个新问题会增加页面总高度，创建滚动空间
  },
  completedQuestionContainer: {
    marginBottom: 10, // 调小1/3：80→53
    minHeight: 120,   // 设置最小高度，确保每个问题都很"高"
  },
  
  currentQuestionCard: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    padding: 0,
    marginBottom: 80, // 增加当前问题的底部边距
    marginTop: 10,    // 增加顶部边距
    minHeight: 200,   // 当前问题需要更多高度，因为包含输入框
  },
  
  completedQuestionRow: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
  },
  
  completedAnswerText: {
    marginLeft: 27,
    marginTop: 2, // 缩小间距：8→4
    paddingLeft: 16,
    borderLeftWidth: 2,
    borderLeftColor: '#F2F2F2',
  },
  answerContainer: {
    backgroundColor: '#66CC99',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 16,
    marginLeft: width > 768 ? 72 : 16, // 移动端减少边距
    marginTop: 8,
    alignSelf: 'flex-start',
    maxWidth: width > 768 ? 384 : width - 100, // 移动端调整最大宽度
  },
  answerText: {
    color: '#ffffff',
    fontSize: 32, // 16→32
    lineHeight: 44,
  },
  mainContent: {
    maxWidth: 1200, // 增加最大宽度，为居中留出更多空间
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: width > 768 ? 48 : 16, // 增加水平内边距
    paddingVertical: width > 768 ? 32 : 16,
    // 确保主内容可以无限增长，不被flex限制
    minHeight: height, // 至少一个屏幕高度，确保有滚动基础
  },
  contentContainer: {
    flexDirection: 'column', // 改为单列布局，因为进度条悬浮了
    gap: 24,
    // 移除任何高度限制，让内容自然增长
    alignItems: 'flex-start', // 确保内容从顶部开始，不被居中
    justifyContent: 'center', // 居中对话内容
  },
  progressContainer: {
    position: 'absolute', // 使用绝对定位在React Native中实现悬浮效果
    top: width > 768 ? 120 : 80, // 距离父容器顶部的位置
    left: width > 768 ? 100 : 6, // 距离父容器左边的位置
    zIndex: 10, // 确保悬浮在其他内容之上
    width: width > 768 ? 180 : '90%', // 减少宽度
    // 移除所有卡片样式
    marginBottom: 0,
  },
  progressSteps: {
    gap: 16, // 减少间距，因为悬浮卡片空间有限
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12, // 减少图标和文字的间距
  },
  activeStep: {
    width: 12, // 减小圆点大小
    height: 12,
    backgroundColor: '#66CC99',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeStepInner: {
    width: 6, // 相应减小内圆
    height: 6,
    backgroundColor: '#ffffff',
    borderRadius: 3,
  },
  inactiveStep: {
    width: 12, // 减小圆点大小
    height: 12,
    borderWidth: 2,
    borderColor: '#F2F2F2',
    borderRadius: 6,
  },
  activeStepText: {
    fontSize: 14, // 36→14，大幅减小字体
    fontWeight: '500',
    color: '#66CC99',
  },
  inactiveStepText: {
    fontSize: 14, // 36→14，大幅减小字体  
    color: '#9ca3af',
  },
  rightContent: {
    width: '100%', // 占满全宽
    // 确保内容区域一定会超出屏幕，创建滚动空间
    minHeight: height * 1.2, // 比屏幕高度高20%，强制创建滚动
    maxWidth: width > 768 ? 700 : '100%', // 限制最大宽度，让内容更集中
    alignSelf: 'center', // 自身居中
    paddingTop: width > 768 ? 90 : 60, // 与进度条顶部位置对齐
  },
  chatContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 32,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    flexShrink: 0,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 56, // 28→56
    textAlign: 'center',
  },
  messageContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 16,
    maxWidth: 384,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  messageText: {
    color: '#444444',
    fontSize: 36, // 18→36
    lineHeight: 48,
  },
  cursor: {
    color: '#66CC99',
    fontWeight: 'bold',
  },
  errorMessage: {
    color: '#ef4444',
    fontSize: 28, // 14→28
    marginTop: 8,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  loadingSpinner: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingEmoji: {
    fontSize: 48, // 24→48
  },
  mapContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  map: {
    height: 320,
    width: '100%',
  },
  webMapContainer: {
    height: 320,
    width: '100%',
  },
  webMapBackground: {
    flex: 1,
    backgroundColor: '#e5e7eb',
    position: 'relative',
  },
  streetLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  streetLine: {
    position: 'absolute',
    backgroundColor: '#9ca3af',
    opacity: 0.5,
  },
  streetLabel: {
    position: 'absolute',
    fontSize: 24, // 12→24
    color: '#6b7280',
  },
  webMapPin: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -16 }, { translateY: -32 }],
    alignItems: 'center',
  },
  webMapPinCircle: {
    width: 32,
    height: 32,
    backgroundColor: '#66CC99',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  webMapPinInner: {
    width: 12,
    height: 12,
    backgroundColor: '#ffffff',
    borderRadius: 6,
  },
  webMapPinStem: {
    width: 4,
    height: 16,
    backgroundColor: '#66CC99',
  },
  webMapBranding: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  webMapBrandingText: {
    fontSize: 24, // 12→24
    fontWeight: 'bold',
    color: '#444444',
  },
  webMapCopyright: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    fontSize: 24, // 12→24
    color: '#6b7280',
  },
  nativeMapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F2',
  },
  nativeMapText: {
    fontSize: 36, // 18→36
    fontWeight: '600',
    color: '#444444',
    marginTop: 12,
  },
  nativeMapSubtext: {
    fontSize: 28, // 14→28
    color: '#6b7280',
    marginTop: 4,
  },
  inputContainer: {
    marginBottom: 32,
  },
  inputWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  textInput: {
    flex: 1,
    paddingLeft: 48,
    paddingRight: 48,
    paddingVertical: 16,
    fontSize: 32, // 16→32
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#F2F2F2',
    borderRadius: 8,
  },
  disabledInput: {
    backgroundColor: '#F2F2F2',
  },
  clearButton: {
    position: 'absolute',
    right: 16,
  },
  editButton: {
    position: 'absolute',
    right: 16,
  },
  errorInput: {
    borderColor: '#ef4444',
    borderWidth: 2,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 28, // 14→28
    marginTop: 4,
    marginLeft: 16,
  },
  budgetButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  budgetButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#F2F2F2',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  selectedBudgetButton: {
    backgroundColor: '#66CC99',
    borderColor: '#66CC99',
  },
  budgetButtonText: {
    fontSize: 32, // 16→32
    fontWeight: '500',
    color: '#444444',
  },
  selectedBudgetButtonText: {
    color: '#ffffff',
  },
  actionButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  buttonTouchable: {
    width: '100%',
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: '#66CC99',
  },
  disabledButton: {
    backgroundColor: '#d1d5db',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  buttonText: {
    fontSize: 36, // 18→36
    fontWeight: '500',
  },
  activeButtonText: {
    color: '#ffffff',
  },
  disabledButtonText: {
    color: '#6b7280',
  },
  nextButton: {
    backgroundColor: '#d1d5db',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 36, // 18→36
    fontWeight: '500',
  },
  
  // Clean Lemonade-inspired card-based styles
  questionCard: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    padding: 0,
    marginBottom: 12,
  },
  
  currentQuestionCard: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    padding: 0,
    marginBottom: 24,
  },
  
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  
  avatarSimple: {
    width: 32,
    height: 32,
    backgroundColor: '#F2F2F2',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  
  avatarInitial: {
    fontSize: 24, // 12→24
    fontWeight: '600',
    color: '#6b7280',
  },
  
  questionText: {
    fontSize: 24, // 减小1/4：32→24
    color: '#444444',
    lineHeight: 32, // 减小行间距：44→32
    flex: 1,
  },
  
  currentQuestionText: {
    fontSize: 24, // 减小1/4：32→24  
    color: '#444444',
    lineHeight: 32, // 减小行间距：44→32
    flex: 1,
    fontWeight: '500',
  },
  
  questionTextContainer: {
    flex: 1,
  },
  
  answerCard: {
    backgroundColor: '#F2F2F2',
    borderRadius: 8,
    padding: 16,
    marginLeft: 44,
    borderLeftWidth: 3,
    borderLeftColor: '#66CC99',
  },
  
  answerLabel: {
    fontSize: 24, // 12→24
    color: '#6b7280',
    marginBottom: 4,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  answerValue: {
    fontSize: 24, // 缩小1/4：32→24
    color: '#444444',
    fontWeight: '400',
    lineHeight: 36, // 相应调整行高：48→36
  },
  
  inputSection: {
    marginTop: 16,
    marginBottom: 20,
  },
  
  floatingInputContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  
  floatingLabel: {
    position: 'absolute',
    left: 48, // 为图标留出空间
    top: 18,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 4,
    zIndex: 1,
    fontWeight: '400',
  },
  
  simpleInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 0, // 移除边框
    borderRadius: 12, // 更圆润的边角
    paddingHorizontal: 16,
    paddingVertical: 2,
    minHeight: 56, // 稍微增加高度
    width: '100%', // 确保布满整个宽度
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06, // 非常微妙的阴影
    shadowRadius: 8,
    elevation: 3, // Android阴影
  },
  
  simpleInputIcon: {
    marginRight: 12, // 稍微增加间距
    flexShrink: 0,
    opacity: 0.6, // 让图标更柔和
  },
  
  simpleTextInput: {
    flex: 1,
    fontSize: 18, // 减小字体，更精致
    color: '#444444',
    paddingVertical: 16,
    paddingHorizontal: 0, // 移除内边距，让容器来控制
    fontWeight: '400', // 正常字重
    letterSpacing: 0.5, // 增加字母间距
    borderWidth: 0, // 移除边框
    outlineStyle: 'none', // 移除 web 上的 outline
  },
  
  disabledSimpleInputWrapper: {
    backgroundColor: '#F8F9FA', // 更浅的背景色
    opacity: 0.8,
  },
  
  errorSimpleInputWrapper: {
    backgroundColor: '#FEF2F2', // 淡红色背景
    shadowColor: '#EF4444',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  
  disabledSimpleInput: {
    backgroundColor: '#F8F9FA', // 更浅的背景色
    color: '#9CA3AF',
    opacity: 0.8,
  },
  
  errorSimpleInput: {
    backgroundColor: '#FEF2F2', // 淡红色背景
    shadowColor: '#EF4444',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  
  simpleInputClearButton: {
    padding: 4,
    marginLeft: 8,
  },
  
  simpleInputEditButton: {
    padding: 4,
    marginLeft: 8,
  },
  
  multilineInput: {
    minHeight: 88, // 增加多行输入的高度
    textAlignVertical: 'top',
    paddingTop: 16, // 确保文本从顶部开始
  },
  
  budgetOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  
  budgetOptionButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#F2F2F2',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 60,
    alignItems: 'center',
  },
  
  selectedBudgetOptionButton: {
    backgroundColor: '#66CC99',
    borderColor: '#66CC99',
  },
  
  budgetOptionText: {
    fontSize: 28, // 14→28
    fontWeight: '500',
    color: '#444444',
  },
  
  selectedBudgetOptionText: {
    color: '#ffffff',
  },
  
  simpleButton: {
    borderRadius: 12, // 更圆润的边角
    paddingHorizontal: 24, // 增加水平内边距
    paddingVertical: 14, // 增加垂直内边距
    alignSelf: 'flex-start',
    marginTop: 12, // 稍微增加顶部边距
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08, // 轻微的阴影
    shadowRadius: 8,
    elevation: 3, // Android阴影
  },
  
  activeSimpleButton: {
    backgroundColor: '#66CC99', // 更现代的绿色
    shadowColor: '#66CC99',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15, // 强化激活状态阴影
    shadowRadius: 12,
    elevation: 5,
  },
  
  disabledSimpleButton: {
    backgroundColor: '#F8FAFC', // 更轻微的背景
    borderWidth: 1,
    borderColor: '#E2E8F0', // 添加边框
    shadowOpacity: 0, // 移除阴影
  },
  
  simpleButtonText: {
    fontSize: 21, // 缩小1/3：32→21
    fontWeight: '500',
    textAlign: 'center',
  },
  
  activeSimpleButtonText: {
    color: '#ffffff',
    fontWeight: '600', // 增加字体重量
    letterSpacing: 0.3, // 添加字母间距
  },
  
  disabledSimpleButtonText: {
    color: '#94A3B8', // 更柔和的灰色
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  
  nextSimpleButton: {
    backgroundColor: '#66CC99',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  
  nextSimpleButtonText: {
    color: '#ffffff',
    fontSize: 21, // 缩小1/3：32→21
    fontWeight: '500',
    textAlign: 'center',
  },
})