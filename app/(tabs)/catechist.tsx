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
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { HolySpiritSymbol } from '@/components/holy-spirit-symbol';
import { RestrictedFeature } from '@/components/restricted-feature';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useModelSettings } from '@/contexts/model-settings-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type CatechistResponse = {
  id?: string;
  conversation?: { id?: string } | null;
  conversation_id?: string;
  finalOutput?: string;
  output?:
    | null
    | {
        type?: string;
        role?: string;
        content?:
          | null
          | {
              type?: string;
              text?: string;
              value?: string;
            }[];
        text?: string;
      }[];
  output_text?: string;
  response?: {
    conversation_id?: string;
    output_text?: string;
  };
};

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'welcome',
    role: 'assistant',
    content:
      'Paz e bem! Sou o Assistente Catequista, treinado com base nos livros “A Fé Explicada”, “Teologia do Corpo”, “História de uma Alma” e “Os 4 Temperamentos no Amor”. Faça suas perguntas sobre a fé católica e indique como deseja aprofundar seus estudos.',
  },
];

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

const createApiEndpoint = (path: string) => {
  if (process.env.EXPO_OS === 'web') {
    return path;
  }

  const envBaseUrl =
    process.env.EXPO_PUBLIC_CATECHIST_BASE_URL ??
    process.env.EXPO_PUBLIC_CHAT_BASE_URL ??
    process.env.EXPO_PUBLIC_API_BASE_URL ??
    process.env.EXPO_PUBLIC_SITE_URL ??
    Constants.expoConfig?.extra?.catechistBaseUrl ??
    Constants.expoConfig?.extra?.chatBaseUrl ??
    Constants.expoConfig?.extra?.apiBaseUrl ??
    Constants.manifest2?.extra?.catechistBaseUrl ??
    Constants.manifest2?.extra?.chatBaseUrl ??
    Constants.manifest2?.extra?.apiBaseUrl ??
    Constants.manifest?.extra?.catechistBaseUrl ??
    Constants.manifest?.extra?.chatBaseUrl ??
    Constants.manifest?.extra?.apiBaseUrl ??
    '';

  if (envBaseUrl) {
    return new URL(path, envBaseUrl).toString();
  }

  const host = resolveExpoHost();

  if (!host) {
    return null;
  }

  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    return `http://127.0.0.1:4280${path}`;
  }

  return `http://${host}:4280${path}`;
};

const CATECHIST_ENDPOINT = createApiEndpoint('/api/catechist-agent');

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const RETRY_DELAYS_MS = [750, 1500];
const MAX_REQUEST_ATTEMPTS = RETRY_DELAYS_MS.length + 1;

type RetryableError = Error & { retryable?: boolean; status?: number };

const isRetryableError = (error: unknown) => {
  if (!error) {
    return false;
  }

  if (typeof error === 'object' && error !== null) {
    const retryable = (error as RetryableError).retryable;

    if (typeof retryable === 'boolean') {
      return retryable;
    }

    const status = (error as RetryableError).status;

    if (typeof status === 'number') {
      return status >= 500 || status === 429;
    }
  }

  if (error instanceof TypeError) {
    return true;
  }

  const message = error instanceof Error ? error.message : String(error);

  if (/timeout/i.test(message)) {
    return true;
  }

  return false;
};

const mapErrorToFriendlyMessage = (error: unknown) => {
  if (!error) {
    return 'Não consegui responder desta vez. Tente novamente em instantes.';
  }

  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  if (normalized.includes('unable to contact the catechist agent')) {
    return 'O Assistente Catequista está indisponível no momento. Tente novamente em instantes.';
  }

  if (normalized.includes('a resposta do assistente catequista veio vazia')) {
    return 'Não consegui concluir a resposta agora. Vou continuar aqui quando você tentar novamente.';
  }

  if (normalized.includes('must include a non-empty "input_as_text"')) {
    return 'Não recebi nenhuma pergunta. Escreva sua dúvida para que eu possa ajudar.';
  }

  if (normalized.includes('não foi possível obter uma resposta')) {
    return 'O Assistente Catequista não conseguiu responder agora. Vamos tentar novamente em instantes.';
  }

  if (normalized.includes('failed to fetch') || normalized.includes('network request failed')) {
    return 'Não consegui me conectar agora. Verifique sua conexão com a internet e tente de novo.';
  }

  if (normalized.includes('timeout') || normalized.includes('tempo esgotado')) {
    return 'O Assistente está demorando para responder. Tente fazer sua pergunta outra vez.';
  }

  return 'Não consegui responder desta vez. Tente novamente em instantes.';
};

const extractAssistantText = (payload: CatechistResponse) => {
  if (!payload) {
    return null;
  }

  const textSegments: string[] = [];
  const pushSegment = (value?: string | null) => {
    if (typeof value !== 'string') {
      return;
    }

    const trimmed = value.trim();

    if (trimmed.length === 0) {
      return;
    }

    textSegments.push(trimmed);
  };

  pushSegment(payload.finalOutput);

  if (Array.isArray(payload.output)) {
    for (const segment of payload.output) {
      if (segment?.type === 'message' && Array.isArray(segment.content)) {
        for (const content of segment.content) {
          if (typeof content?.text === 'string') {
            pushSegment(content.text);
          } else if (typeof content?.value === 'string') {
            pushSegment(content.value);
          }
        }
      } else if (typeof segment?.text === 'string') {
        pushSegment(segment.text);
      }
    }
  }

  if (textSegments.length > 0) {
    const uniqueSegments: string[] = [];
    const seen = new Set<string>();

    for (const segment of textSegments) {
      const normalized = segment.replace(/\s+/g, ' ');

      if (seen.has(normalized)) {
        continue;
      }

      seen.add(normalized);
      uniqueSegments.push(segment);
    }

    if (uniqueSegments.length > 0) {
      return uniqueSegments.join('\n');
    }
  }

  if (typeof payload.output_text === 'string' && payload.output_text.trim().length > 0) {
    return payload.output_text.trim();
  }

  if (typeof payload.response?.output_text === 'string' && payload.response.output_text.trim().length > 0) {
    return payload.response.output_text.trim();
  }

  return null;
};

const extractConversationId = (payload: CatechistResponse) => {
  return (
    payload?.conversation?.id ??
    payload?.conversation_id ??
    payload?.response?.conversation_id ??
    null
  );
};

export default function CatechistScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const typingMessageIdRef = useRef<string | null>(null);

  const palette = Colors[colorScheme];
  const { catechistModel } = useModelSettings();

  const sendMessageFromText = useCallback(
    async (rawText: string) => {
      const trimmed = rawText.trim();

      if (!trimmed) {
        return false;
      }

      const endpoint = CATECHIST_ENDPOINT;

      if (!endpoint) {
        setMessages((prev) => [
          ...prev,
          {
            id: `${Date.now()}-assistant-error`,
            role: 'assistant',
            content:
              'Não foi possível iniciar a conversa. Verifique as variáveis EXPO_PUBLIC_CATECHIST_BASE_URL ou EXPO_PUBLIC_CHAT_BASE_URL antes de tentar novamente.',
          },
        ]);
        return false;
      }

      const userMessage: ChatMessage = {
        id: `${Date.now()}-user`,
        role: 'user',
        content: trimmed,
      };

      const typingId = `${Date.now()}-assistant-typing`;
      const typingMessage: ChatMessage = {
        id: typingId,
        role: 'assistant',
        content: 'Digitando...',
      };

      const previousTypingId = typingMessageIdRef.current;

      setMessages((prev) => {
        const withoutPreviousTyping = previousTypingId
          ? prev.filter((message) => message.id !== previousTypingId)
          : prev;

        return [...withoutPreviousTyping, userMessage, typingMessage];
      });
      typingMessageIdRef.current = typingId;
      setIsSending(true);

      try {
        const attemptRequest = async (): Promise<CatechistResponse> => {
          let lastError: unknown = null;

          for (let attempt = 0; attempt < MAX_REQUEST_ATTEMPTS; attempt += 1) {
            try {
              const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  input_as_text: trimmed,
                  conversationId: conversationId ?? undefined,
                  model: catechistModel,
                }),
              });

              if (!response.ok) {
                let message = 'Não foi possível obter uma resposta do Assistente Catequista no momento.';
                let errorPayload: unknown = null;

                try {
                  errorPayload = await response.json();
                } catch {
                  // ignore parsing errors
                }

                if (
                  errorPayload &&
                  typeof errorPayload === 'object' &&
                  errorPayload !== null &&
                  typeof (errorPayload as { error?: { message?: unknown } }).error?.message === 'string'
                ) {
                  message = ((errorPayload as { error?: { message?: string } }).error?.message ?? message).trim();
                }

                const httpError = new Error(message) as RetryableError;
                httpError.retryable = response.status >= 500 || response.status === 429;
                httpError.status = response.status;
                throw httpError;
              }

              const data: CatechistResponse = await response.json();
              return data;
            } catch (requestError) {
              lastError = requestError;
              const shouldRetry = isRetryableError(requestError);

              if (attempt < MAX_REQUEST_ATTEMPTS - 1 && shouldRetry) {
                const delay = RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)];
                await sleep(delay);
                continue;
              }

              break;
            }
          }

          if (lastError) {
            throw lastError;
          }

          throw new Error('Não foi possível obter uma resposta do Assistente Catequista no momento.');
        };

        const data = await attemptRequest();
        const assistantText = extractAssistantText(data);

        if (!assistantText) {
          throw new Error('A resposta do Assistente Catequista veio vazia. Tente novamente em instantes.');
        }

        const assistantMessage: ChatMessage = {
          id: `${Date.now()}-assistant`,
          role: 'assistant',
          content: assistantText,
        };

        setMessages((prev) => [
          ...prev.filter((message) => message.id !== typingId),
          assistantMessage,
        ]);

        if (typingMessageIdRef.current === typingId) {
          typingMessageIdRef.current = null;
        }

        const newConversationId = extractConversationId(data);
        if (newConversationId) {
          setConversationId(newConversationId);
        }

        return true;
      } catch (sendError) {
        const friendlyMessage = mapErrorToFriendlyMessage(sendError);
        const detailMessage =
          sendError instanceof Error
            ? sendError.message
            : 'Ocorreu um erro inesperado ao contatar o Assistente Catequista.';

        setMessages((prev) => {
          const baseMessages: ChatMessage[] = [
            ...prev.filter((message) => message.id !== typingId),
            {
              id: `${Date.now()}-assistant-error`,
              role: 'assistant',
              content: friendlyMessage,
            },
          ];

          if (__DEV__ && detailMessage && detailMessage !== friendlyMessage) {
            baseMessages.push({
              id: `${Date.now()}-assistant-error-detail`,
              role: 'assistant',
              content: detailMessage,
            });
          }

          return baseMessages;
        });
        if (typingMessageIdRef.current === typingId) {
          typingMessageIdRef.current = null;
        }
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [catechistModel, conversationId]
  );

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();

    if (!trimmed) {
      return;
    }

    setInput('');
    await sendMessageFromText(trimmed);
  }, [input, sendMessageFromText]);

  const isBusy = isSending;
  const trimmedInput = input.trim();

  const renderMessage = useCallback(
    ({ item }: { item: ChatMessage }) => {
      const isUser = item.role === 'user';
      const backgroundColor = isUser ? palette.tint : palette.surface;
      const textColor = isUser ? '#fff' : palette.text;
      const bubbleBorder = isUser ? `${palette.tint}70` : `${palette.border}99`;

      return (
        <View style={[styles.messageWrapper, isUser ? styles.messageRight : styles.messageLeft]}>
          <View style={[styles.messageBubble, { backgroundColor, borderColor: bubbleBorder }]}>
            <ThemedText style={[styles.messageAuthor, { color: textColor }]} type="defaultSemiBold">
              {isUser ? 'Você' : 'Assistente Catequista'}
            </ThemedText>
            {item.id.endsWith('-assistant-typing') ? (
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
    <RestrictedFeature featureName="Catequista">
      <SafeAreaView style={{ flex: 1, backgroundColor: screenBackground }}>
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: screenBackground }}
          behavior={Platform.select({ ios: 'padding', android: undefined })}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
          <ThemedView style={[styles.container, { backgroundColor: screenBackground }]}>
            <HolySpiritSymbol size={220} opacity={0.12} style={styles.symbolTop} pointerEvents="none" />
            <HolySpiritSymbol size={180} opacity={0.1} style={styles.symbolBottom} pointerEvents="none" />
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
                placeholder="Pergunte algo sobre a fé católica..."
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
                editable={!isBusy}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Enviar mensagem"
                accessibilityHint="Toque duas vezes para enviar sua mensagem."
                onPress={sendMessage}
                disabled={isBusy || trimmedInput.length === 0}
                style={({ pressed }) => [
                  styles.sendButton,
                  {
                    backgroundColor: isBusy ? `${palette.tint}66` : palette.tint,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}>
                <MaterialIcons name="arrow-forward" size={24} color="#fff" />
              </Pressable>
            </View>
          </ThemedView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </RestrictedFeature>
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
    flexDirection: 'row',
    alignItems: 'flex-end',
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
