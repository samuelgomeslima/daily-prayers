import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase';

type PracticeFrequency = 'daily' | 'weekly' | 'monthly';

type BasePractice = {
  id: string;
  title: string;
  description?: string;
  frequency: PracticeFrequency;
  isDefault?: boolean;
};

type LifePlanPractice = BasePractice & {
  completedPeriods: string[];
};

type SupabaseLifePlanRow = {
  id: string;
  title: string | null;
  description: string | null;
  frequency: string | null;
  is_default: boolean | null;
  completed_periods: string[] | null;
};

const FREQUENCIES: PracticeFrequency[] = ['daily', 'weekly', 'monthly'];

const FREQUENCY_LABELS: Record<PracticeFrequency, string> = {
  daily: 'Diário',
  weekly: 'Semanal',
  monthly: 'Mensal',
};

const FREQUENCY_HINTS: Record<PracticeFrequency, string> = {
  daily: 'Renove este compromisso todos os dias.',
  weekly: 'Agende para uma vez por semana.',
  monthly: 'Revise ao menos uma vez por mês.',
};

const DEFAULT_PRACTICES: ReadonlyArray<BasePractice> = [
  {
    id: 'morning-prayer',
    title: 'Oração da manhã',
    description: 'Ao acordar, ofereça todo o dia a Deus com uma oração de entrega.',
    frequency: 'daily',
    isDefault: true,
  },
  {
    id: 'biblical-reading',
    title: 'Leitura da Bíblia',
    description: 'Separe 10 a 15 minutos para meditar um trecho das Escrituras.',
    frequency: 'daily',
    isDefault: true,
  },
  {
    id: 'silent-meditation',
    title: 'Meditação silenciosa',
    description: 'Dedique alguns minutos de silêncio para aprofundar a Palavra rezada.',
    frequency: 'daily',
    isDefault: true,
  },
  {
    id: 'rosary-prayer',
    title: 'Terço ou Rosário',
    description: 'Reze ao menos um terço diariamente, meditando os mistérios com calma.',
    frequency: 'daily',
    isDefault: true,
  },
  {
    id: 'night-prayer',
    title: 'Oração da noite',
    description: 'Antes de dormir, faça exame de consciência e agradeça as graças do dia.',
    frequency: 'daily',
    isDefault: true,
  },
  {
    id: 'holy-mass',
    title: 'Santa Missa',
    description: 'Participe da Eucaristia aos domingos e, se possível, em um dia extra.',
    frequency: 'weekly',
    isDefault: true,
  },
  {
    id: 'adoration',
    title: 'Adoração ao Santíssimo',
    description: 'Faça uma visita semanal a Jesus no Sacrário para permanecer em silêncio com Ele.',
    frequency: 'weekly',
    isDefault: true,
  },
  {
    id: 'mercy-works',
    title: 'Obra de misericórdia',
    description: 'Realize um gesto concreto de caridade por semana, oferecendo seu tempo e atenção.',
    frequency: 'weekly',
    isDefault: true,
  },
  {
    id: 'confession',
    title: 'Confissão',
    description: 'Procure o sacramento da Reconciliação com frequência e prepare-se com calma.',
    frequency: 'monthly',
    isDefault: true,
  },
  {
    id: 'spiritual-direction',
    title: 'Direção espiritual',
    description: 'Encontre-se com seu diretor espiritual para discernir passos de crescimento.',
    frequency: 'monthly',
    isDefault: true,
  },
];

function createDefaultPlan(): LifePlanPractice[] {
  return DEFAULT_PRACTICES.map((practice) => ({
    ...practice,
    completedPeriods: [],
  }));
}

function isPracticeFrequency(value: unknown): value is PracticeFrequency {
  return value === 'daily' || value === 'weekly' || value === 'monthly';
}

function mapSupabasePractice(row: SupabaseLifePlanRow): LifePlanPractice {
  const completed = Array.isArray(row.completed_periods)
    ? row.completed_periods.filter((entry): entry is string => typeof entry === 'string')
    : [];

  return {
    id: row.id,
    title: typeof row.title === 'string' ? row.title : 'Prática sem título',
    description: typeof row.description === 'string' ? row.description : undefined,
    frequency: isPracticeFrequency(row.frequency) ? row.frequency : 'daily',
    isDefault: Boolean(row.is_default),
    completedPeriods: completed,
  };
}

function getPeriodKey(frequency: PracticeFrequency, date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  if (frequency === 'daily') {
    return `${year}-${month}-${day}`;
  }

  if (frequency === 'monthly') {
    return `${year}-${month}`;
  }

  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  const weekNumber = Math.floor((dayOfYear + startOfYear.getDay()) / 7) + 1;
  return `${year}-W${String(weekNumber).padStart(2, '0')}`;
}

export default function LifePlanScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const router = useRouter();

  const [plan, setPlan] = useState<LifePlanPractice[]>([]);
  const [loading, setLoading] = useState(true);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formFrequency, setFormFrequency] = useState<PracticeFrequency>('daily');
  const [formError, setFormError] = useState<string | null>(null);

  const { user } = useAuth();

  useEffect(() => {
    let isMounted = true;

    if (!user) {
      setPlan(createDefaultPlan());
      setStorageWarning('Faça login para sincronizar seu plano de vida.');
      setLoading(false);
      return () => {
        isMounted = false;
      };
    }

    const loadPlan = async () => {
      setLoading(true);

      try {
        const rows = await supabase.fetchLifePlan(user.id);

        if (!isMounted) {
          return;
        }

        if (!rows.length) {
          const inserted = await supabase.insertLifePlanPractices(
            user.id,
            DEFAULT_PRACTICES.map(({ title, description, frequency, isDefault }) => ({
              title,
              description,
              frequency,
              isDefault,
            })),
          );

          const hydrated = inserted.map((row) => mapSupabasePractice(row as SupabaseLifePlanRow));
          setPlan(hydrated);
          setStorageWarning(null);
          return;
        }

        const hydrated = rows.map((row) => mapSupabasePractice(row as SupabaseLifePlanRow));
        setPlan(hydrated);
        setStorageWarning(null);
      } catch (error) {
        console.error('Falha ao carregar o plano de vida do Supabase.', error);
        if (isMounted) {
          setPlan(createDefaultPlan());
          setStorageWarning('Não foi possível sincronizar com o Supabase. Usando plano padrão temporário.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadPlan();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const isPracticeCompleted = useCallback((practice: LifePlanPractice) => {
    const periodKey = getPeriodKey(practice.frequency);
    return practice.completedPeriods.includes(periodKey);
  }, []);

  const completedCount = useMemo(
    () => plan.filter((practice) => isPracticeCompleted(practice)).length,
    [plan, isPracticeCompleted],
  );

  const summaryLabel = useMemo(() => {
    if (!plan.length) {
      return 'Defina práticas espirituais para acompanhar seu progresso ao longo do tempo.';
    }

    if (completedCount === 0) {
      return 'Comece marcando suas práticas concluídas para acompanhar a fidelidade ao plano.';
    }

    if (completedCount === plan.length) {
      return 'Parabéns! Todas as práticas foram concluídas no período atual.';
    }

    return `Você concluiu ${completedCount} de ${plan.length} práticas no período atual.`;
  }, [plan.length, completedCount]);

  const handleTogglePractice = useCallback(
    async (practiceId: string) => {
      if (!user) {
        setStorageWarning('Faça login para atualizar seu plano de vida.');
        return;
      }

      const target = plan.find((practice) => practice.id === practiceId);

      if (!target) {
        return;
      }

      const periodKey = getPeriodKey(target.frequency);
      const alreadyCompleted = target.completedPeriods.includes(periodKey);
      const updatedPeriods = alreadyCompleted
        ? target.completedPeriods.filter((entry) => entry !== periodKey)
        : [...target.completedPeriods, periodKey];

      const previousPlan = plan;
      setPlan((current) =>
        current.map((practice) =>
          practice.id === practiceId
            ? { ...practice, completedPeriods: updatedPeriods }
            : practice,
        ),
      );

      try {
        await supabase.updateLifePlanPractice(user.id, practiceId, {
          completedPeriods: updatedPeriods,
        });
        setStorageWarning(null);
      } catch (error) {
        console.error('Não foi possível atualizar a prática no Supabase.', error);
        setPlan(previousPlan);
        setStorageWarning('Falha ao sincronizar com o Supabase. Tente novamente.');
      }
    },
    [plan, user],
  );

  const handleRemovePractice = useCallback(
    async (practiceId: string) => {
      if (!user) {
        setStorageWarning('Faça login para remover práticas.');
        return;
      }

      const previousPlan = plan;
      setPlan((current) => current.filter((practice) => practice.id !== practiceId));

      try {
        await supabase.deleteLifePlanPractice(user.id, practiceId);
        setStorageWarning(null);
      } catch (error) {
        console.error('Não foi possível remover a prática no Supabase.', error);
        setPlan(previousPlan);
        setStorageWarning('Não foi possível sincronizar a remoção. Verifique sua conexão.');
      }
    },
    [plan, user],
  );

  const confirmRemovePractice = useCallback(
    (practice: LifePlanPractice) => {
      Alert.alert('Remover prática', `Deseja remover "${practice.title}" do seu plano de vida?`, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: () => handleRemovePractice(practice.id) },
      ]);
    },
    [handleRemovePractice],
  );

  const handleResetProgress = useCallback(() => {
    if (!user) {
      setStorageWarning('Faça login para reiniciar o progresso.');
      return;
    }

    Alert.alert('Reiniciar progresso', 'Deseja limpar todas as marcações do período atual?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Reiniciar',
        style: 'destructive',
        onPress: async () => {
          const previousPlan = plan;
          setPlan((current) =>
            current.map((practice) => ({
              ...practice,
              completedPeriods: [],
            })),
          );

          try {
            await supabase.resetLifePlanProgress(user.id);
            setStorageWarning(null);
          } catch (error) {
            console.error('Não foi possível reiniciar o progresso no Supabase.', error);
            setPlan(previousPlan);
            setStorageWarning('Falha ao sincronizar o reinício do plano. Tente novamente.');
          }
        },
      },
    ]);
  }, [plan, user]);

  const handleAddPractice = useCallback(async () => {
    const trimmedTitle = formTitle.trim();
    const trimmedDescription = formDescription.trim();

    if (!trimmedTitle) {
      setFormError('Informe um título para a prática.');
      return;
    }

    if (!user) {
      setFormError('Faça login para adicionar novas práticas.');
      return;
    }

    try {
      const inserted = await supabase.insertLifePlanPractices(user.id, [
        {
          title: trimmedTitle,
          description: trimmedDescription ? trimmedDescription : null,
          frequency: formFrequency,
        },
      ]);

      const created = inserted[0];

      if (!created) {
        throw new Error('Não foi possível criar a prática.');
      }

      const mapped = mapSupabasePractice(created as SupabaseLifePlanRow);
      setPlan((current) => [...current, mapped]);
      setFormTitle('');
      setFormDescription('');
      setFormFrequency('daily');
      setFormError(null);
      setStorageWarning(null);
    } catch (error) {
      console.error('Não foi possível adicionar a prática no Supabase.', error);
      setFormError('Não foi possível salvar a prática no Supabase. Tente novamente.');
    }
  }, [formDescription, formFrequency, formTitle, user]);

  const placeholderColor = colorScheme === 'dark' ? 'rgba(244, 251, 255, 0.48)' : 'rgba(4, 48, 73, 0.45)';
  const overlayColor = colorScheme === 'dark' ? Colors.dark.overlay : Colors.light.overlay;

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer} lightColor={Colors.light.background} darkColor={Colors.dark.background}>
        <ActivityIndicator size="large" color={palette.tint} />
        <ThemedText style={styles.loadingText}>Carregando plano de vida...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container} lightColor={Colors.light.background} darkColor={Colors.dark.background}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets
      >
        <View
          style={[
            styles.heroCard,
            {
              borderColor: `${palette.border}66`,
              backgroundColor: colorScheme === 'dark' ? Colors.dark.surfaceMuted : Colors.light.surfaceMuted,
              shadowColor: `${palette.tint}1A`,
            },
          ]}
        >
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.right" size={20} color={palette.icon} style={{ transform: [{ rotate: '180deg' }] }} />
            <ThemedText style={styles.backLabel}>Voltar</ThemedText>
          </Pressable>
          <ThemedText style={styles.heroTitle}>Plano de vida católico</ThemedText>
          <ThemedText style={styles.heroDescription}>
            Organize as práticas espirituais que sustentam a sua caminhada e acompanhe o progresso ao longo do tempo. Ajuste o
            plano conforme suas necessidades e mantenha a constância.
          </ThemedText>
          <View style={[styles.summaryPill, { backgroundColor: overlayColor }]}>
            <ThemedText style={styles.summaryText}>{summaryLabel}</ThemedText>
          </View>
          <ThemedText style={styles.heroTip}>
            Defina metas realistas, mantenha horários fixos e revise o plano periodicamente para crescer com equilíbrio.
          </ThemedText>
          <Pressable
            onPress={handleResetProgress}
            style={({ pressed }) => [
              styles.resetButton,
              {
                borderColor: `${palette.border}80`,
                backgroundColor: pressed
                  ? colorScheme === 'dark'
                    ? `${palette.tint}33`
                    : `${palette.tint}22`
                  : 'transparent',
              },
            ]}
          >
            <MaterialIcons name="refresh" size={20} color={palette.tint} />
            <ThemedText style={styles.resetButtonText}>Reiniciar marcações</ThemedText>
          </Pressable>
        </View>

        {storageWarning ? (
          <View
            style={[
              styles.warningBox,
              {
                borderColor: `${palette.tint}40`,
                backgroundColor: colorScheme === 'dark' ? `${palette.tint}20` : `${palette.tint}15`,
              },
            ]}
          >
            <ThemedText style={styles.warningText}>{storageWarning}</ThemedText>
          </View>
        ) : null}

        <View style={styles.section}>
          <ThemedText type="subtitle">Práticas do seu plano</ThemedText>
          <View style={styles.sectionDescription}>
            <ThemedText style={styles.sectionText}>
              Marque as práticas concluídas no período atual. As marcações diárias, semanais ou mensais são renovadas
              automaticamente no início de um novo período.
            </ThemedText>
          </View>

          {plan.map((practice) => {
            const completed = isPracticeCompleted(practice);

            return (
              <View
                key={practice.id}
                style={[
                  styles.practiceCard,
                  {
                    borderColor: completed ? `${palette.tint}66` : `${palette.border}66`,
                    backgroundColor: colorScheme === 'dark' ? Colors.dark.surface : Colors.light.surface,
                    shadowColor: `${palette.tint}12`,
                  },
                ]}
              >
                <View style={styles.practiceHeader}>
                  <View style={styles.practiceHeaderText}>
                    <ThemedText style={styles.practiceTitle}>{practice.title}</ThemedText>
                    <View
                      style={[
                        styles.frequencyPill,
                        {
                          borderColor: completed ? `${palette.tint}80` : `${palette.border}80`,
                          backgroundColor: completed ? overlayColor : 'transparent',
                        },
                      ]}
                    >
                      <ThemedText style={styles.frequencyLabel}>{FREQUENCY_LABELS[practice.frequency]}</ThemedText>
                    </View>
                  </View>
                  {!practice.isDefault ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Remover ${practice.title}`}
                      onPress={() => confirmRemovePractice(practice)}
                      style={({ pressed }) => [
                        styles.removeButton,
                        { backgroundColor: pressed ? `${palette.border}40` : 'transparent' },
                      ]}
                    >
                      <IconSymbol name="xmark.circle.fill" size={20} color={palette.icon} />
                    </Pressable>
                  ) : null}
                </View>
                {practice.description ? (
                  <ThemedText style={styles.practiceDescription}>{practice.description}</ThemedText>
                ) : null}
                <ThemedText style={styles.practiceHint}>{FREQUENCY_HINTS[practice.frequency]}</ThemedText>
                <Pressable
                  onPress={() => handleTogglePractice(practice.id)}
                  style={({ pressed }) => [
                    styles.completionButton,
                    {
                      borderColor: completed ? `${palette.tint}80` : `${palette.border}80`,
                      backgroundColor: completed
                        ? colorScheme === 'dark'
                          ? `${palette.tint}33`
                          : `${palette.tint}18`
                        : pressed
                        ? colorScheme === 'dark'
                          ? `${palette.border}55`
                          : `${palette.border}33`
                        : 'transparent',
                    },
                  ]}
                >
                  <MaterialIcons
                    name={completed ? 'check-circle' : 'radio-button-unchecked'}
                    size={26}
                    color={completed ? palette.tint : palette.icon}
                  />
                  <ThemedText style={styles.completionText}>
                    {completed ? 'Prática concluída no período atual' : 'Marcar como concluída'}
                  </ThemedText>
                </Pressable>
              </View>
            );
          })}
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle">Adicionar nova prática</ThemedText>
          <View style={styles.sectionDescription}>
            <ThemedText style={styles.sectionText}>
              Personalize o plano incluindo compromissos específicos da sua realidade (por exemplo, um grupo de oração ou um
              serviço pastoral).
            </ThemedText>
          </View>
          <View
            style={[
              styles.sectionCard,
              {
                borderColor: `${palette.border}66`,
                backgroundColor: colorScheme === 'dark' ? Colors.dark.surface : Colors.light.surface,
                shadowColor: `${palette.tint}12`,
              },
            ]}
          >
            <View style={styles.addForm}>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: `${palette.border}99`,
                    backgroundColor: colorScheme === 'dark' ? Colors.dark.surfaceMuted : Colors.light.surfaceMuted,
                    color: palette.text,
                  },
                ]}
                placeholder="Título da prática"
                placeholderTextColor={placeholderColor}
                value={formTitle}
                onChangeText={(value) => {
                  setFormTitle(value);
                  if (formError) {
                    setFormError(null);
                  }
                }}
              />
              <TextInput
                style={[
                  styles.input,
                  styles.textarea,
                  {
                    borderColor: `${palette.border}99`,
                    backgroundColor: colorScheme === 'dark' ? Colors.dark.surfaceMuted : Colors.light.surfaceMuted,
                    color: palette.text,
                  },
                ]}
                placeholder="Descrição (opcional)"
                placeholderTextColor={placeholderColor}
                value={formDescription}
                onChangeText={(value) => setFormDescription(value)}
                multiline
                numberOfLines={4}
              />
              <ThemedText style={styles.formHelper}>Frequência desejada</ThemedText>
              <View style={styles.frequencyRow}>
                {FREQUENCIES.map((frequency) => {
                  const selected = frequency === formFrequency;
                  return (
                    <Pressable
                      key={frequency}
                      onPress={() => setFormFrequency(frequency)}
                      style={({ pressed }) => [
                        styles.frequencyOption,
                        {
                          borderColor: selected ? `${palette.tint}80` : `${palette.border}80`,
                          backgroundColor: selected
                            ? colorScheme === 'dark'
                              ? `${palette.tint}33`
                              : `${palette.tint}22`
                            : pressed
                            ? colorScheme === 'dark'
                              ? `${palette.border}55`
                              : `${palette.border}33`
                            : 'transparent',
                        },
                      ]}
                    >
                      <ThemedText style={[styles.frequencyOptionLabel, selected && { color: palette.tint }]}>
                        {FREQUENCY_LABELS[frequency]}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
              <Pressable
                onPress={handleAddPractice}
                style={({ pressed }) => [
                  styles.addButton,
                  {
                    backgroundColor: pressed ? `${palette.tint}cc` : palette.tint,
                    shadowColor: `${palette.tint}44`,
                  },
                ]}
              >
                <ThemedText style={styles.addButtonText}>Adicionar prática</ThemedText>
              </Pressable>
              {formError ? <ThemedText style={styles.formError}>{formError}</ThemedText> : null}
            </View>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 24,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  heroCard: {
    padding: 20,
    borderRadius: 22,
    borderWidth: 1,
    gap: 16,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 3,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  backLabel: {
    fontSize: 14,
    opacity: 0.8,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  heroDescription: {
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.85,
  },
  summaryPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
  },
  heroTip: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.75,
  },
  resetButton: {
    marginTop: 4,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  warningBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  warningText: {
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    gap: 16,
  },
  sectionDescription: {
    backgroundColor: 'transparent',
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.82,
  },
  practiceCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 14,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 3,
  },
  practiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  practiceHeaderText: {
    flex: 1,
    gap: 8,
  },
  practiceTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  frequencyPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  frequencyLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  practiceDescription: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.85,
  },
  practiceHint: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.7,
  },
  completionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  completionText: {
    fontSize: 15,
    fontWeight: '500',
  },
  sectionCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 16,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 2,
  },
  addForm: {
    gap: 14,
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  textarea: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  formHelper: {
    fontSize: 14,
    fontWeight: '600',
  },
  frequencyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  frequencyOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  frequencyOptionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    marginTop: 4,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 2,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  formError: {
    fontSize: 13,
    color: '#ff4d6d',
  },
  removeButton: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 999,
  },
});
