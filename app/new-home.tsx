import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type MainSectionId = 'overview' | 'guests' | 'registry' | 'venue' | 'new-home' | 'planning';
type NewHomeSectionId = 'monthly-expenses' | 'upfront-costs' | 'furniture';

type Expense = {
  id: string;
  name: string;
  value: number;
  category: string;
};

type ExpenseFormState = {
  name: string;
  value: string;
  category: string;
};

const MAIN_SECTIONS: { id: MainSectionId; label: string }[] = [
  { id: 'overview', label: 'Visão Geral' },
  { id: 'guests', label: 'Convidados' },
  { id: 'registry', label: 'Presentes' },
  { id: 'venue', label: 'Comida e Local' },
  { id: 'new-home', label: 'Nova casa' },
  { id: 'planning', label: 'Planejamento' },
];

const NEW_HOME_SECTIONS: { id: NewHomeSectionId; label: string }[] = [
  { id: 'monthly-expenses', label: 'Gastos mensais' },
  { id: 'upfront-costs', label: 'Custos iniciais' },
  { id: 'furniture', label: 'Mobília e decoração' },
];

const INITIAL_EXPENSES: Expense[] = [
  { id: 'rent', name: 'Aluguel', value: 3050, category: 'Moradia' },
  { id: 'utilities', name: 'Luz + água', value: 420, category: 'Serviços' },
  { id: 'internet', name: 'Internet', value: 120, category: 'Serviços' },
];

function parseExpenseValue(rawValue: string): number {
  if (!rawValue) {
    return Number.NaN;
  }

  const normalized = rawValue
    .trim()
    .replace(/\s+/g, '')
    .replace(/\./g, '')
    .replace(',', '.');

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export default function NewHomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  const [activeSection, setActiveSection] = useState<NewHomeSectionId>('monthly-expenses');
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [isAddExpenseModalVisible, setAddExpenseModalVisible] = useState(false);
  const [expenseForm, setExpenseForm] = useState<ExpenseFormState>({
    name: '',
    value: '',
    category: '',
  });

  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }),
    [],
  );

  const totalMonthlyExpenses = useMemo(
    () => expenses.reduce((sum, expense) => sum + expense.value, 0),
    [expenses],
  );

  const parsedExpenseValue = parseExpenseValue(expenseForm.value);
  const isFormValid =
    expenseForm.name.trim().length > 0 &&
    Number.isFinite(parsedExpenseValue) &&
    parsedExpenseValue > 0;

  const handleOpenAddExpenseModal = () => {
    setAddExpenseModalVisible(true);
  };

  const handleCloseAddExpenseModal = () => {
    setAddExpenseModalVisible(false);
    setExpenseForm({ name: '', value: '', category: '' });
  };

  const handleSubmitExpense = () => {
    if (!isFormValid) {
      return;
    }

    const category = expenseForm.category.trim() || 'Outros';

    setExpenses((previous) => [
      ...previous,
      {
        id: `${Date.now()}`,
        name: expenseForm.name.trim(),
        value: parsedExpenseValue,
        category,
      },
    ]);

    handleCloseAddExpenseModal();
  };

  return (
    <ThemedView
      style={styles.container}
      lightColor={Colors.light.background}
      darkColor={Colors.dark.background}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ThemedText type="title" style={[styles.title, { fontFamily: Fonts.rounded }]}>
            Nova casa
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Centralize os gastos planejados para o novo lar do casal e acompanhe o impacto no orçamento
            mensal.
          </ThemedText>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.mainTabs}
        >
          {MAIN_SECTIONS.map((section) => {
            const isActive = section.id === 'new-home';
            return (
              <Pressable
                key={section.id}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                style={({ pressed }) => [
                  styles.mainTab,
                  {
                    borderColor: isActive ? palette.tint : `${palette.border}80`,
                    backgroundColor: isActive ? `${palette.tint}1F` : 'transparent',
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                disabled={!isActive}
              >
                <ThemedText
                  style={styles.mainTabLabel}
                  lightColor={isActive ? palette.tint : undefined}
                  darkColor={isActive ? palette.tint : undefined}
                >
                  {section.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>

        <ThemedView
          style={styles.sectionCard}
          lightColor={Colors.light.surface}
          darkColor={Colors.dark.surface}
        >
          <View style={styles.sectionTabs}>
            {NEW_HOME_SECTIONS.map((section) => {
              const isActive = section.id === activeSection;
              return (
                <Pressable
                  key={section.id}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                  onPress={() => setActiveSection(section.id)}
                  style={({ pressed }) => [
                    styles.sectionTab,
                    {
                      borderColor: isActive ? palette.tint : `${palette.border}80`,
                      backgroundColor: isActive ? `${palette.tint}1F` : 'transparent',
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <ThemedText
                    style={styles.sectionTabLabel}
                    lightColor={isActive ? palette.tint : undefined}
                    darkColor={isActive ? palette.tint : undefined}
                  >
                    {section.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          {activeSection === 'monthly-expenses' ? (
            <View style={styles.expensesContainer}>
              <View style={styles.expensesHeader}>
                <View>
                  <ThemedText type="subtitle" style={styles.expensesTitle}>
                    Gastos mensais
                  </ThemedText>
                  <ThemedText style={styles.expensesDescription}>
                    Registre contas fixas, assinaturas e outros compromissos que impactam o orçamento
                    recorrente.
                  </ThemedText>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Adicionar gasto mensal"
                  onPress={handleOpenAddExpenseModal}
                  style={({ pressed }) => [
                    styles.addExpenseButton,
                    {
                      backgroundColor: palette.tint,
                      shadowColor: `${palette.tint}33`,
                      transform: [{ scale: pressed ? 0.97 : 1 }],
                    },
                  ]}
                >
                  <IconSymbol name="plus" size={18} color="#ffffff" />
                  <ThemedText style={styles.addExpenseButtonLabel} lightColor="#ffffff" darkColor="#ffffff">
                    Adicionar gasto
                  </ThemedText>
                </Pressable>
              </View>

              <ThemedView
                style={[styles.totalCard, { borderColor: `${palette.border}70` }]}
                lightColor={Colors.light.surfaceMuted}
                darkColor={Colors.dark.surfaceMuted}
              >
                <ThemedText style={styles.totalLabel}>Total mensal</ThemedText>
                <ThemedText type="subtitle" style={styles.totalValue}>
                  {currencyFormatter.format(totalMonthlyExpenses)}
                </ThemedText>
              </ThemedView>

              <View style={styles.expensesList}>
                {expenses.map((expense) => (
                  <ThemedView
                    key={expense.id}
                    style={[
                      styles.expenseItem,
                      {
                        borderColor: `${palette.border}80`,
                        shadowColor: `${palette.tint}14`,
                      },
                    ]}
                    lightColor={Colors.light.surface}
                    darkColor={Colors.dark.surfaceMuted}
                  >
                    <View style={styles.expenseInfo}>
                      <ThemedText style={styles.expenseName}>{expense.name}</ThemedText>
                      <ThemedText
                        style={styles.expenseCategory}
                        lightColor={`${Colors.light.text}80`}
                        darkColor={`${Colors.dark.text}80`}
                      >
                        {expense.category}
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.expenseValue}>
                      {currencyFormatter.format(expense.value)}
                    </ThemedText>
                  </ThemedView>
                ))}
                {expenses.length === 0 && (
                  <ThemedView
                    style={[styles.emptyState, { borderColor: `${palette.border}66` }]}
                    lightColor={Colors.light.surface}
                    darkColor={Colors.dark.surface}
                  >
                    <ThemedText style={styles.emptyStateText}>
                      Ainda não há gastos cadastrados. Adicione o primeiro para acompanhar o impacto no
                      orçamento.
                    </ThemedText>
                  </ThemedView>
                )}
              </View>
            </View>
          ) : (
            <ThemedView
              style={[styles.placeholderCard, { borderColor: `${palette.border}55` }]}
              lightColor={Colors.light.surface}
              darkColor={Colors.dark.surface}
            >
              <IconSymbol name="tray.and.arrow.down" size={28} color={palette.icon} />
              <ThemedText style={styles.placeholderTitle}>Conteúdo em preparação</ThemedText>
              <ThemedText style={styles.placeholderDescription}>
                Esta seção ainda está sendo configurada. Enquanto isso, continue registrando os gastos
                mensais para montar o plano financeiro da casa nova.
              </ThemedText>
            </ThemedView>
          )}
        </ThemedView>
      </ScrollView>

      <Modal
        animationType="fade"
        transparent
        visible={isAddExpenseModalVisible}
        onRequestClose={handleCloseAddExpenseModal}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalScrim} onPress={handleCloseAddExpenseModal} />
          <ThemedView
            style={[styles.modalCard, { borderColor: `${palette.border}80`, shadowColor: `${palette.tint}22` }]}
            lightColor={Colors.light.surface}
            darkColor={Colors.dark.surface}
          >
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle" style={styles.modalTitle}>
                Novo gasto
              </ThemedText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Fechar modal"
                onPress={handleCloseAddExpenseModal}
                style={({ pressed }) => [styles.closeButton, pressed && { opacity: 0.65 }]}
              >
                <IconSymbol name="xmark" size={20} color={palette.icon} />
              </Pressable>
            </View>
            <ThemedText style={styles.modalDescription}>
              Adicione um gasto mensal
            </ThemedText>

            <View style={styles.formField}>
              <ThemedText style={styles.fieldLabel}>Nome</ThemedText>
              <TextInput
                value={expenseForm.name}
                onChangeText={(name) => setExpenseForm((form) => ({ ...form, name }))}
                placeholder="Ex: Aluguel"
                placeholderTextColor={colorScheme === 'dark' ? '#7F94A7' : '#6C7F90'}
                style={[
                  styles.textInput,
                  {
                    borderColor: `${palette.border}80`,
                    backgroundColor:
                      colorScheme === 'dark' ? Colors.dark.surfaceMuted : Colors.light.surfaceMuted,
                    color: palette.text,
                  },
                ]}
              />
            </View>

            <View style={styles.formField}>
              <ThemedText style={styles.fieldLabel}>Valor (R$)</ThemedText>
              <TextInput
                value={expenseForm.value}
                onChangeText={(value) => setExpenseForm((form) => ({ ...form, value }))}
                placeholder="0,00"
                keyboardType="decimal-pad"
                placeholderTextColor={colorScheme === 'dark' ? '#7F94A7' : '#6C7F90'}
                style={[
                  styles.textInput,
                  {
                    borderColor: `${palette.border}80`,
                    backgroundColor:
                      colorScheme === 'dark' ? Colors.dark.surfaceMuted : Colors.light.surfaceMuted,
                    color: palette.text,
                  },
                ]}
              />
            </View>

            <View style={styles.formField}>
              <ThemedText style={styles.fieldLabel}>Categoria</ThemedText>
              <TextInput
                value={expenseForm.category}
                onChangeText={(category) => setExpenseForm((form) => ({ ...form, category }))}
                placeholder="Ex: Moradia"
                placeholderTextColor={colorScheme === 'dark' ? '#7F94A7' : '#6C7F90'}
                style={[
                  styles.textInput,
                  {
                    borderColor: `${palette.border}80`,
                    backgroundColor:
                      colorScheme === 'dark' ? Colors.dark.surfaceMuted : Colors.light.surfaceMuted,
                    color: palette.text,
                  },
                ]}
              />
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Salvar novo gasto mensal"
              onPress={handleSubmitExpense}
              disabled={!isFormValid}
              style={({ pressed }) => [
                styles.submitButton,
                {
                  backgroundColor: palette.tint,
                  opacity: !isFormValid ? 0.45 : pressed ? 0.85 : 1,
                  shadowColor: `${palette.tint}33`,
                },
              ]}
            >
              <ThemedText style={styles.submitButtonLabel} lightColor="#ffffff" darkColor="#ffffff">
                Adicionar
              </ThemedText>
            </Pressable>
          </ThemedView>
        </View>
      </Modal>
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
    gap: 20,
  },
  header: {
    gap: 8,
  },
  title: {
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: 0.4,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.75,
  },
  mainTabs: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 6,
  },
  mainTab: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1,
  },
  mainTabLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  sectionCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    gap: 20,
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 3,
  },
  sectionTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sectionTab: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  sectionTabLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  expensesContainer: {
    gap: 18,
  },
  expensesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 20,
  },
  expensesTitle: {
    fontFamily: Fonts.serif,
    letterSpacing: 0.2,
  },
  expensesDescription: {
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.78,
    marginTop: 4,
  },
  addExpenseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
  },
  addExpenseButtonLabel: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  totalCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 6,
  },
  totalLabel: {
    fontSize: 15,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  totalValue: {
    fontSize: 26,
    fontWeight: '700',
  },
  expensesList: {
    gap: 14,
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 18,
    borderWidth: 1,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 2,
  },
  expenseInfo: {
    gap: 4,
    flexShrink: 1,
  },
  expenseName: {
    fontSize: 17,
    fontWeight: '600',
  },
  expenseCategory: {
    fontSize: 14,
  },
  expenseValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 20,
  },
  emptyStateText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  placeholderCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 2,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholderDescription: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    opacity: 0.8,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4, 48, 73, 0.5)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    padding: 24,
    gap: 16,
    borderWidth: 1,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 18 },
    shadowRadius: 34,
    elevation: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
    borderRadius: 999,
  },
  modalDescription: {
    fontSize: 15,
    opacity: 0.8,
  },
  formField: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  submitButton: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 20,
    elevation: 3,
  },
  submitButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
