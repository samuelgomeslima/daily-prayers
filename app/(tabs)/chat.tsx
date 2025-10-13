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

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'welcome',
    role: 'assistant',
    content:
      'Paz e bem! Sou seu acompanhante espiritual digital. Posso sugerir orações, indicar novenas, explicar trechos da liturgia e orientar estudos católicos conforme o magistério da Igreja.',
  },
];

const SYSTEM_PROMPT = `Você é um assistente católico chamado "Companheiro de Fé". Responda sempre com fidelidade ao magistério da Igreja, cite referências litúrgicas quando possível e ofereça sugestões de orações, novenas, terços e estudos de aprofundamento. Traga indicações pastorais com tom acolhedor e respeitoso.`;

const CHAT_ENDPOINT = '/api/chat';

export default function ChatScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const palette = Colors[colorScheme];

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();

    if (!trimmed) {
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
      const payloadMessages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.map((message) => ({ role: message.role, content: message.content })),
        { role: 'user', content: trimmed },
      ];

      const response = await fetch(CHAT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: payloadMessages,
          temperature: 0.6,
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
  }, [input, messages]);

  const renderMessage = useCallback(
    ({ item }: { item: ChatMessage }) => {
      const isUser = item.role === 'user';
      const backgroundColor = isUser
        ? palette.tint
        : colorScheme === 'dark'
          ? '#1f2835'
          : '#f1f5f9';
      const textColor = isUser ? '#fff' : palette.text;

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

  const headerComponent = useMemo(
    () => (
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Companheiro de Fé
        </ThemedText>
        <ThemedText style={styles.description}>
          Converse com uma IA especializada em espiritualidade católica. Peça sugestões de orações,
          novenas, meditações ou orientações para aprofundar seus estudos. As respostas são baseadas
          no magistério da Igreja e em documentos oficiais.
        </ThemedText>
        <ThemedText style={styles.description}>
          As mensagens são enviadas com segurança aos nossos servidores, que utilizam a chave de API
          configurada no Azure Static Web Apps para consultar a OpenAI em seu nome.
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
              disabled={isSending}
              style={({ pressed }) => [
                styles.sendButton,
                {
                  backgroundColor: isSending ? '#94a3b8' : palette.tint,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}>
              {isSending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.sendButtonText}>Enviar</ThemedText>
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
