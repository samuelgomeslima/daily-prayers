import Constants from 'expo-constants';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';

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
const CATECHIST_TRANSCRIBE_ENDPOINT = createApiEndpoint('/api/catechist-transcribe');
const TRANSCRIBE_MODEL =
  process.env.EXPO_PUBLIC_TRANSCRIBE_MODEL ?? 'gpt-4o-mini-transcribe';

const guessMimeTypeFromUri = (uri: string) => {
  if (typeof uri !== 'string') {
    return 'audio/mp4';
  }

  const lower = uri.toLowerCase();

  if (lower.endsWith('.wav')) {
    return 'audio/wav';
  }

  if (lower.endsWith('.mp3') || lower.endsWith('.mpeg')) {
    return 'audio/mpeg';
  }

  if (lower.endsWith('.3gp') || lower.endsWith('.3gpp')) {
    return 'audio/3gpp';
  }

  if (lower.endsWith('.aac')) {
    return 'audio/aac';
  }

  if (lower.endsWith('.ogg')) {
    return 'audio/ogg';
  }

  return 'audio/mp4';
};

const guessExtensionFromMimeType = (mimeType: string) => {
  if (typeof mimeType !== 'string') {
    return 'm4a';
  }

  const normalized = mimeType.toLowerCase();

  if (normalized.includes('wav')) {
    return 'wav';
  }

  if (normalized.includes('mpeg')) {
    return 'mp3';
  }

  if (normalized.includes('3gpp')) {
    return '3gp';
  }

  if (normalized.includes('aac')) {
    return 'aac';
  }

  if (normalized.includes('ogg')) {
    return 'ogg';
  }

  return 'm4a';
};

const createRecordingFormData = async (uri: string) => {
  const info = await FileSystem.getInfoAsync(uri);

  if (!info.exists) {
    throw new Error('O arquivo de áudio gravado não foi encontrado.');
  }

  const mimeType = guessMimeTypeFromUri(uri);
  const extension = guessExtensionFromMimeType(mimeType);
  const fileName = `recording.${extension}`;
  const formData = new FormData();

  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    const blob = await response.blob();
    const webFile = typeof File !== 'undefined' ? new File([blob], fileName, { type: mimeType }) : blob;
    formData.append('file', webFile);
  } else {
    formData.append('file', {
      uri,
      name: fileName,
      type: mimeType,
    } as unknown as Blob);
  }

  formData.append('model', TRANSCRIBE_MODEL);

  return formData;
};

const toFriendlyTranscriptionError = (error: unknown) => {
  const defaultMessage =
    'Ocorreu um problema técnico ao processar o áudio. Tente gravar novamente em instantes.';

  if (!(error instanceof Error) || !error.message) {
    return defaultMessage;
  }

  if (/encodingtype/i.test(error.message)) {
    return 'Não consegui preparar o áudio gravado para envio. Abra o aplicativo novamente e tente gravar mais uma vez.';
  }

  if (/multipart|form-data/i.test(error.message)) {
    return 'Não consegui enviar o áudio para transcrição. Verifique sua conexão e tente novamente.';
  }

  if (/request body is missing/i.test(error.message)) {
    return 'Não encontrei o áudio gravado. Grave novamente e tente de novo.';
  }

  return defaultMessage;
};

const extractAssistantText = (payload: CatechistResponse) => {
  if (!payload) {
    return null;
  }

  const textSegments: string[] = [];

  if (typeof payload.finalOutput === 'string' && payload.finalOutput.trim()) {
    textSegments.push(payload.finalOutput.trim());
  }

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
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingStarting, setIsRecordingStarting] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [hasAudioPermission, setHasAudioPermission] = useState<boolean | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const palette = Colors[colorScheme];

  useEffect(() => {
    let isMounted = true;

    const requestInitialPermission = async () => {
      try {
        const result = await Audio.requestPermissionsAsync();
        if (isMounted) {
          setHasAudioPermission(result.status === 'granted');
        }
      } catch {
        if (isMounted) {
          setHasAudioPermission(false);
        }
      }
    };

    requestInitialPermission();

    return () => {
      isMounted = false;
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => null);
        recordingRef.current = null;
      }
    };
  }, []);

  const ensureMicrophonePermission = useCallback(async () => {
    if (hasAudioPermission === true) {
      return true;
    }

    try {
      const result = await Audio.requestPermissionsAsync();
      const granted = result.status === 'granted';
      setHasAudioPermission(granted);
      return granted;
    } catch {
      setHasAudioPermission(false);
      return false;
    }
  }, [hasAudioPermission]);

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

      setMessages((prev) => [...prev, userMessage]);
      setIsSending(true);

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            input_as_text: trimmed,
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

        return true;
      } catch (sendError) {
        const friendlyMessage =
          sendError instanceof Error
            ? sendError.message
            : 'Ocorreu um erro inesperado ao contatar o Assistente Catequista.';
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
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [conversationId]
  );

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();

    if (!trimmed) {
      return;
    }

    setInput('');
    await sendMessageFromText(trimmed);
  }, [input, sendMessageFromText]);

  const transcribeRecording = useCallback(
    async (uri: string) => {
      const endpoint = CATECHIST_TRANSCRIBE_ENDPOINT;

      if (!endpoint) {
        setMessages((prev) => [
          ...prev,
          {
            id: `${Date.now()}-assistant-transcribe-missing-endpoint`,
            role: 'assistant',
            content:
              'Não foi possível enviar o áudio no momento. Verifique as configurações do endpoint de transcrição antes de tentar novamente.',
          },
        ]);
        return false;
      }

      try {
        setIsTranscribing(true);

        const formData = await createRecordingFormData(uri);

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
          },
          body: formData,
        });

        if (!response.ok) {
          const errorPayload = await response.json().catch(() => null);
          const message =
            errorPayload?.error?.message ??
            'Não foi possível transcrever o áudio no momento. Tente novamente em instantes.';
          throw new Error(message);
        }

        const data = await response.json();
        const transcribedText =
          typeof data?.text === 'string' && data.text.trim().length > 0 ? data.text.trim() : null;

        if (!transcribedText) {
          throw new Error('A transcrição do áudio voltou vazia. Grave novamente e tente de novo.');
        }

        await sendMessageFromText(transcribedText);
        return true;
      } catch (error) {
        console.error('Failed to transcribe catechist recording.', error);

        const friendlyMessage = toFriendlyTranscriptionError(error);
        setMessages((prev) => [
          ...prev,
          {
            id: `${Date.now()}-assistant-transcribe-error`,
            role: 'assistant',
            content:
              'Não consegui entender o áudio enviado. Tente gravar novamente em um local mais silencioso.',
          },
          {
            id: `${Date.now()}-assistant-transcribe-error-detail`,
            role: 'assistant',
            content: friendlyMessage,
          },
        ]);
        return false;
      } finally {
        setIsTranscribing(false);
      }
    },
    [sendMessageFromText]
  );

  const startRecording = useCallback(async () => {
    if (isRecordingStarting || isRecording || isSending || isTranscribing) {
      return;
    }

    try {
      setIsRecordingStarting(true);

      const granted = await ensureMicrophonePermission();

      if (!granted) {
        setMessages((prev) => [
          ...prev,
          {
            id: `${Date.now()}-assistant-audio-permission`,
            role: 'assistant',
            content:
              'O microfone está desativado para o app. Ative a permissão para usar a transcrição por voz.',
          },
        ]);
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start catechist audio recording.', error);
      recordingRef.current = null;
      setIsRecording(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-assistant-audio-error`,
          role: 'assistant',
          content:
            'Não consegui iniciar a gravação de áudio. Verifique as permissões do microfone e tente novamente.',
        },
      ]);
    } finally {
      setIsRecordingStarting(false);
    }
  }, [ensureMicrophonePermission, isRecording, isRecordingStarting, isSending, isTranscribing]);

  const finishRecording = useCallback(async () => {
    const recording = recordingRef.current;

    if (!recording) {
      return;
    }

    recordingRef.current = null;

    try {
      await recording.stopAndUnloadAsync();
    } catch (error) {
      console.error('Failed to stop catechist audio recording.', error);
      setIsRecording(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-assistant-audio-stop-error`,
          role: 'assistant',
          content: 'Não consegui finalizar a gravação de áudio. Tente novamente.',
        },
      ]);
      return;
    }

    setIsRecording(false);

    const uri = recording.getURI();

    if (!uri) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-assistant-audio-missing`,
          role: 'assistant',
          content: 'Não foi possível acessar o áudio gravado. Tente gravar novamente.',
        },
      ]);
      return;
    }

    try {
      await transcribeRecording(uri);
    } finally {
      FileSystem.deleteAsync(uri).catch(() => null);
    }
  }, [transcribeRecording]);

  const handleAudioPress = useCallback(async () => {
    if (isRecording) {
      await finishRecording();
    } else {
      await startRecording();
    }
  }, [finishRecording, isRecording, startRecording]);

  const isBusy = isSending || isTranscribing || isRecordingStarting;
  const trimmedInput = input.trim();

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
              editable={!isBusy && !isRecording}
            />
            <View style={styles.actionsRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  isRecording ? 'Parar gravação de áudio' : 'Começar gravação de áudio'
                }
                onPress={handleAudioPress}
                disabled={isTranscribing}
                style={({ pressed }) => [
                  styles.actionButton,
                  {
                    backgroundColor: isRecording
                      ? '#ef4444'
                      : colorScheme === 'dark'
                        ? '#1f2937'
                        : '#e0e7ff',
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}>
                {isTranscribing ? (
                  <ActivityIndicator
                    color={isRecording ? '#fff' : colorScheme === 'dark' ? '#f8fafc' : palette.tint}
                  />
                ) : (
                  <Ionicons
                    name={isRecording ? 'stop-circle' : 'mic'}
                    size={26}
                    color={isRecording ? '#fff' : colorScheme === 'dark' ? '#f8fafc' : palette.tint}
                  />
                )}
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={sendMessage}
                disabled={isBusy || isRecording || trimmedInput.length === 0}
                style={({ pressed }) => [
                  styles.sendButton,
                  {
                    backgroundColor: isBusy
                      ? colorScheme === 'dark'
                        ? '#1d4ed8'
                        : '#94a3b8'
                      : colorScheme === 'dark'
                        ? '#2563eb'
                        : palette.tint,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}>
                {isBusy ? (
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
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButton: {
    flex: 1,
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
