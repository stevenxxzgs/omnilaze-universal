import { StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants';

const { width } = Dimensions.get('window');

export const mapStyles = StyleSheet.create({
  mapContainer: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: COLORS.SHADOW,
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
    fontSize: 24,
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
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  webMapPinInner: {
    width: 12,
    height: 12,
    backgroundColor: COLORS.WHITE,
    borderRadius: 6,
  },
  webMapPinStem: {
    width: 4,
    height: 16,
    backgroundColor: COLORS.PRIMARY,
  },
  webMapBranding: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  webMapBrandingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  webMapCopyright: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    fontSize: 24,
    color: COLORS.TEXT_SECONDARY,
  },
  nativeMapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.BACKGROUND,
  },
  nativeMapText: {
    fontSize: 36,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginTop: 12,
  },
  nativeMapSubtext: {
    fontSize: 28,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 4,
  },
});