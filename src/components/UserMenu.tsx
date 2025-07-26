import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated } from 'react-native';
import { SimpleIcon } from './SimpleIcon';
import { COLORS } from '../constants';

interface UserMenuProps {
  isVisible: boolean;
  onLogout: () => void;
  onInvite: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  isVisible,
  onLogout,
  onInvite,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownAnimation = new Animated.Value(0);

  const toggleDropdown = () => {
    if (showDropdown) {
      // 隐藏下拉菜单
      Animated.spring(dropdownAnimation, {
        toValue: 0,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }).start(() => {
        setShowDropdown(false);
      });
    } else {
      // 显示下拉菜单
      setShowDropdown(true);
      Animated.spring(dropdownAnimation, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleLogout = () => {
    setShowDropdown(false);
    dropdownAnimation.setValue(0);
    onLogout();
  };

  const handleInvite = () => {
    setShowDropdown(false);
    dropdownAnimation.setValue(0);
    onInvite();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* 三个点按钮 */}
      <TouchableOpacity
        style={styles.menuButton}
        onPress={toggleDropdown}
        activeOpacity={0.7}
      >
        <View style={styles.dot} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </TouchableOpacity>

      {/* 下拉菜单 */}
      {showDropdown && (
        <Animated.View
          style={[
            styles.dropdown,
            {
              opacity: dropdownAnimation,
              transform: [{
                translateY: dropdownAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-10, 0],
                }),
              }, {
                scale: dropdownAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1],
                }),
              }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleInvite}
            activeOpacity={0.7}
          >
            <SimpleIcon name="gift" size={16} color={COLORS.PRIMARY} />
            <Text style={styles.menuItemText}>邀请</Text>
          </TouchableOpacity>
          
          <View style={styles.separator} />
          
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <SimpleIcon name="exit" size={16} color="#ef4444" />
            <Text style={[styles.menuItemText, { color: '#ef4444' }]}>登出</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* 点击外部关闭下拉菜单的遮罩 */}
      {showDropdown && (
        <TouchableOpacity
          style={styles.overlay}
          onPress={() => toggleDropdown()}
          activeOpacity={1}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1000,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.SHADOW,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.TEXT_PRIMARY,
    marginVertical: 1,
  },
  dropdown: {
    position: 'absolute',
    top: 45,
    right: 0,
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 120,
    shadowColor: COLORS.SHADOW,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.TEXT_PRIMARY,
    marginLeft: 8,
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 12,
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
});