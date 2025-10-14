import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ComponentProps, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type IconName = ComponentProps<typeof IconSymbol>['name'];

type RoutineTask = {
  id: string;
  title: string;
  detail: string;
};

type RoutineSection = {
  id: string;
  title: string;
  description: string;
  icon: IconName;
  lightColor: string;
  darkColor: string;
  tasks: readonly RoutineTask[];
};

const ROUTINE_SECTIONS = [
  {
    id: 'morning',
    title: 'Manhã consagrada',
    description:
      'Entregue os primeiros minutos ao Senhor e programe o coração para viver em estado de graça.',
    icon: 'sun.max.fill',
    lightColor: '#FFF5E5',
    darkColor: '#2A1F0F',
    tasks: [
      {
        id: 'offering',
        title: 'Oferecimento diário',
        detail: 'Reze o oferecimento ao Sagrado Coração e peça que cada ato do dia seja oração.',
      },
      {
        id: 'lectio',
        title: 'Lectio Divina do Evangelho',
        detail: 'Leia o Evangelho do dia, medite em silêncio e anote uma palavra que lhe toque.',
      },
      {
        id: 'morning-rosary',
        title: 'Mistério do Rosário',
        detail: 'Reze ao menos um mistério agradecendo pela nova manhã e intercedendo pela família.',
      },
    ],
  },
  {
    id: 'midday',
    title: 'Meio do dia',
    description:
      'Uma pausa rápida para recordar a presença de Deus e alinhar a rotina ao propósito eterno.',
    icon: 'clock.fill',
    lightColor: '#E8F4FF',
    darkColor: '#102031',
    tasks: [
      {
        id: 'angelus',
        title: 'Oração do Angelus',
        detail: 'Reze o Angelus (ou Regina Caeli no Tempo Pascal) unindo-se à Igreja inteira.',
      },
      {
        id: 'gratitude',
        title: 'Agradecimento breve',
        detail: 'Reconheça um dom recebido nessa manhã e ofereça uma jaculatória de louvor.',
      },
      {
        id: 'fraternal-charity',
        title: 'Gesto concreto de caridade',
        detail: 'Envie uma mensagem, faça uma ligação ou ofereça ajuda a alguém que precise.',
      },
    ],
  },
  {
    id: 'evening',
    title: 'Noite e descanso',
    description:
      'Feche o dia diante de Deus, peça perdão e prepare-se para descansar na Sua misericórdia.',
    icon: 'moon.stars.fill',
    lightColor: '#F2ECFF',
    darkColor: '#1F1530',
    tasks: [
      {
        id: 'examination',
        title: 'Exame de consciência',
        detail: 'Revise os acontecimentos, agradeça as graças e reconheça onde precisa de conversão.',
      },
      {
        id: 'act-of-contrition',
        title: 'Ato de contrição',
        detail: 'Faça um ato de contrição sincero e, se necessário, programe-se para a confissão.',
      },
      {
        id: 'night-blessing',
        title: 'Benção da família',
        detail: 'Reze com quem mora consigo e confie o sono aos cuidados da Virgem Maria.',
      },
    ],
  },
] as const satisfies readonly RoutineSection[];

type TaskId = (typeof ROUTINE_SECTIONS)[number]['tasks'][number]['id'];
type RoutineState = Record<TaskId, boolean>;

const createInitialState = (): RoutineState =>
  ROUTINE_SECTIONS.reduce((state, section) => {
    section.tasks.forEach((task) => {
      state[task.id] = false;
    });

    return state;
  }, {} as RoutineState);

export default function LifePlanScreen() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const [completedTasks, setCompletedTasks] = useState<RoutineState>(() => createInitialState());
  const totalCompleted = useMemo(
    () => Object.values(completedTasks).filter(Boolean).length,
    [completedTasks],
  );
  const totalTasks = ROUTINE_SECTIONS.reduce((count, section) => count + section.tasks.length, 0);

  const toggleTask = (taskId: TaskId) => {
    setCompletedTasks((previous) => ({
      ...previous,
      [taskId]: !previous[taskId],
    }));
  };

  const resetRoutine = () => {
    setCompletedTasks(createInitialState());
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#FFE9D2', dark: '#1A1410' }}
      headerImage={
        <IconSymbol
          name="sun.max.fill"
          size={280}
          color={colorScheme === 'dark' ? '#F0CF9F' : '#F7A44B'}
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title" style={[styles.title, { color: palette.text }]}>Pano de Vida</ThemedText>
        <ThemedText style={styles.lead}>
          Um roteiro diário de oração para atravessar o dia unido a Cristo. Toque em cada compromisso
          para registrar que ele já foi rezado e acompanhe o seu avanço ao longo do dia.
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.summaryCard} lightColor="#EBF4FF" darkColor="#121E2E">
        <ThemedText type="subtitle" style={styles.summaryTitle}>
          Como aproveitar bem
        </ThemedText>
        <ThemedText style={styles.summaryDescription}>
          Escolha um horário fixo para rever este pano e peça a assistência do Espírito Santo antes de
          começar. Se perder o ritmo, toque em “Reiniciar dia” e recomece com serenidade.
        </ThemedText>
        <Pressable
          accessibilityRole="button"
          onPress={resetRoutine}
          style={({ pressed }) => [
            styles.resetButton,
            {
              backgroundColor: palette.tint,
              opacity: pressed ? 0.85 : 1,
            },
          ]}>
          <MaterialIcons name="refresh" size={18} color="#fff" />
          <ThemedText style={styles.resetLabel} lightColor="#FFFFFF" darkColor="#FFFFFF">
            Reiniciar dia
          </ThemedText>
          <View style={styles.resetCounter}>
            <ThemedText style={styles.resetCounterText} lightColor="#FFFFFF" darkColor="#FFFFFF">
              {totalCompleted}/{totalTasks}
            </ThemedText>
          </View>
        </Pressable>
      </ThemedView>

      {ROUTINE_SECTIONS.map((section) => {
        const completedInSection = section.tasks.filter((task) => completedTasks[task.id]).length;
        const progress = section.tasks.length > 0 ? completedInSection / section.tasks.length : 0;

        return (
          <ThemedView
            key={section.id}
            style={styles.sectionCard}
            lightColor={section.lightColor}
            darkColor={section.darkColor}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <IconSymbol
                  name={section.icon}
                  size={26}
                  color={colorScheme === 'dark' ? '#F8EACC' : '#E48234'}
                />
              </View>
              <View style={styles.sectionHeading}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  {section.title}
                </ThemedText>
                <ThemedText style={styles.sectionDescription}>{section.description}</ThemedText>
              </View>
              <View
                style={[
                  styles.sectionChip,
                  {
                    borderColor: palette.tint,
                    backgroundColor:
                      colorScheme === 'dark' ? 'rgba(10, 126, 164, 0.18)' : 'rgba(10, 126, 164, 0.12)',
                  },
                ]}>
                <ThemedText
                  style={styles.sectionChipText}
                  lightColor={palette.tint}
                  darkColor={palette.tint}>
                  {completedInSection}/{section.tasks.length}
                </ThemedText>
              </View>
            </View>

            <View style={styles.progressBlock}>
              <View
                style={[
                  styles.progressTrack,
                  {
                    backgroundColor:
                      colorScheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
                  },
                ]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progress * 100}%`,
                      backgroundColor: palette.tint,
                    },
                  ]}
                />
              </View>
              <ThemedText style={styles.progressLabel}>
                {completedInSection === section.tasks.length
                  ? 'Momento completo! Agradeça a Deus por esta fidelidade.'
                  : `Faltam ${section.tasks.length - completedInSection} compromissos para completar este período.`}
              </ThemedText>
            </View>

            <View style={styles.tasksContainer}>
              {section.tasks.map((task) => {
                const isDone = completedTasks[task.id];

                return (
                  <Pressable
                    key={task.id}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isDone }}
                    accessibilityHint="Toque para alternar este compromisso"
                    onPress={() => toggleTask(task.id)}
                    style={({ pressed }) => [
                      styles.taskRow,
                      {
                        backgroundColor:
                          colorScheme === 'dark'
                            ? isDone
                              ? 'rgba(10, 126, 164, 0.22)'
                              : 'rgba(12, 18, 27, 0.6)'
                            : isDone
                              ? 'rgba(10, 126, 164, 0.12)'
                              : 'rgba(255, 255, 255, 0.92)',
                        borderColor: isDone ? palette.tint : 'transparent',
                      },
                      pressed && styles.taskRowPressed,
                    ]}>
                    <View style={styles.checkmarkBox}>
                      <MaterialIcons
                        name={isDone ? 'check-circle' : 'radio-button-unchecked'}
                        size={26}
                        color={isDone ? palette.tint : palette.icon}
                      />
                    </View>
                    <View style={styles.taskTextBlock}>
                      <ThemedText style={styles.taskTitle}>
                        {task.title}
                      </ThemedText>
                      <ThemedText style={styles.taskDetail}>{task.detail}</ThemedText>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </ThemedView>
        );
      })}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    position: 'absolute',
    bottom: -70,
    left: -30,
    opacity: 0.35,
  },
  titleContainer: {
    gap: 12,
    marginBottom: 18,
  },
  title: {
    fontFamily: Fonts.rounded,
  },
  lead: {
    lineHeight: 22,
  },
  summaryCard: {
    padding: 20,
    borderRadius: 20,
    gap: 12,
    marginBottom: 24,
  },
  summaryTitle: {
    fontFamily: Fonts.rounded,
  },
  summaryDescription: {
    lineHeight: 22,
  },
  resetButton: {
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
  },
  resetLabel: {
    fontWeight: '600',
  },
  resetCounter: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  resetCounterText: {
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  sectionCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  sectionIcon: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.32)',
  },
  sectionHeading: {
    flex: 1,
    gap: 4,
  },
  sectionTitle: {
    fontFamily: Fonts.serif,
  },
  sectionDescription: {
    lineHeight: 20,
  },
  sectionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  sectionChipText: {
    fontWeight: '600',
    fontSize: 13,
  },
  progressBlock: {
    gap: 8,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  progressLabel: {
    fontSize: 14,
    lineHeight: 18,
  },
  tasksContainer: {
    gap: 12,
  },
  taskRow: {
    flexDirection: 'row',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
    borderWidth: 1,
  },
  taskRowPressed: {
    transform: [{ scale: 0.99 }],
  },
  checkmarkBox: {
    paddingTop: 2,
  },
  taskTextBlock: {
    flex: 1,
    gap: 4,
  },
  taskTitle: {
    fontFamily: Fonts.rounded,
    fontSize: 16,
  },
  taskDetail: {
    lineHeight: 20,
    fontSize: 14,
  },
});
