import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { BaseInput } from './BaseInput';
import { budgetStyles } from '../styles/inputStyles';
import { BUDGET_OPTIONS } from '../constants';

interface BudgetInputProps {
  value: string;
  onChangeText: (text: string) => void;
  animationValue?: Animated.Value;
  onSubmitEditing?: () => void;
  errorMessage?: string; // 新增：错误信息
}

export const BudgetInput: React.FC<BudgetInputProps> = ({
  value,
  onChangeText,
  animationValue,
  onSubmitEditing,
  errorMessage, // 新增：错误信息
}) => {
  const WrapperComponent = animationValue ? Animated.View : View;
  const wrapperProps = animationValue 
    ? {
        style: [
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
    : {};

  return (
    <WrapperComponent {...wrapperProps}>
      <View style={budgetStyles.budgetOptionsContainer}>
        {BUDGET_OPTIONS.map((amount) => (
          <TouchableOpacity
            key={amount}
            onPress={() => onChangeText(amount)}
            style={[
              budgetStyles.budgetOptionButton,
              value === amount && budgetStyles.selectedBudgetOptionButton
            ]}
          >
            <Text style={[
              budgetStyles.budgetOptionText,
              value === amount && budgetStyles.selectedBudgetOptionText
            ]}>
              ¥{amount}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <BaseInput
        value={value}
        onChangeText={onChangeText}
        placeholder="或输入自定义金额"
        iconName="attach-money"
        keyboardType="numeric"
        returnKeyType="done"
        onClear={() => onChangeText('')}
        onSubmitEditing={onSubmitEditing}
        errorMessage={errorMessage}
      />
    </WrapperComponent>
  );
};