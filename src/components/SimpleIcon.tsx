import React from 'react';
import { View } from 'react-native';
import { 
  IoLocationSharp,
  IoCall,
  IoCheckmark,
  IoClose,
  IoPencil,
  IoChatbubble,
} from 'react-icons/io5';

interface SimpleIconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

const iconMap: { [key: string]: any } = {
  'location-on': IoLocationSharp,
  'phone': IoCall,
  'check': IoCheckmark,
  'close': IoClose,
  'edit': IoPencil,
  'sms': IoChatbubble,
};

export const SimpleIcon: React.FC<SimpleIconProps> = ({ 
  name, 
  size = 20, 
  color = '#000', 
  style 
}) => {
  const IconComponent = iconMap[name];
  
  if (!IconComponent) {
    return null;
  }

  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <IconComponent 
        size={size} 
        color={color}
      />
    </View>
  );
};