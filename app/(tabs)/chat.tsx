import Constants from 'expo-constants';
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

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { usePersistentConversation } from '@/hooks/use-persistent-conversation';

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

const resolveExpoHost = () => {
  const extractHost = (raw?: string | null) => {
    if (!raw) {
      return null;
    }

    try {
      const value = raw.includes('://') ? raw : `http://${raw}`;
      return new URL(value).hostname;
    } catch {
      return null;
    }
  };

  const candidates = [
    Constants.expoConfig?.extra?.expoGo?.debuggerHost,
    Constants.manifest2?.extra?.expoGo?.debuggerHost,
    Constants.manifest?.debuggerHost,
    Constants.expoConfig?.hostUri,
    Constants.expoConfig?.extra?.expoGo?.hostUri,
    Constants.manifest2?.extra?.expoGo?.hostUri,
    Constants.manifest?.hostUri,
  ];

  for (const candidate of candidates) {
    const host = extractHost(candidate);

    if (host) {
      return host;
    }
  }

  return null;
};

const CHAT_ENDPOINT = (() => {
  if (process.env.EXPO_OS === 'web') {
    return '/api/chat';
  }

  const envBaseUrl =
    process.env.EXPO_PUBLIC_CHAT_BASE_URL ??
    process.env.EXPO_PUBLIC_API_BASE_URL ??
    process.env.EXPO_PUBLIC_SITE_URL ??
    Constants.expoConfig?.extra?.chatBaseUrl ??
    Constants.expoConfig?.extra?.apiBaseUrl ??
    Constants.manifest2?.extra?.chatBaseUrl ??
    Constants.manifest2?.extra?.apiBaseUrl ??
    Constants.manifest?.extra?.chatBaseUrl ??
    Constants.manifest?.extra?.apiBaseUrl ??
    '';

  if (envBaseUrl) {
    return new URL('/api/chat', envBaseUrl).toString();
  }

  const host = resolveExpoHost();

  if (host) {
    return `http://${host}:4280/api/chat`;
  }

  return null;
})();

export default function ChatScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const { messages, setMessages, conversationId, setConversationId, isHydrated } =
    usePersistentConversation<ChatMessage>({
      storageKey: 'companion-chat',
      initialMessages: INITIAL_MESSAGES,
      autoGenerateConversationId: true,
    });
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const palette = Colors[colorScheme];

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();

    if (!trimmed || !isHydrated) {
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

    if (!conversationId) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-assistant-error`,
          role: 'assistant',
          content:
            'Não foi possível iniciar a conversa localmente. Reabra o aplicativo e tente novamente.',
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
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          userMessage: trimmed,
          systemPrompt: SYSTEM_PROMPT,
          temperature: 0.6,
          agent: 'companion-chat',
        }),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        const message =
          errorPayload?.error?.message ?? 'Não foi possível obter uma resposta no momento.';
        throw new Error(message);
      }

      const data: {
        message?: { content?: string } | string;
        conversationId?: string;
      } = await response.json();

      const assistantText =
        typeof data?.message === 'string'
          ? data.message.trim()
          : data?.message?.content?.trim();

      if (!assistantText) {
        throw new Error('A resposta da IA veio vazia. Tente novamente em instantes.');
      }

      const assistantMessage: ChatMessage = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: assistantText,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (typeof data.conversationId === 'string' && data.conversationId.trim().length > 0) {
        setConversationId(data.conversationId.trim());
      }
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
  }, [conversationId, input, isHydrated, setConversationId, setMessages]);

  const renderMessage = useCallback(
    ({ item }: { item: ChatMessage }) => {
      const isUser = item.role === 'user';
      const backgroundColor = isUser
        ? colorScheme === 'dark'
          ? '#2563eb'
          : palette.tint
        : colorScheme === 'dark'
          ? '#1f2937'
          : '#f1f5f9';
      const textColor = isUser
        ? '#fff'
        : colorScheme === 'dark'
          ? '#e2e8f0'
          : palette.text;

      return (
        <View style={[styles.messageWrapper, isUser ? styles.messageRight : styles.messageLeft]}>
          <View style={[styles.messageBubble, { backgroundColor }]}> 
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

  const screenBackground = colorScheme === 'dark' ? '#0f172a' : palette.background;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: screenBackground }}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: screenBackground }}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
        <ThemedView style={[styles.container, { backgroundColor: screenBackground }]}>
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
                borderTopColor: colorScheme === 'dark' ? '#1f2937' : '#cbd5f5',
                backgroundColor: colorScheme === 'dark' ? '#0f172a' : palette.background,
              },
            ]}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Escreva sua pergunta ou pedido de oração..."
              placeholderTextColor={colorScheme === 'dark' ? '#64748b' : '#94a3b8'}
              style={[
                styles.textInput,
                {
                  borderColor: colorScheme === 'dark' ? '#1f2937' : '#cbd5f5',
                  backgroundColor: colorScheme === 'dark' ? '#111827' : '#fff',
                  color: colorScheme === 'dark' ? '#f8fafc' : palette.text,
                },
              ]}
              multiline
            />
            <Pressable
              accessibilityRole="button"
              onPress={sendMessage}
              disabled={isSending || !isHydrated}
              style={({ pressed }) => [
                styles.sendButton,
                {
                  backgroundColor: isSending || !isHydrated
                    ? colorScheme === 'dark'
                      ? '#1d4ed8'
                      : '#94a3b8'
                    : colorScheme === 'dark'
                      ? '#2563eb'
                      : palette.tint,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}>
              {isSending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText
                  style={[
                    styles.sendButtonText,
                    { color: colorScheme === 'dark' ? '#f8fafc' : '#fff' },
                  ]}>
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
  },
  list: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 24,
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
    borderTopColor: '#cbd5f5',
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
    backgroundColor: '#fff',
    textAlignVertical: 'top',
  },
  sendButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 14,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
