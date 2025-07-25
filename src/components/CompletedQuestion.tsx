import React from 'react';
import { View, Text, Image, Animated, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { questionStyles, avatarStyles, answerStyles } from '../styles/globalStyles';
import type { Answer } from '../types';

interface CompletedQuestionProps {
  question: string;
  answer: Answer;
  index: number;
  questionAnimation: Animated.Value;
  answerAnimation: Animated.Value;
  onEdit: () => void;
  formatAnswerDisplay: (answer: Answer) => string;
}

export const CompletedQuestion: React.FC<CompletedQuestionProps> = ({
  question,
  answer,
  index,
  questionAnimation,
  answerAnimation,
  onEdit,
  formatAnswerDisplay,
}) => {
  return (
    <Animated.View 
      key={index} 
      style={[
        questionStyles.completedQuestionContainer,
        {
          opacity: questionAnimation,
          transform: [{
            translateY: questionAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            }),
          }],
        },
      ]}
    >
      <View style={questionStyles.completedQuestionRow}>
        <View style={questionStyles.questionHeader}>
          <View style={avatarStyles.avatarSimple}>
            <Image 
              source={require('../../assets/icon.png')} 
              style={avatarStyles.avatarImage}
            />
          </View>
          <Text style={questionStyles.questionText}>
            {question}
          </Text>
        </View>
        
        <Animated.View 
          style={[
            answerStyles.completedAnswerText,
            {
              opacity: answerAnimation,
              transform: [{
                scale: answerAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.95, 1],
                }),
              }],
            },
          ]}
        >
          <View 
            style={answerStyles.answerWithEdit}
          >
            <Text style={answerStyles.answerValue}>
              {formatAnswerDisplay(answer)}
            </Text>
            <TouchableOpacity 
              onPress={onEdit}
              style={answerStyles.editAnswerButton}
            >
              <MaterialIcons name="edit" size={22} color="#4B5563" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Animated.View>
  );
};