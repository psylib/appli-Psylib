/**
 * Chat screen — FlatList inverted, KeyboardAvoidingView, message bubbles
 */
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useMessages, useSendMessage } from '@/hooks/useMessaging';
import { useAuthStore } from '@/store/auth.store';

function MessageBubble({
  content,
  createdAt,
  isMine,
}: {
  content: string;
  createdAt: string;
  isMine: boolean;
}) {
  const time = new Date(createdAt);
  const timeStr = `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`;

  return (
    <View style={[styles.bubbleContainer, isMine ? styles.bubbleRight : styles.bubbleLeft]}>
      <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
        <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>{content}</Text>
        <Text style={[styles.bubbleTime, isMine && styles.bubbleTimeMine]}>{timeStr}</Text>
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { psychologistId } = useAuthStore();
  const { data: messages } = useMessages(id ?? '');
  const sendMessage = useSendMessage(id ?? '');
  const [text, setText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMessage.mutate(trimmed);
    setText('');
  };

  // Reverse for inverted FlatList
  const reversedMessages = [...(messages ?? [])].reverse();

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatListRef}
          data={reversedMessages}
          keyExtractor={(item) => item.id}
          inverted
          renderItem={({ item }) => (
            <MessageBubble
              content={item.content}
              createdAt={item.createdAt}
              isMine={item.senderId === psychologistId}
            />
          )}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
        />

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            value={text}
            onChangeText={setText}
            placeholder="Ecrire un message..."
            placeholderTextColor={Colors.mutedLight}
            multiline
            maxLength={2000}
          />
          <TouchableOpacity
            style={[styles.sendButton, !text.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || sendMessage.isPending}
            accessibilityLabel="Envoyer"
          >
            <Text style={styles.sendIcon}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  messagesList: { padding: 16, gap: 8 },
  bubbleContainer: { maxWidth: '80%' },
  bubbleRight: { alignSelf: 'flex-end' },
  bubbleLeft: { alignSelf: 'flex-start' },
  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, gap: 4 },
  bubbleMine: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleTheirs: {
    backgroundColor: Colors.surfaceElevated, borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: Colors.border,
  },
  bubbleText: { fontSize: 15, color: Colors.text, lineHeight: 20 },
  bubbleTextMine: { color: '#FFF' },
  bubbleTime: { fontSize: 11, color: Colors.muted, alignSelf: 'flex-end' },
  bubbleTimeMine: { color: 'rgba(255,255,255,0.7)' },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', padding: 12, gap: 8,
    borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.surfaceElevated,
  },
  textInput: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: Colors.text,
    maxHeight: 100, fontFamily: 'DMSans_400Regular',
  },
  sendButton: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  sendButtonDisabled: { backgroundColor: Colors.mutedLight },
  sendIcon: { color: '#FFF', fontSize: 18, fontWeight: '700' },
});
