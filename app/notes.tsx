import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  ListRenderItem,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { HolySpiritSymbol } from '@/components/holy-spirit-symbol';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase';

type Note = {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
};

type SupabaseNoteRow = {
  id: string;
  title: string | null;
  content: string | null;
  updated_at: string | null;
};

function mapNoteRow(row: SupabaseNoteRow): Note {
  return {
    id: row.id,
    title: typeof row.title === 'string' ? row.title : '',
    content: typeof row.content === 'string' ? row.content : '',
    updatedAt: typeof row.updated_at === 'string' ? row.updated_at : new Date().toISOString(),
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

export default function NotesScreen() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  const { user } = useAuth();
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

    if (!user) {
      setNotes([]);
      setIsLoading(false);
      return () => {
        isMounted = false;
      };
    }

    const loadNotes = async () => {
      setIsLoading(true);

      try {
        const rows = await supabase.fetchNotes(user.id);
        if (!isMounted) {
          return;
        }

        const mapped = rows.map((row) => mapNoteRow(row as SupabaseNoteRow));
        setNotes(mapped);
        setSyncError(null);
      } catch (error) {
        console.error('Não foi possível carregar as anotações do Supabase.', error);
        if (isMounted) {
          setSyncError('Não foi possível sincronizar as anotações. Tente novamente mais tarde.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadNotes();

    return () => {
      isMounted = false;
    };
  }, [user]);

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

    if (!user) {
      setSyncError('É necessário estar autenticado para salvar anotações.');
      return;
    }

    setIsSaving(true);
    const timestamp = new Date().toISOString();

    try {
      if (editingNoteId) {
        const updatedRow = await supabase.updateNote({
          id: editingNoteId,
          userId: user.id,
          title: normalizedTitle,
          content: normalizedContent,
          updatedAt: timestamp,
        });

        if (!updatedRow) {
          throw new Error('Não foi possível atualizar a anotação.');
        }

        const updatedNote = mapNoteRow(updatedRow as SupabaseNoteRow);
        setNotes((prev) =>
          prev.map((note) => (note.id === updatedNote.id ? updatedNote : note)),
        );
      } else {
        const insertedRow = await supabase.insertNote({
          userId: user.id,
          title: normalizedTitle,
          content: normalizedContent,
          updatedAt: timestamp,
        });

        if (!insertedRow) {
          throw new Error('Não foi possível salvar a anotação.');
        }

        const newNote = mapNoteRow(insertedRow as SupabaseNoteRow);
        setNotes((prev) => [...prev, newNote]);
      }

      setSyncError(null);
      resetForm();
    } catch (error) {
      console.error('Não foi possível salvar a anotação.', error);
      setSyncError('Não foi possível salvar a anotação no Supabase. Verifique sua conexão.');
    } finally {
      setIsSaving(false);
    }
  }, [content, editingNoteId, resetForm, title, user]);

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
      if (!user) {
        setSyncError('É necessário estar autenticado para remover anotações.');
        return;
      }

      const previousNotes = notes;
      setNotes((prev) => prev.filter((note) => note.id !== id));

      try {
        await supabase.deleteNote(id, user.id);
        setSyncError(null);
      } catch (error) {
        console.error('Não foi possível remover a anotação.', error);
        setNotes(previousNotes);
        setSyncError('Não foi possível excluir a anotação no Supabase. Tente novamente.');
        return;
      }

      if (editingNoteId === id) {
        resetForm();
      }
    },
    [editingNoteId, notes, resetForm, user],
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
    [
      accentColor,
      borderColor,
      colorScheme,
      editingNoteId,
      handleDeleteNote,
      handleSelectNote,
      mutedText,
      overlayColor,
      palette,
      surface,
    ],
  );

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
          ListHeaderComponent={
            <View style={styles.header}>
              <ThemedText type="title" style={styles.screenTitle}>
                Anotações
              </ThemedText>
              <ThemedText style={[styles.lead, { color: mutedText }]}>
                Salve insights, lembretes de oração e pesquisas rápidas para retomar depois.
              </ThemedText>
              {syncError ? (
                <ThemedText
                  style={[
                    styles.syncError,
                    { color: colorScheme === 'dark' ? '#FCA5A5' : '#B91C1C' },
                  ]}
                >
                  {syncError}
                </ThemedText>
              ) : null}
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
            isLoading ? (
              <ThemedView
                style={styles.emptyState}
                lightColor={Colors.light.surfaceMuted}
                darkColor={Colors.dark.surfaceMuted}>
                <ActivityIndicator size="large" color={accentColor} />
                <ThemedText style={styles.emptyStateTitle}>Carregando anotações...</ThemedText>
                <ThemedText style={[styles.emptyStateSubtitle, { color: mutedText }]}>
                  Conectando ao Supabase para recuperar suas notas.
                </ThemedText>
              </ThemedView>
            ) : (
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
            )
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
  syncError: {
    fontSize: 13,
    fontWeight: '600',
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
