import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

interface ChatBubbleProps {
  message: string;
  isUser: boolean;
  imageUri?: string; // local URI or base64 data URI
}

export default function ChatBubble({ message, isUser, imageUri }: ChatBubbleProps) {
  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.aiContainer]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
        ) : null}
        {message ? (
          <Text style={[styles.text, imageUri ? styles.textWithImage : null]}>{message}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginVertical: 4,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  aiContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 18,
    overflow: 'hidden',
  },
  userBubble: {
    backgroundColor: '#7C3AED',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#2A2A3C',
    borderBottomLeftRadius: 4,
  },
  image: {
    width: 220,
    height: 180,
    borderRadius: 14,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 21,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  textWithImage: {
    paddingTop: 6,
  },
});
