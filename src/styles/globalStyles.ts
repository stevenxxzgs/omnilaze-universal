import { StyleSheet, Dimensions, Platform } from 'react-native';
import { COLORS, LAYOUT } from '../constants';

const { width, height } = Dimensions.get('window');

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  mainContent: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: width > 768 ? 48 : 16,
    paddingVertical: width > 768 ? 32 : 16,
    minHeight: height,
  },
  contentContainer: {
    flexDirection: 'column',
    gap: 24,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
});

export const progressStyles = StyleSheet.create({
  progressContainer: {
    position: 'absolute',
    top: width > 768 ? 130 : 80,
    left: width > 768 ? 100 : 20, // 改为right定位
    zIndex: 10,
    width: width > 768 ? 120 : 100, // 减小宽度，让文字更紧凑
    marginBottom: 0,
  },
  progressSteps: {
    gap: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activeStep: {
    width: 12,
    height: 12,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeStepInner: {
    width: 6,
    height: 6,
    backgroundColor: COLORS.WHITE,
    borderRadius: 3,
  },
  inactiveStep: {
    width: 12,
    height: 12,
    borderWidth: 2,
    borderColor: COLORS.BORDER,
    borderRadius: 6,
  },
  activeStepText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.PRIMARY,
  },
  inactiveStepText: {
    fontSize: 14,
    color: COLORS.TEXT_MUTED,
  },
});

export const questionStyles = StyleSheet.create({
  completedQuestionContainer: {
    marginBottom: 10,
    minHeight: 120,
  },
  currentQuestionCard: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    padding: 0,
    marginBottom: 80,
    marginTop: 10,
    minHeight: 200,
  },
  completedQuestionRow: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  questionText: {
    fontSize: 24,
    color: COLORS.TEXT_PRIMARY,
    lineHeight: 32,
    flex: 1,
  },
  currentQuestionText: {
    fontSize: 24,
    color: COLORS.TEXT_PRIMARY,
    lineHeight: 32,
    flex: 1,
    fontWeight: '500',
  },
  questionTextContainer: {
    flex: 1,
  },
  cursor: {
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
  },
  errorText: {
    color: COLORS.ERROR,
    fontSize: 28,
    marginTop: 4,
    marginLeft: 16,
  },
});

export const avatarStyles = StyleSheet.create({
  avatarSimple: {
    width: LAYOUT.AVATAR_SIZE,
    height: LAYOUT.AVATAR_SIZE,
    backgroundColor: COLORS.BORDER,
    borderRadius: LAYOUT.AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 12,
  },
});

export const answerStyles = StyleSheet.create({
  completedAnswerText: {
    marginLeft: 27,
    marginTop: 2,
    paddingLeft: 16,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.BORDER,
  },
  answerValue: {
    fontSize: 24,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '400',
    lineHeight: 36,
  },
  answerWithEdit: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    gap: 10,
  },
  editAnswerButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'transparent',
    opacity: 0.9,
    
  },
});

export const rightContentStyles = StyleSheet.create({
  rightContent: {
    width: '100%',
    minHeight: height * 1.2,
    maxWidth: width > 768 ? 700 : '100%', // 恢复原来的最大宽度
    alignSelf: 'center', // 恢复居中对齐
    paddingTop: width > 768 ? 90 : 60,
    // 移除右侧内边距，让内容保持居中
  },
});

export const loadingStyles = StyleSheet.create({
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  loadingSpinner: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingEmoji: {
    fontSize: 48,
  },
});