import Constants from 'expo-constants';
import React, { useCallback, useMemo, useRef, useState } from 'react';
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

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type CatechistResponse = {
  id?: string;
  conversation?: { id?: string } | null;
  conversation_id?: string;
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
      'Paz e bem! Sou o Assistente Catequista, treinado com base no livro “A Fé Explicada”. Faça suas perguntas sobre a fé católica e indique como deseja aprofundar seus estudos.',
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

const CATECHIST_ENDPOINT = (() => {
  if (process.env.EXPO_OS === 'web') {
    return '/api/catechist-agent';
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
    return new URL('/api/catechist-agent', envBaseUrl).toString();
  }

  const host = resolveExpoHost();

  if (host) {
    return `http://${host}:4280/api/catechist-agent`;
  }

  return null;
})();

const extractAssistantText = (payload: CatechistResponse) => {
  if (!payload) {
    return null;
  }

  const textSegments: string[] = [];

  if (Array.isArray(payload.output)) {
    for (const segment of payload.output) {
      if (segment?.type === 'message' && Array.isArray(segment.content)) {
        for (const content of segment.content) {
          if (typeof content?.text === 'string') {
            textSegments.push(content.text);
          } else if (typeof content?.value === 'string') {
            textSegments.push(content.value);
          }
        }
      } else if (typeof segment?.text === 'string') {
        textSegments.push(segment.text);
      }
    }
  }

  if (textSegments.length > 0) {
    return textSegments.join('\n').trim();
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
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const palette = Colors[colorScheme];

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();

    if (!trimmed) {
      return;
    }

    const endpoint = CATECHIST_ENDPOINT;

    if (!endpoint) {
      setError(
        'Configuração ausente: defina EXPO_PUBLIC_CATECHIST_BASE_URL ou EXPO_PUBLIC_CHAT_BASE_URL apontando para sua Static Web App para usar o assistente catequista nos apps nativos.'
      );
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
    setError(null);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: trimmed,
          conversationId: conversationId ?? undefined,
        }),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        const message =
          errorPayload?.error?.message ?? 'Não foi possível obter uma resposta do Assistente Catequista no momento.';
        throw new Error(message);
      }

      const data: CatechistResponse = await response.json();
      const assistantText = extractAssistantText(data);

      if (!assistantText) {
        throw new Error('A resposta do Assistente Catequista veio vazia. Tente novamente em instantes.');
      }

      const assistantMessage: ChatMessage = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: assistantText,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      const newConversationId = extractConversationId(data);
      if (newConversationId) {
        setConversationId(newConversationId);
      }
    } catch (sendError) {
      const friendlyMessage =
        sendError instanceof Error
          ? sendError.message
          : 'Ocorreu um erro inesperado ao contatar o Assistente Catequista.';
      setError(friendlyMessage);
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-assistant-error`,
          role: 'assistant',
          content:
            'Enfrentei um problema ao tentar responder. Confira sua conexão e tente novamente em instantes.',
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }, [conversationId, input]);

  const renderMessage = useCallback(
    ({ item }: { item: ChatMessage }) => {
      const isUser = item.role === 'user';
      const backgroundColor = isUser
        ? colorScheme === 'dark'
          ? '#1d4ed8'
          : palette.tint
        : colorScheme === 'dark'
          ? '#1f2937'
          : '#f8fafc';
      const textColor = isUser
        ? '#fff'
        : colorScheme === 'dark'
          ? '#e2e8f0'
          : palette.text;

      return (
        <View style={[styles.messageWrapper, isUser ? styles.messageRight : styles.messageLeft]}>
          <View style={[styles.messageBubble, { backgroundColor }]}>
            <ThemedText style={[styles.messageAuthor, { color: textColor }]} type="defaultSemiBold">
              {isUser ? 'Você' : 'Assistente Catequista'}
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

  const headerComponent = useMemo(
    () => (
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Assistente Catequista
        </ThemedText>
        <ThemedText style={styles.description}>
          Integre o agente criado na sua conta OpenAI para responder dúvidas sobre a fé católica com base no livro “A Fé Explicada”.
        </ThemedText>
        <ThemedText style={styles.description}>
          Consulte a aba <ThemedText type="defaultSemiBold">Explore</ThemedText> para seguir o passo a passo de configuração do agente antes de iniciar uma conversa.
        </ThemedText>
        <View
          style={[
            styles.divider,
            { backgroundColor: colorScheme === 'dark' ? '#1f2937' : '#e2e8f0' },
          ]}
        />
        {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}
      </View>
    ),
    [colorScheme, error]
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
        <ThemedView style={styles.container}>
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={headerComponent}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            keyboardShouldPersistTaps="handled"
          />
          <View
            style={[
              styles.inputContainer,
              {
                borderTopColor: colorScheme === 'dark' ? '#1f2937' : '#cbd5f5',
                backgroundColor: colorScheme === 'dark' ? '#0f172a' : 'transparent',
              },
            ]}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Pergunte algo sobre a fé católica..."
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
              disabled={isSending}
              style={({ pressed }) => [
                styles.sendButton,
                {
                  backgroundColor: isSending
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
  header: {
    gap: 12,
    marginBottom: 16,
  },
  title: {
    textAlign: 'center',
  },
  description: {
    lineHeight: 22,
    textAlign: 'justify',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e2e8f0',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 4,
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
