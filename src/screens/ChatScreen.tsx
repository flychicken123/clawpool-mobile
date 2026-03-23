import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import type { StackNavigationProp } from '@react-navigation/stack';
import ChatBubble from '../components/ChatBubble';
import { sendMessage } from '../services/api';

type Message = {
  id: string;
  text: string;
  isUser: boolean;
  imageUri?: string;
};

type Props = {
  navigation: StackNavigationProp<any>;
};

export default function ChatScreen({ navigation }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [pendingImage, setPendingImage] = useState<{ uri: string; base64: string; mimeType: string } | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const nextId = useRef(0);

  const genId = () => String(nextId.current++);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setPendingImage({
        uri: asset.uri,
        base64: asset.base64 || '',
        mimeType: asset.mimeType || 'image/jpeg',
      });
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setPendingImage({
        uri: asset.uri,
        base64: asset.base64 || '',
        mimeType: asset.mimeType || 'image/jpeg',
      });
    }
  };

  const handleAttach = () => {
    Alert.alert('Add Image', 'Choose a source', [
      { text: 'Camera', onPress: takePhoto },
      { text: 'Photo Library', onPress: pickImage },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSend = async () => {
    const text = input.trim();
    if ((!text && !pendingImage) || sending) return;

    setError('');
    const userMsg: Message = {
      id: genId(),
      text,
      isUser: true,
      imageUri: pendingImage?.uri,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    const imgToSend = pendingImage;
    setPendingImage(null);
    setSending(true);

    try {
      const res = await sendMessage(text, imgToSend?.base64, imgToSend?.mimeType);
      const aiMsg: Message = { id: genId(), text: res.reply, isUser: false };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (e: any) {
      if (e.status === 402) {
        Alert.alert(
          'Trial Ended',
          'Your free trial has ended. Upgrade to continue chatting.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Upgrade Now', onPress: () => navigation.navigate('Plans') },
          ],
        );
      } else if (e.status === 503 || (e.message && e.message.includes('set up'))) {
        setError('Your AI is still starting up. Please wait a moment and try again.');
      } else {
        setError(e.message || 'Failed to send message');
      }
    } finally {
      setSending(false);
    }
  };

  const canSend = (input.trim().length > 0 || pendingImage !== null) && !sending;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My AI</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.headerAction}>{'\u2699'}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatBubble message={item.text} isUser={item.isUser} imageUri={item.imageUri} />
          )}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Say hello to your AI assistant!</Text>
            </View>
          }
        />

        {sending && (
          <View style={styles.typingContainer}>
            <View style={styles.typingBubble}>
              <Text style={styles.typingDots}>{'\u2022 \u2022 \u2022'}</Text>
            </View>
          </View>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* Image preview */}
        {pendingImage && (
          <View style={styles.imagePreviewBar}>
            <Image source={{ uri: pendingImage.uri }} style={styles.imagePreview} />
            <TouchableOpacity style={styles.removeImage} onPress={() => setPendingImage(null)}>
              <Text style={styles.removeImageText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputBar}>
          {/* Attach button */}
          <TouchableOpacity style={styles.attachButton} onPress={handleAttach}>
            <Text style={styles.attachIcon}>📎</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder={pendingImage ? 'Add a caption...' : 'Message...'}
            placeholderTextColor="#6B6B80"
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={4000}
          />
          <TouchableOpacity
            style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!canSend}
          >
            <Text style={styles.sendIcon}>{'\u2191'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A' },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E2E',
  },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  headerAction: { color: '#A0A0B8', fontSize: 22 },
  messageList: { paddingVertical: 12, flexGrow: 1 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 120 },
  emptyText: { color: '#6B6B80', fontSize: 16 },
  typingContainer: { paddingHorizontal: 16, paddingBottom: 4 },
  typingBubble: {
    backgroundColor: '#2A2A3C',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },
  typingDots: { color: '#A0A0B8', fontSize: 18, letterSpacing: 2 },
  error: { color: '#EF4444', fontSize: 13, paddingHorizontal: 16, paddingBottom: 4 },
  imagePreviewBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#1E1E2E',
  },
  imagePreview: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#2A2A3C',
  },
  removeImage: {
    marginLeft: 8,
    backgroundColor: '#3A3A4E',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#1E1E2E',
  },
  attachButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  attachIcon: { fontSize: 20 },
  input: {
    flex: 1,
    backgroundColor: '#1E1E2E',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    color: '#FFFFFF',
    fontSize: 16,
    maxHeight: 120,
  },
  sendButton: {
    backgroundColor: '#7C3AED',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: { backgroundColor: '#3A3A4E' },
  sendIcon: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
});
