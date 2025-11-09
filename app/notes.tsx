import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  ListRenderItem,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { HolySpiritSymbol } from '@/components/holy-spirit-symbol';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';

type Note = {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
};

function normalizeNote(payload: any): Note | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const id = typeof payload.id === 'string' ? payload.id : null;

  if (!id) {
    return null;
  }

  const title = typeof payload.title === 'string' ? payload.title : '';
  const content = typeof payload.content === 'string' ? payload.content : '';
  const updatedAt = typeof payload.updatedAt === 'string' ? payload.updatedAt : new Date().toISOString();

  return {
    id,
    title,
    content,
    updatedAt,
  };
}

function normalizeNotes(payload: unknown): Note[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map((item) => normalizeNote(item))
    .filter((item): item is Note => item !== null);
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

export default function NotesScreen() {
  const { fetchWithAuth } = useAuth();

  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  const surface = useThemeColor({}, 'surface');
  const surfaceMuted = useThemeColor({}, 'surfaceMuted');
  const borderColor = useThemeColor({}, 'border');
  const inputText = useThemeColor({}, 'text');
  const placeholderColor = useThemeColor({ light: '#8087BD', dark: '#9DA6E5' }, 'icon');
  const accentColor = useThemeColor({}, 'tint');
  const mutedText = useThemeColor({ light: '#646C9F', dark: '#A0A8D6' }, 'icon');
  const overlayColor = useThemeColor({}, 'overlay');

  const inputBackground = surface;
  const inputBorder = borderColor;

  const loadNotes = useCallback(async () => {
    try {
      const response = await fetchWithAuth('/notes', { method: 'GET' });

      if (!response.ok) {
        const fallbackMessage = 'Não foi possível carregar suas anotações agora. Tente novamente em instantes.';
        let message = fallbackMessage;

        try {
          const payload = (await response.json()) as { error?: { message?: unknown } };
          const candidate = payload?.error?.message;
          if (typeof candidate === 'string' && candidate.trim()) {
            message = candidate.trim();
          }
        } catch {
          // Ignore JSON parsing errors and keep the fallback message.
        }

        throw new Error(message);
      }

      const data = (await response.json()) as { notes?: unknown };
      const parsed = normalizeNotes(data?.notes);
      setNotes(parsed);
      setErrorMessage(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar suas anotações agora. Tente novamente em instantes.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    setIsLoading(true);
    void loadNotes();
  }, [loadNotes]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await loadNotes();
    } finally {
      setIsRefreshing(false);
    }
  }, [loadNotes]);

  const resetForm = useCallback(() => {
    setTitle('');
    setContent('');
    setEditingNoteId(null);
  }, []);

  const handleSaveNote = useCallback(async () => {
    const normalizedTitle = title.trim();
    const normalizedContent = content.trim();

    if (!normalizedTitle && !normalizedContent) {
      return;
    }

    setIsSaving(true);
    const payload = {
      title: normalizedTitle,
      content: normalizedContent,
    };

    try {
      if (editingNoteId) {
        const response = await fetchWithAuth(`/notes/${editingNoteId}`, {
          method: 'PUT',
          json: payload,
        });

        if (!response.ok) {
          throw new Error('Não foi possível atualizar a anotação selecionada.');
        }

        const data = (await response.json()) as { note?: unknown };
        const updated = normalizeNote(data?.note);

        if (!updated) {
          throw new Error('Resposta inválida ao atualizar a anotação.');
        }

        setNotes((current) =>
          current.map((note) => (note.id === updated.id ? { ...note, ...updated } : note)),
        );
      } else {
        const response = await fetchWithAuth('/notes', {
          method: 'POST',
          json: payload,
        });

        if (!response.ok) {
          throw new Error('Não foi possível salvar a nova anotação.');
        }

        const data = (await response.json()) as { note?: unknown };
        const created = normalizeNote(data?.note);

        if (!created) {
          throw new Error('Resposta inválida ao criar a anotação.');
        }

        setNotes((current) => [...current, created]);
      }

      resetForm();
      setErrorMessage(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível salvar a anotação agora. Tente novamente em instantes.';
      setErrorMessage(message);
    } finally {
      setIsSaving(false);
    }
  }, [content, editingNoteId, fetchWithAuth, resetForm, title]);

  const handleSelectNote = useCallback((note: Note) => {
    setEditingNoteId(note.id);
    setTitle(note.title);
    setContent(note.content);
  }, []);

  const handleDeleteNote = useCallback(
    async (id: string) => {
      try {
        const response = await fetchWithAuth(`/notes/${id}`, { method: 'DELETE' });

        if (!response.ok && response.status !== 404) {
          throw new Error('Não foi possível remover a anotação.');
        }

        setNotes((current) => current.filter((note) => note.id !== id));

        if (editingNoteId === id) {
          resetForm();
        }

        setErrorMessage(null);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Não foi possível remover a anotação agora. Tente novamente em instantes.';
        setErrorMessage(message);
      }
    },
    [editingNoteId, fetchWithAuth, resetForm],
  );

  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [notes]);

  const filteredNotes = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return sortedNotes;
    }

    return sortedNotes.filter((note) => {
      const haystack = `${note.title} ${note.content}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [searchTerm, sortedNotes]);

  const isSaveDisabled = isSaving || (!title.trim() && !content.trim());

  const renderItem: ListRenderItem<Note> = useCallback(
    ({ item }) => {
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
              <ThemedText style={styles.deleteButtonLabel}>Apagar</ThemedText>
            </Pressable>
          </View>
        </Pressable>
      );
    },
    [accentColor, borderColor, colorScheme, editingNoteId, handleDeleteNote, handleSelectNote, mutedText, overlayColor, palette.tint, surface],
  );

  const keyExtractor = useCallback((item: Note) => item.id, []);

  const emptyComponent = useMemo(() => {
    if (isLoading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={palette.tint} />
          <ThemedText style={[styles.emptyStateText, { color: mutedText }]}>Carregando anotações...</ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <HolySpiritSymbol size={56} color={palette.tint} />
        <ThemedText style={[styles.emptyStateText, { color: mutedText }]}>Comece registrando suas inspirações espirituais aqui.</ThemedText>
      </View>
    );
  }, [isLoading, mutedText, palette.tint]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', android: undefined })}
      style={styles.flexContainer}>
      <ThemedView style={styles.container}>
        <View style={styles.formContainer}>
          <ThemedText style={styles.formTitle}>Nova anotação</ThemedText>
          <View style={styles.inputGroup}>
            <TextInput
              accessibilityLabel="Título da anotação"
              placeholder="Título"
              placeholderTextColor={placeholderColor}
              value={title}
              onChangeText={setTitle}
              style={[styles.input, { color: inputText, backgroundColor: inputBackground, borderColor: inputBorder }]}
            />
            <TextInput
              accessibilityLabel="Conteúdo da anotação"
              placeholder="Escreva aqui suas inspirações e resoluções..."
              placeholderTextColor={placeholderColor}
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={4}
              style={[styles.textarea, { color: inputText, backgroundColor: inputBackground, borderColor: inputBorder }]}
            />
            <Pressable
              accessibilityRole="button"
              onPress={handleSaveNote}
              disabled={isSaveDisabled}
              style={({ pressed }) => [
                styles.saveButton,
                {
                  backgroundColor: isSaveDisabled ? surfaceMuted : accentColor,
                  shadowColor: `${palette.tint}33`,
                },
                pressed && !isSaveDisabled ? styles.saveButtonPressed : null,
              ]}>
              {isSaving ? (
                <ActivityIndicator color={colorScheme === 'dark' ? '#0B1226' : '#FFFFFF'} />
              ) : (
                <ThemedText style={styles.saveButtonLabel}>
                  {editingNoteId ? 'Atualizar anotação' : 'Salvar anotação'}
                </ThemedText>
              )}
            </Pressable>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.listHeader}>
          <ThemedText style={styles.listTitle}>Minhas anotações</ThemedText>
          <TextInput
            placeholder="Buscar nas anotações"
            placeholderTextColor={placeholderColor}
            value={searchTerm}
            onChangeText={setSearchTerm}
            style={[styles.searchInput, { color: inputText, backgroundColor: inputBackground, borderColor: inputBorder }]}
          />
        </View>

        {errorMessage ? (
          <ThemedText style={[styles.errorMessage, { color: palette.negative }]}>{errorMessage}</ThemedText>
        ) : null}

        <FlatList
          data={filteredNotes}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={emptyComponent}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          keyboardShouldPersistTaps="handled"
        />
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flexContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  formContainer: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  inputGroup: {
    gap: 12,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  textarea: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  saveButton: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonPressed: {
    opacity: 0.9,
  },
  saveButtonLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 12,
    opacity: 0.5,
  },
  listHeader: {
    gap: 12,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  searchInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
  },
  listContent: {
    paddingVertical: 16,
    gap: 16,
  },
  noteCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  noteCardPressed: {
    transform: [{ scale: 0.99 }],
  },
  noteCardActive: {
    borderWidth: 2,
  },
  noteCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  noteMeta: {
    fontSize: 13,
  },
  noteContent: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 12,
  },
  noteActions: {
    alignItems: 'flex-end',
  },
  deleteButton: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  deleteButtonPressed: {
    opacity: 0.85,
  },
  deleteButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    gap: 16,
  },
  emptyStateText: {
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 280,
  },
  errorMessage: {
    marginTop: 12,
    marginBottom: 4,
  },
});
