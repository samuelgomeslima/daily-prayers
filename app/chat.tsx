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
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { HolySpiritSymbol } from '@/components/holy-spirit-symbol';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useModelSettings } from '@/contexts/model-settings-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { resolveChatEndpoint } from '@/utils/chat-endpoint';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type SupabaseChatRow = {
  id: string;
  role: string | null;
  content: string | null;
  created_at?: string | null;
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

function mapChatRow(row: SupabaseChatRow): ChatMessage | null {
  const role = row.role === 'user' || row.role === 'assistant' ? row.role : null;

  if (!role || typeof row.id !== 'string') {
    return null;
  }

  const content = typeof row.content === 'string' ? row.content : '';

  return {
    id: row.id,
    role,
    content,
  };
}

export default function ChatScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const typingMessageIdRef = useRef<string | null>(null);

  const palette = Colors[colorScheme];
  const { chatModel } = useModelSettings();
  const { user } = useAuth();
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!user) {
      setMessages(INITIAL_MESSAGES);
      setIsHistoryLoading(false);
      return () => {
        isMounted = false;
      };
    }

    const loadHistory = async () => {
      setIsHistoryLoading(true);

      try {
        const rows = await supabase.fetchChatMessages(user.id);

        if (!isMounted) {
          return;
        }

        if (!rows.length) {
          setMessages(INITIAL_MESSAGES);
        } else {
          const mapped = rows
            .map((row) => mapChatRow(row as SupabaseChatRow))
            .filter((row): row is ChatMessage => Boolean(row));
          setMessages(mapped.length ? mapped : INITIAL_MESSAGES);
        }

        setSyncError(null);
      } catch (error) {
        console.error('Não foi possível carregar o histórico de chat.', error);
        if (isMounted) {
          setMessages(INITIAL_MESSAGES);
          setSyncError('Falha ao sincronizar o histórico com o Supabase.');
        }
      } finally {
        if (isMounted) {
          setIsHistoryLoading(false);
        }
      }
    };

    void loadHistory();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();

    if (!trimmed) {
      return;
    }

    if (!user) {
      setSyncError('É necessário estar autenticado para conversar com a IA.');
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

    const cleanedMessages = messages.filter((message) => !message.id.endsWith('-assistant-typing'));
    const previousTypingId = typingMessageIdRef.current;
    let typingId: string | null = null;

    setIsSending(true);

    try {
      const insertedUser = await supabase.insertChatMessage(user.id, 'user', trimmed);

      if (!insertedUser) {
        throw new Error('Não foi possível registrar sua mensagem no Supabase.');
      }

      const mappedUser = mapChatRow(insertedUser as SupabaseChatRow);

      if (!mappedUser) {
        throw new Error('A mensagem retornada pelo Supabase é inválida.');
      }

      const historyForPayload = [...cleanedMessages, mappedUser];

      typingId = `${Date.now()}-assistant-typing`;
      const typingMessage: ChatMessage = {
        id: typingId,
        role: 'assistant',
        content: 'Digitando...',
      };

      setMessages((prev) => {
        const withoutPreviousTyping = previousTypingId
          ? prev.filter((message) => message.id !== previousTypingId)
          : prev;

        return [...historyForPayload, typingMessage];
      });
      typingMessageIdRef.current = typingId;
      setInput('');
      const payloadMessages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...historyForPayload.map((message) => ({ role: message.role, content: message.content })),
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

      try {
        const insertedAssistant = await supabase.insertChatMessage(user.id, 'assistant', assistantText);
        const persistedAssistant = insertedAssistant ? mapChatRow(insertedAssistant as SupabaseChatRow) : null;
        const finalAssistant = persistedAssistant ?? assistantMessage;

        setMessages((prev) => [
          ...prev.filter((message) => message.id !== typingId),
          finalAssistant,
        ]);
        setSyncError(null);
      } catch (persistError) {
        console.error('Não foi possível salvar a resposta do assistente no Supabase.', persistError);
        setMessages((prev) => [
          ...prev.filter((message) => message.id !== typingId),
          assistantMessage,
        ]);
        setSyncError('Não foi possível salvar a resposta do assistente no Supabase.');
      }

      if (typingMessageIdRef.current === typingId) {
        typingMessageIdRef.current = null;
      }
    } catch (sendError) {
      const friendlyMessage =
        sendError instanceof Error
          ? sendError.message
          : 'Ocorreu um erro inesperado ao contatar a IA.';
      setMessages((prev) => [
        ...prev.filter((message) => (typingId ? message.id !== typingId : message.id !== previousTypingId)),
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
      if (typingId && typingMessageIdRef.current === typingId) {
        typingMessageIdRef.current = null;
      } else if (previousTypingId && typingMessageIdRef.current === previousTypingId) {
        typingMessageIdRef.current = null;
      }
      setSyncError(friendlyMessage);
    } finally {
      setIsSending(false);
    }
  }, [chatModel, input, messages, user]);

  const renderMessage = useCallback(
    ({ item }: { item: ChatMessage }) => {
      const isUser = item.role === 'user';
      const backgroundColor = isUser ? palette.tint : palette.surface;
      const textColor = isUser ? '#fff' : palette.text;
      const bubbleBorder = isUser ? `${palette.tint}70` : `${palette.border}99`;

      const isTypingPlaceholder = item.id.endsWith('-assistant-typing');

      return (
        <View style={[styles.messageWrapper, isUser ? styles.messageRight : styles.messageLeft]}>
          <View style={[styles.messageBubble, { backgroundColor, borderColor: bubbleBorder }] }>
            <ThemedText style={[styles.messageAuthor, { color: textColor }]} type="defaultSemiBold">
              {isUser ? 'Você' : 'Companheiro de Fé'}
            </ThemedText>
            {isTypingPlaceholder ? (
              <View style={styles.typingRow}>
                <ActivityIndicator size="small" color={isUser ? '#fff' : palette.tint} />
                <ThemedText style={[styles.messageContent, { color: textColor }]}>
                  {item.content}
                </ThemedText>
              </View>
            ) : (
              <ThemedText style={[styles.messageContent, { color: textColor }]}>
                {item.content}
              </ThemedText>
            )}
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
          <HolySpiritSymbol size={220} opacity={0.12} style={styles.symbolTop} pointerEvents="none" />
          <HolySpiritSymbol size={180} opacity={0.1} style={styles.symbolBottom} pointerEvents="none" />
          {isHistoryLoading ? (
            <View style={styles.historyLoading}>
              <ActivityIndicator size="small" color={palette.tint} />
              <ThemedText style={[styles.historyLoadingText, { color: palette.icon }]}>
                Sincronizando mensagens salvas...
              </ThemedText>
            </View>
          ) : null}
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
            {syncError ? (
              <ThemedText
                style={[
                  styles.syncAlert,
                  { color: colorScheme === 'dark' ? '#FCA5A5' : '#B91C1C' },
                ]}
              >
                {syncError}
              </ThemedText>
            ) : null}
            <View style={styles.inputRow}>
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
                editable={!isHistoryLoading}
                multiline
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Enviar mensagem"
                accessibilityHint="Toque duas vezes para enviar sua mensagem."
                onPress={sendMessage}
                disabled={isSendDisabled}
                style={({ pressed }) => [
                  styles.sendButton,
                  {
                    backgroundColor: isSendDisabled ? `${palette.tint}66` : palette.tint,
                    opacity: pressed && !isSendDisabled ? 0.9 : 1,
                  },
                ]}>
                {isSending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <MaterialIcons name="arrow-forward" size={24} color="#fff" />
                )}
              </Pressable>
            </View>
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
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: 'transparent',
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  textInput: {
    flex: 1,
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
    borderRadius: 999,
    width: 52,
    height: 52,
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  syncAlert: {
    fontSize: 13,
    fontWeight: '600',
  },
  historyLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  historyLoadingText: {
    fontSize: 13,
  },
  symbolTop: {
    position: 'absolute',
    top: -60,
    right: -40,
  },
  symbolBottom: {
    position: 'absolute',
    bottom: -80,
    left: -20,
    transform: [{ scaleX: -1 }],
  },
});
