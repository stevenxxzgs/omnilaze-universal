/**
 * 地址自动完成组件
 * 
 * 功能特点：
 * - 集成高德地图API进行真实地址搜索
 * - 智能输入限制：至少4个汉字才开始搜索  
 * - 防抖优化：500ms延迟减少API调用
 * - 智能缓存：相同搜索词5分钟内使用缓存
 * - 跨平台支持：Web端使用Portal，移动端使用原生下拉
 * 
 * @example
 * <AddressAutocomplete
 *   value={address}
 *   onChangeText={setAddress}
 *   onSelectAddress={(suggestion) => console.log(suggestion)}
 *   placeholder="请输入您的地址"
 * />
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Animated, Platform } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { inputStyles } from '../styles/inputStyles';
import { addressAutocompleteStyles } from '../styles/addressStyles';
import { searchAddresses, AddressSuggestion } from '../services/api';
import { WebPortal } from './WebPortal';

interface AddressAutocompleteProps {
  value: string;
  onChangeText: (text: string) => void;
  onSelectAddress: (address: AddressSuggestion) => void;
  placeholder: string;
  iconName?: keyof typeof MaterialIcons.glyphMap;
  editable?: boolean;
  isError?: boolean;
  isDisabled?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  animationValue?: Animated.Value;
  debounceMs?: number;
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChangeText,
  onSelectAddress,
  placeholder,
  iconName = 'location-on',
  editable = true,
  isError = false,
  isDisabled = false,
  onFocus,
  onBlur,
  animationValue,
  debounceMs = 500, // 增加到500ms，配合API优化策略
}) => {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [inputPosition, setInputPosition] = useState({ x: 0, y: 0, width: 0 });
  const debounceRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<View>(null);

  const handleTextChange = (text: string) => {
    onChangeText(text);
    
    // 清除之前的防抖定时器
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // 检查汉字数量（至少4个汉字）
    const trimmedText = text.trim();
    const chineseCharCount = (trimmedText.match(/[\u4e00-\u9fff]/g) || []).length;
    
    if (!trimmedText || chineseCharCount < 4) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // 设置新的防抖定时器
    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await searchAddresses(text);
        if (response.success && response.predictions) {
          setSuggestions(response.predictions);
          setShowSuggestions(response.predictions.length > 0);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (error) {
        console.error('Address search error:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsLoading(false);
      }
    }, debounceMs);
  };

  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    console.log('建议项被选择:', suggestion.description); // 调试日志
    
    // 立即隐藏建议列表，防止重复点击
    setShowSuggestions(false);
    setSuggestions([]);
    
    // 更新输入框文本
    onChangeText(suggestion.description);
    
    // 调用父组件的回调
    onSelectAddress(suggestion);
  };

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
    
    // 获取输入框位置信息用于下拉框定位
    if (Platform.OS === 'web' && inputRef.current) {
      inputRef.current.measure?.((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
        setInputPosition({ x: pageX, y: pageY + height, width });
      });
    }
    
    // 如果有输入内容但没有显示建议，重新搜索
    if (value.trim() && suggestions.length === 0) {
      handleTextChange(value);
    }
  };

  const handleBlur = () => {
    // 延迟隐藏建议，让用户有时间点击
    setTimeout(() => {
      setIsFocused(false);
      setShowSuggestions(false);
      onBlur && onBlur();
    }, 300); // 进一步增加延迟时间确保点击事件能够触发
  };

  const handleClear = () => {
    onChangeText('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const getWrapperStyle = () => {
    if (isDisabled) return [inputStyles.simpleInputWrapper, inputStyles.disabledSimpleInputWrapper];
    if (isError) return [inputStyles.simpleInputWrapper, inputStyles.errorSimpleInputWrapper];
    return inputStyles.simpleInputWrapper;
  };

  const WrapperComponent = animationValue ? Animated.View : View;
  const wrapperProps = animationValue 
    ? {
        style: [
          inputStyles.inputSection,
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
    : { style: inputStyles.inputSection };

  const renderSuggestion = ({ item }: { item: AddressSuggestion }) => (
    <TouchableOpacity
      style={addressAutocompleteStyles.suggestionItem}
      onPress={() => {
        console.log('建议项被点击:', item.description); // 调试日志
        handleSelectSuggestion(item);
      }}
      onPressIn={() => {
        // 立即响应按下事件，提高敏感度
        console.log('建议项按下:', item.description);
      }}
      activeOpacity={0.7}
      delayPressIn={0}
      delayPressOut={0}
    >
      <MaterialIcons 
        name="location-on" 
        size={16} 
        color="#9CA3AF" 
        style={addressAutocompleteStyles.suggestionIcon}
      />
      <View style={addressAutocompleteStyles.suggestionTextContainer}>
        {item.structured_formatting ? (
          <>
            <Text style={addressAutocompleteStyles.suggestionMainText}>
              {item.structured_formatting.main_text}
            </Text>
            <Text style={addressAutocompleteStyles.suggestionSecondaryText}>
              {item.structured_formatting.secondary_text}
            </Text>
          </>
        ) : (
          <Text style={addressAutocompleteStyles.suggestionMainText}>
            {item.description}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <WrapperComponent {...wrapperProps}>
      <View style={addressAutocompleteStyles.container} ref={inputRef}>
        <View style={getWrapperStyle()}>
          <MaterialIcons 
            name={iconName}
            size={20} 
            color="#B0B0B0" 
            style={inputStyles.simpleInputIcon}
          />
          <TextInput
            style={[
              inputStyles.simpleTextInput,
              { outlineWidth: 0 }
            ] as any}
            placeholder={placeholder}
            value={value}
            onChangeText={handleTextChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            editable={editable && !isDisabled}
            autoComplete="address-line1"
            autoCorrect={false}
          />
          {isLoading && (
            <View style={addressAutocompleteStyles.loadingContainer}>
              <MaterialIcons name="refresh" size={18} color="#9CA3AF" />
            </View>
          )}
          {value && !isDisabled && (
            <TouchableOpacity 
              onPress={handleClear}
              style={inputStyles.simpleInputClearButton}
            >
              <MaterialIcons name="close" size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
        
        {showSuggestions && suggestions.length > 0 && (
          <>
            {Platform.OS === 'web' ? (
              <WebPortal isVisible={showSuggestions}>
                <View 
                  style={{
                    position: 'absolute',
                    left: inputPosition.x,
                    top: inputPosition.y,
                    width: inputPosition.width || 300,
                    backgroundColor: '#FFFFFF',
                    borderRadius: 12,
                    marginTop: 4,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.12,
                    shadowRadius: 12,
                    zIndex: 99999,
                    maxHeight: 200,
                    pointerEvents: 'auto',
                  }}
                >
                  <FlatList
                    data={suggestions}
                    renderItem={renderSuggestion}
                    keyExtractor={(item) => item.place_id}
                    keyboardShouldPersistTaps="always"
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled={true}
                    style={{ maxHeight: 200 }}
                  />
                </View>
              </WebPortal>
            ) : (
              <View style={addressAutocompleteStyles.suggestionsContainer}>
                <FlatList
                  data={suggestions}
                  renderItem={renderSuggestion}
                  keyExtractor={(item) => item.place_id}
                  style={[addressAutocompleteStyles.suggestionsList, { maxHeight: 200 }]}
                  keyboardShouldPersistTaps="always"
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                />
              </View>
            )}
          </>
        )}
      </View>
    </WrapperComponent>
  );
};