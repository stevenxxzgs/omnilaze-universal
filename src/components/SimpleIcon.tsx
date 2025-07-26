import React from 'react';
import { Text } from 'react-native';

interface SimpleIconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

const iconMap: { [key: string]: string } = {
  'location-on': '📍',
  'phone': '📱',
  'check': '✓',
  'close': '✕',
  'edit': '✏️',
  'sms': '💬',
};

export const SimpleIcon: React.FC<SimpleIconProps> = ({ 
  name, 
  size = 20, 
  color = '#000', 
  style 
}) => {
  return (
    <Text 
      style={[
        { 
          fontSize: size, 
          color, 
          lineHeight: size,
          textAlign: 'center',
          width: size,
          height: size,
        }, 
        style
      ]}
    >
      {iconMap[name] || '?'}
    </Text>
  );
};