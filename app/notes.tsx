import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { HolySpiritSymbol } from '@/components/holy-spirit-symbol';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Fonts } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { buildApiUrl } from '@/utils/api-endpoint';

type NoteApiPayload = {
  id: string;
  title?: string;
  content?: string;
  created_at?: string;
  updated_at?: string;
};

type Note = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

function normalizeNote(payload: NoteApiPayload): Note {
  return {
    id: payload.id,
    title: typeof payload.title === 'string' ? payload.title : '',
    content: typeof payload.content === 'string' ? payload.content : '',
    createdAt: typeof payload.created_at === 'string' ? payload.created_at : new Date().toISOString(),
    updatedAt: typeof payload.updated_at === 'string' ? payload.updated_at : new Date().toISOString(),
  };
}

function formatUpdatedAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  try {
    const datePart = date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const timePart = date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return `${datePart} · ${timePart}`;
  } catch (error) {
    console.warn('Não foi possível formatar a data da anotação.', error);
    return date.toISOString();
  }
}

function sortNotes(notes: Note[]) {
  return [...notes].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export default function NotesScreen() {
  const { user, token, isInitializing, signIn, signUp, signOut, apiBaseUrl } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';

  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);

  const palette = Colors[colorScheme];
  const surface = useThemeColor({}, 'surface');
  const surfaceMuted = useThemeColor({}, 'surfaceMuted');
  const borderColor = useThemeColor({}, 'border');
  const inputText = useThemeColor({}, 'text');
  const placeholderColor = useThemeColor({ light: '#8087BD', dark: '#9DA6E5' }, 'icon');
  const accentColor = useThemeColor({}, 'tint');
  const mutedText = useThemeColor({ light: '#646C9F', dark: '#A0A8D6' }, 'icon');
  const overlayColor = useThemeColor({}, 'overlay');

  const notesEndpoint = useMemo(() => buildApiUrl('/notes', apiBaseUrl), [apiBaseUrl]);

  const resetForm = useCallback(() => {
    setTitle('');
    setContent('');
    setEditingNoteId(null);
  }, []);

  const fetchNotes = useCallback(async () => {
    if (!token) {
      setNotes([]);
      return;
    }

    if (!notesEndpoint) {
      setNotesError(
        'Configure EXPO_PUBLIC_API_BASE_URL (ou reutilize EXPO_PUBLIC_CHAT_BASE_URL) para carregar as anotações do servidor.',
      );
      return;
    }

    setNotesError(null);
    setIsFetching(true);

    try {
      const response = await fetch(notesEndpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data: { notes?: NoteApiPayload[]; message?: string } | null = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message ?? 'Não foi possível carregar as anotações.');
      }

      const normalized = Array.isArray(data?.notes)
        ? sortNotes(data.notes.map((item) => normalizeNote(item)))
        : [];

      setNotes(normalized);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro inesperado ao buscar as anotações.';
      setNotesError(message);
    } finally {
      setIsFetching(false);
    }
  }, [notesEndpoint, token]);

  useEffect(() => {
    if (token) {
      fetchNotes();
    } else {
      setNotes([]);
    }
  }, [fetchNotes, token]);

  const handleRefresh = useCallback(async () => {
    if (!token) {
      return;
    }

    setIsRefreshing(true);
    await fetchNotes();
    setIsRefreshing(false);
  }, [fetchNotes, token]);

  const handleSaveNote = useCallback(async () => {
    const normalizedTitle = title.trim();
    const normalizedContent = content.trim();

    if (!normalizedTitle && !normalizedContent) {
      return;
    }

    if (!token) {
      setNotesError('Faça login para salvar suas anotações.');
      return;
    }

    if (!notesEndpoint) {
      setNotesError(
        'O endpoint de anotações não está configurado. Defina EXPO_PUBLIC_API_BASE_URL para continuar.',
      );
      return;
    }

    setNotesError(null);
    setIsSaving(true);

    try {
      const isEditing = Boolean(editingNoteId);
      const targetUrl = isEditing
        ? `${notesEndpoint}/${encodeURIComponent(editingNoteId!)}`
        : notesEndpoint;

      const response = await fetch(targetUrl, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: normalizedTitle, content: normalizedContent }),
      });

      const data: { note?: NoteApiPayload; message?: string } = await response.json();

      if (!response.ok || !data.note) {
        throw new Error(data?.message ?? 'Não foi possível salvar a anotação.');
      }

      const savedNote = normalizeNote(data.note);

      setNotes((current) => {
        const next = isEditing
          ? current.map((note) => (note.id === savedNote.id ? savedNote : note))
          : [savedNote, ...current];
        return sortNotes(next);
      });

      resetForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro inesperado ao salvar a anotação.';
      setNotesError(message);
    } finally {
      setIsSaving(false);
    }
  }, [content, editingNoteId, notesEndpoint, resetForm, title, token]);

  const handleSelectNote = useCallback((note: Note) => {
    setEditingNoteId(note.id);
    setTitle(note.title);
    setContent(note.content);
  }, []);

  const handleDeleteNote = useCallback(
    async (id: string) => {
      if (!token) {
        setNotesError('Faça login para remover anotações.');
        return;
      }

      if (!notesEndpoint) {
        setNotesError('O endpoint de anotações não está configurado.');
        return;
      }

      try {
        setNotesError(null);
        const response = await fetch(`${notesEndpoint}/${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 204) {
          setNotes((current) => current.filter((note) => note.id !== id));

          if (editingNoteId === id) {
            resetForm();
          }

          return;
        }

        const data: { message?: string } = await response.json().catch(() => ({ message: undefined }));

        if (response.status === 404) {
          setNotes((current) => current.filter((note) => note.id !== id));
          if (editingNoteId === id) {
            resetForm();
          }
          return;
        }

        throw new Error(data?.message ?? 'Não foi possível remover a anotação.');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro inesperado ao remover a anotação.';
        setNotesError(message);
      }
    },
    [editingNoteId, notesEndpoint, resetForm, token],
  );

  const filteredNotes = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return notes;
    }

    return notes.filter((note) => {
      const haystack = `${note.title} ${note.content}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [notes, searchTerm]);

  const isSaveDisabled = isSaving || (!title.trim() && !content.trim());

  const renderItem = useCallback(
    ({ item }: { item: Note }) => {
      const isActive = editingNoteId === item.id;

      return (
        <Pressable
          accessibilityHint="Toque para carregar a anotação no formulário"
          accessibilityRole="button"
          accessibilityState={{ selected: isActive }}
          onPress={() => handleSelectNote(item)}
          style={({ pressed }) => [
            styles.noteCard,
            {
              backgroundColor: surface,
              borderColor: isActive ? accentColor : `${borderColor}A6`,
              shadowColor: `${palette.tint}24`,
            },
            pressed && styles.noteCardPressed,
            isActive && styles.noteCardActive,
          ]}>
          <View style={styles.noteCardHeader}>
            <ThemedText style={styles.noteTitle} numberOfLines={1}>
              {item.title || 'Sem título'}
            </ThemedText>
            <ThemedText style={[styles.noteMeta, { color: mutedText }]}>
              {formatUpdatedAt(item.updatedAt)}
            </ThemedText>
          </View>
          {item.content ? (
            <ThemedText style={styles.noteContent} numberOfLines={3}>
              {item.content}
            </ThemedText>
          ) : null}
          <View style={styles.noteActions}>
            <Pressable
              accessibilityHint="Remove a anotação da lista"
              accessibilityRole="button"
              onPress={() => handleDeleteNote(item.id)}
              style={({ pressed }) => [
                styles.deleteButton,
                {
                  borderColor: colorScheme === 'dark' ? '#8F3A5C' : '#F7B7C6',
                  backgroundColor: overlayColor,
                },
                pressed && styles.deleteButtonPressed,
              ]}>
              <ThemedText
                style={[
                  styles.deleteButtonLabel,
                  { color: colorScheme === 'dark' ? '#FFB4C2' : '#C81F4A' },
                ]}>
                Excluir
              </ThemedText>
            </Pressable>
            {isActive ? (
              <ThemedText style={[styles.editingBadge, { color: accentColor }]}>Editando</ThemedText>
            ) : null}
          </View>
        </Pressable>
      );
    },
    [accentColor, borderColor, colorScheme, editingNoteId, handleDeleteNote, handleSelectNote, mutedText, overlayColor, palette, surface],
  );

  const handleToggleAuthMode = useCallback(() => {
    setAuthMode((current) => (current === 'login' ? 'register' : 'login'));
    setAuthError(null);
  }, []);

  const handleAuthSubmit = useCallback(async () => {
    const normalizedEmail = authEmail.trim().toLowerCase();
    const normalizedPassword = authPassword.trim();

    if (!normalizedEmail || !normalizedPassword) {
      setAuthError('Informe e-mail e senha para continuar.');
      return;
    }

    setIsAuthSubmitting(true);
    setAuthError(null);

    try {
      if (authMode === 'login') {
        await signIn(normalizedEmail, normalizedPassword);
      } else {
        await signUp(normalizedEmail, normalizedPassword);
      }

      setAuthEmail('');
      setAuthPassword('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível concluir a operação.';
      setAuthError(message);
    } finally {
      setIsAuthSubmitting(false);
    }
  }, [authEmail, authMode, authPassword, signIn, signUp]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    resetForm();
    setNotes([]);
  }, [resetForm, signOut]);

  if (isInitializing) {
    return (
      <View style={[styles.flex, styles.centered]}>
        <ActivityIndicator size="large" color={accentColor} />
      </View>
    );
  }

  if (!user) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}>
        <ThemedView style={[styles.container, styles.centered]}>
          <HolySpiritSymbol size={200} opacity={0.12} style={styles.symbolTop} pointerEvents="none" />
          <HolySpiritSymbol size={160} opacity={0.1} style={styles.symbolBottom} pointerEvents="none" />
          <ThemedView
            style={[styles.authCard, { borderColor: `${borderColor}80` }]}
            lightColor={Colors.light.surface}
            darkColor={Colors.dark.surface}>
            <ThemedText type="title" style={styles.screenTitle}>
              {authMode === 'login' ? 'Acesse suas anotações' : 'Crie sua conta gratuita'}
            </ThemedText>
            <ThemedText style={[styles.lead, { color: mutedText }]}>Somente usuários autenticados podem salvar anotações no servidor seguro.</ThemedText>
            <TextInput
              value={authEmail}
              onChangeText={setAuthEmail}
              placeholder="Seu e-mail"
              placeholderTextColor={placeholderColor}
              style={[
                styles.input,
                { backgroundColor: surface, borderColor, color: inputText },
              ]}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
            />
            <TextInput
              value={authPassword}
              onChangeText={setAuthPassword}
              placeholder="Senha"
              placeholderTextColor={placeholderColor}
              style={[
                styles.input,
                { backgroundColor: surface, borderColor, color: inputText },
              ]}
              secureTextEntry
              textContentType="password"
            />
            {authError ? (
              <ThemedText style={styles.errorMessage}>{authError}</ThemedText>
            ) : null}
            <Pressable
              accessibilityRole="button"
              onPress={handleAuthSubmit}
              disabled={isAuthSubmitting}
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: accentColor },
                pressed && !isAuthSubmitting && styles.primaryButtonPressed,
                isAuthSubmitting && styles.primaryButtonDisabled,
              ]}>
              <ThemedText style={styles.primaryButtonLabel}>
                {authMode === 'login' ? 'Entrar' : 'Cadastrar'}
              </ThemedText>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={handleToggleAuthMode}>
              <ThemedText style={[styles.switchAuthMode, { color: accentColor }]}>
                {authMode === 'login'
                  ? 'Quero criar uma conta agora'
                  : 'Já tenho conta, voltar ao login'}
              </ThemedText>
            </Pressable>
          </ThemedView>
        </ThemedView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}>
      <ThemedView style={styles.container}>
        <HolySpiritSymbol size={200} opacity={0.12} style={styles.symbolTop} pointerEvents="none" />
        <HolySpiritSymbol size={160} opacity={0.1} style={styles.symbolBottom} pointerEvents="none" />
        <FlatList
          data={filteredNotes}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={accentColor}
              colors={[accentColor]}
            />
          }
          ListHeaderComponent={
            <View style={styles.header}>
              <ThemedText type="title" style={styles.screenTitle}>
                Anotações
              </ThemedText>
              <ThemedText style={[styles.lead, { color: mutedText }]}>Salve insights, lembretes de oração e pesquisas rápidas para retomar depois.</ThemedText>
              {notesError ? (
                <ThemedView style={[styles.errorBanner, { borderColor: `${palette.tint}40` }]}
                  lightColor={Colors.light.surface}
                  darkColor={Colors.dark.surface}>
                  <ThemedText style={[styles.errorMessage, { textAlign: 'left' }]}>{notesError}</ThemedText>
                </ThemedView>
              ) : null}
              <TextInput
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholder="Pesquisar anotações"
                placeholderTextColor={placeholderColor}
                style={[
                  styles.input,
                  { backgroundColor: surface, borderColor, color: inputText },
                ]}
                autoCapitalize="sentences"
                autoCorrect
                accessibilityLabel="Pesquisar anotações"
                returnKeyType="search"
              />
              <ThemedView
                style={styles.formCard}
                lightColor={Colors.light.surface}
                darkColor={Colors.dark.surface}>
                <ThemedText type="subtitle" style={styles.formTitle}>
                  {editingNoteId ? 'Editar anotação' : 'Nova anotação'}
                </ThemedText>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Título da anotação"
                  placeholderTextColor={placeholderColor}
                  style={[
                    styles.input,
                    { backgroundColor: surface, borderColor, color: inputText },
                  ]}
                  accessibilityLabel="Título da anotação"
                  autoCapitalize="sentences"
                  autoCorrect
                />
                <TextInput
                  value={content}
                  onChangeText={setContent}
                  placeholder="Escreva aqui suas anotações"
                  placeholderTextColor={placeholderColor}
                  style={[
                    styles.textarea,
                    { backgroundColor: surface, borderColor, color: inputText },
                  ]}
                  accessibilityLabel="Conteúdo da anotação"
                  multiline
                  textAlignVertical="top"
                />
                <View style={styles.formActions}>
                  {editingNoteId ? (
                    <Pressable
                      accessibilityRole="button"
                      onPress={resetForm}
                      style={({ pressed }) => [
                        styles.secondaryButton,
                        {
                          borderColor,
                          backgroundColor: surfaceMuted,
                        },
                        pressed && styles.secondaryButtonPressed,
                      ]}>
                      <ThemedText style={styles.secondaryButtonLabel}>Cancelar</ThemedText>
                    </Pressable>
                  ) : null}
                  <Pressable
                    accessibilityRole="button"
                    onPress={handleSaveNote}
                    disabled={isSaveDisabled}
                    style={({ pressed }) => [
                      styles.primaryButton,
                      { backgroundColor: accentColor },
                      pressed && !isSaveDisabled && styles.primaryButtonPressed,
                      isSaveDisabled && styles.primaryButtonDisabled,
                    ]}>
                    <ThemedText style={styles.primaryButtonLabel}>
                      {isSaving ? 'Salvando...' : editingNoteId ? 'Atualizar anotação' : 'Salvar anotação'}
                    </ThemedText>
                  </Pressable>
                </View>
              </ThemedView>
              <Pressable accessibilityRole="button" onPress={handleSignOut}>
                <ThemedText style={[styles.signOutLink, { color: accentColor }]}>
                  Encerrar sessão
                </ThemedText>
              </Pressable>
            </View>
          }
          ListEmptyComponent={
            <ThemedView
              style={styles.emptyState}
              lightColor={Colors.light.surfaceMuted}
              darkColor={Colors.dark.surfaceMuted}>
              {isFetching ? (
                <ActivityIndicator size="small" color={accentColor} />
              ) : (
                <>
                  <ThemedText style={styles.emptyStateTitle}>Nenhuma anotação encontrada</ThemedText>
                  <ThemedText style={[styles.emptyStateSubtitle, { color: mutedText }]}>
                    {searchTerm
                      ? 'Tente ajustar os termos de busca para localizar uma anotação existente.'
                      : 'Escreva sua primeira anotação acima para organizar pensamentos e inspirações.'}
                  </ThemedText>
                </>
              )}
            </ThemedView>
          }
          keyboardShouldPersistTaps="handled"
        />
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 56,
    gap: 16,
  },
  header: {
    gap: 16,
  },
  symbolTop: {
    position: 'absolute',
    top: -60,
    right: -40,
  },
  symbolBottom: {
    position: 'absolute',
    bottom: -70,
    left: -30,
    transform: [{ scaleX: -1 }],
  },
  screenTitle: {
    fontFamily: Fonts.serif,
  },
  lead: {
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 140,
  },
  formCard: {
    borderRadius: 18,
    padding: 20,
    gap: 16,
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 2,
  },
  formTitle: {
    fontFamily: Fonts.rounded,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  primaryButton: {
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  primaryButtonPressed: {
    opacity: 0.85,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButton: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  secondaryButtonPressed: {
    opacity: 0.7,
  },
  secondaryButtonLabel: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  noteCard: {
    borderRadius: 16,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 1,
  },
  noteCardPressed: {
    opacity: 0.85,
  },
  noteCardActive: {
    shadowOpacity: 0.25,
    elevation: 2,
  },
  noteCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  noteTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
  },
  noteMeta: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  noteContent: {
    fontSize: 15,
    lineHeight: 20,
  },
  noteActions: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deleteButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  deleteButtonPressed: {
    opacity: 0.7,
  },
  deleteButtonLabel: {
    fontWeight: '600',
  },
  editingBadge: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  emptyState: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 8,
    borderRadius: 18,
    paddingHorizontal: 24,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptyStateSubtitle: {
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  authCard: {
    width: '88%',
    maxWidth: 420,
    borderRadius: 24,
    padding: 24,
    gap: 16,
    borderWidth: 1,
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
  },
  errorMessage: {
    color: '#D6456A',
    textAlign: 'center',
    fontSize: 14,
  },
  switchAuthMode: {
    marginTop: 8,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorBanner: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  signOutLink: {
    fontSize: 14,
    fontWeight: '600',
    alignSelf: 'flex-end',
  },
});
