import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated, Platform, Dimensions } from 'react-native';
import { SimpleIcon } from './SimpleIcon';
import { COLORS } from '../constants';

const { width } = Dimensions.get('window');

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

  const toggleDropdown = () => {
    console.log('Toggle dropdown clicked, current state:', showDropdown);
    setShowDropdown(!showDropdown);
  };

  const handleLogout = () => {
    console.log('Logout clicked');
    setShowDropdown(false);
    onLogout();
  };

  const handleInvite = () => {
    console.log('Invite clicked');
    setShowDropdown(false);
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
        <View style={styles.dropdown}>
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
        </View>
      )}

      {/* 点击外部关闭下拉菜单的遮罩 */}
      {showDropdown && (
        <TouchableOpacity
          style={styles.overlay}
          onPress={() => setShowDropdown(false)}
          activeOpacity={1}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: width > 768 ? 120 : 55, // 调整到ProgressSteps上方一点点
    right: width > 768 ? 185 : 100, // 调整到ProgressSteps左侧
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
    zIndex: 1001,
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
    position: 'absolute',
    top: -100,
    left: -100,
    width: 1000,
    height: 1000,
    zIndex: 999,
  },
});