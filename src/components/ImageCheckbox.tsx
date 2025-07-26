import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
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
}

export const ImageCheckbox: React.FC<ImageCheckboxProps> = ({
  options,
  selectedIds,
  onSelectionChange,
  animationValue,
}) => {
  const [shouldRender, setShouldRender] = useState(!animationValue);

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
    const isSelected = selectedIds.includes(optionId);
    let newSelection: string[];
    
    if (isSelected) {
      // 取消选择
      newSelection = selectedIds.filter(id => id !== optionId);
    } else {
      // 添加选择
      newSelection = [...selectedIds, optionId];
    }
    
    onSelectionChange(newSelection);
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
                isSelected && styles.selectedCard
              ]}
              onPress={() => toggleOption(option.id)}
              activeOpacity={0.7}
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
                  <MaterialIcons 
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
    justifyContent: 'space-between',
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
    backgroundColor: '#F0F9FF',
  },
  imageContainer: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  optionImage: {
    width: 48,
    height: 48,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginVertical: 4,
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
});