import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { SaintJosephLily } from '@/components/saint-joseph-lily';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useModelSettings } from '@/contexts/model-settings-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { resolveChatEndpoint } from '@/utils/chat-endpoint';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'welcome',
    role: 'assistant',
    content:
      'Paz e bem! Sou seu acompanhante espiritual digital. Posso sugerir orações, indicar novenas, explicar trechos da liturgia e orientar estudos católicos conforme o magistério da Igreja.',
  },
];

const SYSTEM_PROMPT = `Você é um assistente católico chamado "Companheiro de Fé". Responda sempre com fidelidade ao magistério da Igreja, cite referências litúrgicas quando possível e ofereça sugestões de orações, novenas, terços e estudos de aprofundamento. Traga indicações pastorais com tom acolhedor e respeitoso.`;

const CHAT_ENDPOINT = resolveChatEndpoint();

export default function ChatScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const palette = Colors[colorScheme];
  const { chatModel } = useModelSettings();

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();

    if (!trimmed) {
      return;
    }
    
    const endpoint = CHAT_ENDPOINT;

    if (!endpoint) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-assistant-error`,
          role: 'assistant',
          content:
            'Não foi possível iniciar a conversa. Verifique a configuração da variável EXPO_PUBLIC_CHAT_BASE_URL e tente novamente.',
        },
      ]);
      return;
    }

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsSending(true);

    try {
      const payloadMessages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.map((message) => ({ role: message.role, content: message.content })),
        { role: 'user', content: trimmed },
      ];

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: payloadMessages,
          temperature: 0.6,
          model: chatModel,
        }),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        const message =
          errorPayload?.error?.message ?? 'Não foi possível obter uma resposta no momento.';
        throw new Error(message);
      }

      const data: {
        choices?: { message?: { content?: string } }[];
      } = await response.json();

      const assistantText = data.choices?.[0]?.message?.content?.trim();

      if (!assistantText) {
        throw new Error('A resposta da IA veio vazia. Tente novamente em instantes.');
      }

      const assistantMessage: ChatMessage = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: assistantText,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (sendError) {
      const friendlyMessage =
        sendError instanceof Error
          ? sendError.message
          : 'Ocorreu um erro inesperado ao contatar a IA.';
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-assistant-error`,
          role: 'assistant',
          content:
            'Enfrentei um problema ao tentar responder. Confira sua conexão e tente novamente em instantes.',
        },
        {
          id: `${Date.now()}-assistant-error-detail`,
          role: 'assistant',
          content: friendlyMessage,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }, [chatModel, input, messages]);

  const renderMessage = useCallback(
    ({ item }: { item: ChatMessage }) => {
      const isUser = item.role === 'user';
      const backgroundColor = isUser ? palette.tint : palette.surface;
      const textColor = isUser ? '#fff' : palette.text;
      const bubbleBorder = isUser ? `${palette.tint}70` : `${palette.border}99`;

      return (
        <View style={[styles.messageWrapper, isUser ? styles.messageRight : styles.messageLeft]}>
          <View style={[styles.messageBubble, { backgroundColor, borderColor: bubbleBorder }] }>
            <ThemedText style={[styles.messageAuthor, { color: textColor }]} type="defaultSemiBold">
              {isUser ? 'Você' : 'Companheiro de Fé'}
            </ThemedText>
            <ThemedText style={[styles.messageContent, { color: textColor }]}>
              {item.content}
            </ThemedText>
          </View>
        </View>
      );
    },
    [colorScheme, palette]
  );

  const screenBackground = palette.background;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: screenBackground }}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: screenBackground }}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
        <ThemedView style={[styles.container, { backgroundColor: screenBackground }]}>
          <SaintJosephLily size={220} opacity={0.12} style={styles.lilyTop} pointerEvents="none" />
          <SaintJosephLily size={180} opacity={0.1} style={styles.lilyBottom} pointerEvents="none" />
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            keyboardShouldPersistTaps="handled"
          />
          <View
            style={[
              styles.inputContainer,
              {
                borderTopColor: `${palette.border}80`,
                backgroundColor: palette.background,
              },
            ]}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Escreva sua pergunta ou pedido de oração..."
              placeholderTextColor={colorScheme === 'dark' ? '#8C96D1' : '#7D84B8'}
              style={[
                styles.textInput,
                {
                  borderColor: `${palette.border}A6`,
                  backgroundColor: palette.surface,
                  color: palette.text,
                },
              ]}
              multiline
            />
            <Pressable
              accessibilityRole="button"
              onPress={sendMessage}
              disabled={isSending}
              style={({ pressed }) => [
                styles.sendButton,
                {
                  backgroundColor: isSending ? `${palette.tint}66` : palette.tint,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}>
              {isSending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.sendButtonText}>
                  Enviar
                </ThemedText>
              )}
            </Pressable>
          </View>
        </ThemedView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  list: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  messageLeft: {
    justifyContent: 'flex-start',
  },
  messageRight: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '85%',
    gap: 4,
    borderWidth: 1,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  messageAuthor: {
    fontSize: 14,
    letterSpacing: 0.3,
  },
  messageContent: {
    fontSize: 16,
    lineHeight: 22,
  },
  inputContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: 'transparent',
  },
  textInput: {
    minHeight: 60,
    maxHeight: 140,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  sendButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 14,
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  lilyTop: {
    position: 'absolute',
    top: -60,
    right: -40,
  },
  lilyBottom: {
    position: 'absolute',
    bottom: -80,
    left: -20,
    transform: [{ scaleX: -1 }],
  },
});
