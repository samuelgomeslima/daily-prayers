import { documentDirectory, getInfoAsync, readAsStringAsync, writeAsStringAsync } from 'expo-file-system';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  ListRenderItem,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { SaintJosephLily } from '@/components/saint-joseph-lily';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';

type Note = {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
};

const NOTES_STORAGE_KEY = '@daily-prayers/notes';
const NOTES_STORAGE_FILE = 'notes.json';

function getStorageUri() {
  if (Platform.OS === 'web') {
    return null;
  }

  if (!documentDirectory) {
    return null;
  }

  return `${documentDirectory}${NOTES_STORAGE_FILE}`;
}

function sanitizeNotes(payload: unknown): Note[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .filter((item): item is Partial<Note> & { id: unknown } => typeof item === 'object' && item !== null)
    .map((item) => ({
      id: typeof item.id === 'string' ? item.id : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title: typeof item.title === 'string' ? item.title : '',
      content: typeof item.content === 'string' ? item.content : '',
      updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : new Date().toISOString(),
    }));
}

function createNoteId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
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
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        if (Platform.OS === 'web') {
          if (typeof window === 'undefined' || !isMounted) {
            return;
          }

          const stored = window.localStorage.getItem(NOTES_STORAGE_KEY);

          if (!stored) {
            return;
          }

          const parsed = JSON.parse(stored) as unknown;
          const sanitized = sanitizeNotes(parsed);

          if (isMounted) {
            setNotes(sanitized);
          }

          return;
        }

        const storageUri = getStorageUri();

        if (!storageUri) {
          return;
        }

        const fileInfo = await getInfoAsync(storageUri);

        if (!fileInfo.exists) {
          return;
        }

        const content = await readAsStringAsync(storageUri);
        const parsed = JSON.parse(content) as unknown;
        const sanitized = sanitizeNotes(parsed);

        if (isMounted) {
          setNotes(sanitized);
        }
      } catch (error) {
        console.error('Não foi possível carregar as anotações salvas.', error);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const persistNotes = useCallback(async (payload: Note[]) => {
    try {
      if (Platform.OS === 'web') {
        if (typeof window === 'undefined') {
          return;
        }

        window.localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(payload));
        return;
      }

      const storageUri = getStorageUri();

      if (!storageUri) {
        return;
      }

      await writeAsStringAsync(storageUri, JSON.stringify(payload));
    } catch (error) {
      console.error('Não foi possível persistir as anotações.', error);
    }
  }, []);

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
    const timestamp = new Date().toISOString();

    try {
      let nextNotes: Note[];

      if (editingNoteId) {
        nextNotes = notes.map((note) =>
          note.id === editingNoteId
            ? { ...note, title: normalizedTitle, content: normalizedContent, updatedAt: timestamp }
            : note,
        );
      } else {
        const newNote: Note = {
          id: createNoteId(),
          title: normalizedTitle,
          content: normalizedContent,
          updatedAt: timestamp,
        };
        nextNotes = [...notes, newNote];
      }

      setNotes(nextNotes);
      await persistNotes(nextNotes);
      resetForm();
    } catch (error) {
      console.error('Não foi possível salvar a anotação.', error);
    } finally {
      setIsSaving(false);
    }
  }, [content, editingNoteId, notes, persistNotes, resetForm, title]);

  const handleSelectNote = useCallback(
    (note: Note) => {
      setEditingNoteId(note.id);
      setTitle(note.title);
      setContent(note.content);
    },
    [],
  );

  const handleDeleteNote = useCallback(
    async (id: string) => {
      const nextNotes = notes.filter((note) => note.id !== id);
      setNotes(nextNotes);
      await persistNotes(nextNotes);

      if (editingNoteId === id) {
        resetForm();
      }
    },
    [editingNoteId, notes, persistNotes, resetForm],
  );

  const sortedNotes = useMemo(() => {
    return [...notes].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
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
              <ThemedText
                style={[
                  styles.deleteButtonLabel,
                  { color: colorScheme === 'dark' ? '#FFB4C2' : '#C81F4A' },
                ]}
              >
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
    [accentColor, editingNoteId, handleDeleteNote, handleSelectNote, mutedText],
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}>
      <ThemedView style={styles.container}>
        <SaintJosephLily size={200} opacity={0.12} style={styles.lilyTop} pointerEvents="none" />
        <SaintJosephLily size={160} opacity={0.1} style={styles.lilyBottom} pointerEvents="none" />
        <FlatList
          data={filteredNotes}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.header}>
              <ThemedText type="title" style={styles.screenTitle}>
                Anotações
              </ThemedText>
              <ThemedText style={[styles.lead, { color: mutedText }]}>
                Salve insights, lembretes de oração e pesquisas rápidas para retomar depois.
              </ThemedText>
              <TextInput
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholder="Pesquisar anotações"
                placeholderTextColor={placeholderColor}
                style={[
                  styles.input,
                  { backgroundColor: inputBackground, borderColor: inputBorder, color: inputText },
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
                    { backgroundColor: inputBackground, borderColor: inputBorder, color: inputText },
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
                    { backgroundColor: inputBackground, borderColor: inputBorder, color: inputText },
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
                      {editingNoteId ? 'Atualizar anotação' : 'Salvar anotação'}
                    </ThemedText>
                  </Pressable>
                </View>
              </ThemedView>
            </View>
          }
          ListEmptyComponent={
            <ThemedView
              style={styles.emptyState}
              lightColor={Colors.light.surfaceMuted}
              darkColor={Colors.dark.surfaceMuted}>
              <ThemedText style={styles.emptyStateTitle}>Nenhuma anotação encontrada</ThemedText>
              <ThemedText style={[styles.emptyStateSubtitle, { color: mutedText }]}>
                {searchTerm
                  ? 'Tente ajustar os termos de busca para localizar uma anotação existente.'
                  : 'Escreva sua primeira anotação acima para organizar pensamentos e inspirações.'}
              </ThemedText>
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
  lilyTop: {
    position: 'absolute',
    top: -60,
    right: -40,
  },
  lilyBottom: {
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
    minHeight: 120,
    fontSize: 16,
  },
  formCard: {
    borderRadius: 16,
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
});
