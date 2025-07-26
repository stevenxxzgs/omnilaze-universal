import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, Animated, TextInput } from 'react-native';
import { SimpleIcon } from './SimpleIcon';
import { StyleSheet } from 'react-native';
import { COLORS } from '../constants';

interface ImageCheckboxOption {
  id: string;
  label: string;
  image: any; // 图片资源
}

interface ImageCheckboxProps {
  options: ImageCheckboxOption[];
  selectedIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  animationValue?: Animated.Value;
  singleSelect?: boolean; // 新增：是否单选模式
  onOtherTextChange?: (text: string) => void; // 新增：其他输入框文本变化回调
  disabled?: boolean; // 新增：是否禁用选择
}

export const ImageCheckbox: React.FC<ImageCheckboxProps> = ({
  options,
  selectedIds,
  onSelectionChange,
  animationValue,
  singleSelect = false, // 默认多选
  onOtherTextChange,
  disabled = false, // 默认不禁用
}) => {
  const [shouldRender, setShouldRender] = useState(!animationValue);
  const [otherText, setOtherText] = useState('');
  const [showOtherInput, setShowOtherInput] = useState(false);
  const otherInputAnimation = new Animated.Value(0);

  useEffect(() => {
    if (animationValue) {
      // 监听动画值变化
      const listener = animationValue.addListener(({ value }) => {
        setShouldRender(value > 0);
      });

      return () => {
        animationValue.removeListener(listener);
      };
    }
  }, [animationValue]);

  const toggleOption = (optionId: string) => {
    // 如果组件被禁用，不允许切换选择
    if (disabled) return;
    
    const isSelected = selectedIds.includes(optionId);
    const isOtherOption = optionId.includes('other');
    let newSelection: string[];
    
    if (singleSelect) {
      // 单选模式
      if (isSelected) {
        // 如果已选择，则取消选择
        newSelection = [];
        // 如果取消选择的是其他选项，隐藏输入框
        if (isOtherOption) {
          hideOtherInput();
        }
      } else {
        // 选择当前项，取消其他选择
        newSelection = [optionId];
        // 如果选择了其他选项，显示输入框
        if (isOtherOption) {
          showOtherInputAnimated();
        } else {
          // 如果选择了非其他选项，隐藏输入框
          hideOtherInput();
        }
      }
    } else {
      // 多选模式（原逻辑）
      if (isSelected) {
        // 取消选择
        newSelection = selectedIds.filter(id => id !== optionId);
        // 如果取消选择的是其他选项，隐藏输入框
        if (isOtherOption) {
          hideOtherInput();
        }
      } else {
        // 添加选择
        newSelection = [...selectedIds, optionId];
        // 如果选择了其他选项，显示输入框
        if (isOtherOption) {
          showOtherInputAnimated();
        }
      }
    }
    
    onSelectionChange(newSelection);
  };

  const showOtherInputAnimated = () => {
    setShowOtherInput(true);
    Animated.spring(otherInputAnimation, {
      toValue: 1,
      tension: 60,
      friction: 8,
      useNativeDriver: false,
    }).start();
  };

  const hideOtherInput = () => {
    Animated.spring(otherInputAnimation, {
      toValue: 0,
      tension: 60,
      friction: 8,
      useNativeDriver: false,
    }).start(() => {
      setShowOtherInput(false);
      setOtherText('');
      if (onOtherTextChange) {
        onOtherTextChange('');
      }
    });
  };

  const handleOtherTextChange = (text: string) => {
    setOtherText(text);
    if (onOtherTextChange) {
      onOtherTextChange(text);
    }
  };

  // 如果不应该渲染，返回null
  if (!shouldRender) {
    return null;
  }

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
      <View style={styles.grid}>
        {options.map((option) => {
          const isSelected = selectedIds.includes(option.id);
          
          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCard,
                isSelected && styles.selectedCard,
                disabled && styles.disabledCard
              ]}
              onPress={() => toggleOption(option.id)}
              activeOpacity={disabled ? 1 : 0.7}
              disabled={disabled}
            >
              <View style={styles.imageContainer}>
                <Image 
                  source={option.image} 
                  style={styles.optionImage}
                  resizeMode="contain"
                />
              </View>
              
              <Text 
                style={[
                  styles.optionLabel,
                  isSelected && styles.selectedLabel
                ]}
                numberOfLines={2}
                adjustsFontSizeToFit={true}
                minimumFontScale={0.8}
              >
                {option.label}
              </Text>
              
              <View style={[
                styles.checkbox,
                isSelected && styles.checkedBox
              ]}>
                {isSelected && (
                  <SimpleIcon 
                    name="check" 
                    size={18} 
                    color={COLORS.WHITE} 
                  />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      
      {/* 其他输入框 */}
      {showOtherInput && (
        <Animated.View
          style={[
            styles.otherInputContainer,
            {
              opacity: otherInputAnimation,
              transform: [{
                translateY: otherInputAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              }],
            },
          ]}
        >
          <TextInput
            style={styles.otherInput}
            placeholder="请描述具体内容..."
            value={otherText}
            onChangeText={handleOtherTextChange}
            autoFocus={true}
            multiline={false}
            returnKeyType="done"
          />
        </Animated.View>
      )}
    </WrapperComponent>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    maxWidth: 500, // 限制最大宽度
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8, // 减小间距
    justifyContent: 'center', // 改为居中对齐
  },
  optionCard: {
    width: '31%', // 一行三个，考虑gap的空间
    aspectRatio: 0.66, // 3:2 长宽比 (2/3 = 0.66，因为高比宽)
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: COLORS.SHADOW,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  selectedCard: {
    borderColor: COLORS.PRIMARY,
  },
  imageContainer: {
    width: 160, // 增加以容纳更大的图片
    height: 160, // 增加以容纳更大的图片
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  optionImage: {
    width: 144, // 从48增加到144 (3倍)
    height: 144, // 从48增加到144 (3倍)
  },
  optionLabel: {
    fontSize: 21, // 从16增加到21 (增加1/3)
    fontWeight: '500',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginVertical: 8, // 从4增加到8，增加上下间距
    marginBottom: 16, // 增加底部间距，让文字离checkbox更远
  },
  selectedLabel: {
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.WHITE,
  },
  checkedBox: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  disabledCard: {
    opacity: 0.8,
    backgroundColor: '#f8f9fa',
  },
  otherInputContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  otherInput: {
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: COLORS.WHITE,
    color: COLORS.TEXT_PRIMARY,
    shadowColor: COLORS.SHADOW,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
});