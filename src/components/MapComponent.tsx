import React from 'react';
import { View, Text, Platform, Animated, Image } from 'react-native';
import { SimpleIcon } from './SimpleIcon';
import { mapStyles } from '../styles/mapStyles';

interface MapComponentProps {
  showMap: boolean;
  mapAnimation: Animated.Value;
  staticMapUrl?: string | null;
  address?: string;
}

export const MapComponent: React.FC<MapComponentProps> = ({ 
  showMap, 
  mapAnimation, 
  staticMapUrl, 
  address 
}) => {
  if (Platform.OS === 'web') {
    // 如果有静态地图URL，显示腾讯地图
    if (staticMapUrl) {
      return (
        <View style={mapStyles.webMapContainer}>
          <Image 
            source={{ uri: staticMapUrl }}
            style={{
              width: '100%',
              height: 300,
              borderRadius: 8,
              resizeMode: 'cover'
            }}
            onError={(error) => {
              console.error('静态地图加载失败:', error.nativeEvent.error);
            }}
          />
          {address && (
            <View style={{
              position: 'absolute',
              bottom: 8,
              left: 8,
              right: 8,
              backgroundColor: 'rgba(0,0,0,0.7)',
              borderRadius: 4,
              padding: 8
            }}>
              <Text style={{
                color: 'white',
                fontSize: 12,
                textAlign: 'center'
              }}>
                📍 {address}
              </Text>
            </View>
          )}
        </View>
      );
    }
    
    // 没有静态地图时显示占位符
    return (
      <View style={mapStyles.webMapContainer}>
        <View style={{
          backgroundColor: '#f5f5f5',
          height: 300,
          borderRadius: 8,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20
        }}>
          <SimpleIcon name="location-on" size={48} color="#9CA3AF" />
          <Text style={{
            color: '#6B7280',
            fontSize: 16,
            fontWeight: '500',
            marginTop: 12,
            textAlign: 'center'
          }}>
            地图加载中...
          </Text>
          {address && (
            <Text style={{
              color: '#9CA3AF',
              fontSize: 14,
              marginTop: 8,
              textAlign: 'center'
            }}>
              📍 {address}
            </Text>
          )}
        </View>
      </View>
    );
  }
  
  // 移动端显示
  return (
    <View style={mapStyles.map}>
      <View style={mapStyles.nativeMapPlaceholder}>
        <SimpleIcon name="location-on" size={48} color="#66CC99" />
        <Text style={mapStyles.nativeMapText}>腾讯地图</Text>
        {address && (
          <Text style={mapStyles.nativeMapSubtext}>{address}</Text>
        )}
      </View>
    </View>
  );
};