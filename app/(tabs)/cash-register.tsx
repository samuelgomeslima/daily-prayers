import { memo, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

type SummaryCard = {
  id: string;
  title: string;
  value: string;
  helperText: string;
  accent: string;
};

type PaymentBreakdown = {
  id: string;
  label: string;
  amount: string;
  percentage: string;
  accent: string;
};

type CashMovement = {
  id: string;
  description: string;
  time: string;
  amount: string;
  type: 'credit' | 'debit';
};

type ChecklistItem = {
  id: string;
  title: string;
  status: 'done' | 'pending';
  note?: string;
};

type ShiftNote = {
  id: string;
  operator: string;
  highlight: string;
  timestamp: string;
};

const summaryCards: SummaryCard[] = [
  {
    id: 'balance',
    title: 'Saldo em caixa',
    value: 'R$ 2.450,00',
    helperText: '+8,3% vs. ontem',
    accent: '#0C9D61',
  },
  {
    id: 'entries',
    title: 'Entradas do turno',
    value: 'R$ 6.280,00',
    helperText: '47 vendas finalizadas',
    accent: '#2563EB',
  },
  {
    id: 'withdrawals',
    title: 'Retiradas registradas',
    value: 'R$ 820,00',
    helperText: 'Reposição de troco às 15h',
    accent: '#F97316',
  },
  {
    id: 'pending',
    title: 'Lançamentos pendentes',
    value: '3 ajustes',
    helperText: 'Verificar conferência do cartão',
    accent: '#A855F7',
  },
];

const paymentBreakdown: PaymentBreakdown[] = [
  { id: 'cash', label: 'Dinheiro', amount: 'R$ 1.240,00', percentage: '43%', accent: '#0C9D61' },
  { id: 'pix', label: 'Pix', amount: 'R$ 980,00', percentage: '34%', accent: '#2563EB' },
  { id: 'credit', label: 'Crédito', amount: 'R$ 620,00', percentage: '16%', accent: '#A855F7' },
  { id: 'debit', label: 'Débito', amount: 'R$ 310,00', percentage: '7%', accent: '#F97316' },
];

const cashMovements: CashMovement[] = [
  {
    id: 'sale-1092',
    description: 'Venda #1092 · Kit pastoral jovem',
    time: '17:45',
    amount: '+ R$ 189,90',
    type: 'credit',
  },
  {
    id: 'withdrawal-23',
    description: 'Retirada autorizada · Troco adicional',
    time: '16:10',
    amount: '- R$ 200,00',
    type: 'debit',
  },
  {
    id: 'sale-1089',
    description: 'Venda #1089 · Bíblia de estudo',
    time: '15:32',
    amount: '+ R$ 129,00',
    type: 'credit',
  },
  {
    id: 'donation',
    description: 'Doação espontânea · Grupo de jovens',
    time: '14:57',
    amount: '+ R$ 80,00',
    type: 'credit',
  },
];

const checklist: ChecklistItem[] = [
  {
    id: 'cash-count',
    title: 'Conferir contagem de cédulas e moedas',
    status: 'pending',
    note: 'Solicitar dupla conferência com o coordenador',
  },
  {
    id: 'pix-report',
    title: 'Exportar relatório de Pix do turno',
    status: 'done',
  },
  {
    id: 'deposit',
    title: 'Preparar depósito para tesouraria',
    status: 'pending',
    note: 'Envelope #284 aguarda assinatura',
  },
];

const shiftNotes: ShiftNote[] = [
  {
    id: 'note-1',
    operator: 'João Batista',
    highlight: 'Cliente solicitou NF-e: enviar até amanhã às 10h.',
    timestamp: 'Atualizado às 17:20',
  },
  {
    id: 'note-2',
    operator: 'Ir. Helena',
    highlight: 'Repor terços na vitrine lateral antes da missa das 19h.',
    timestamp: 'Atualizado às 15:05',
  },
];

const quickActions = [
  { id: 'add-sale', label: 'Registrar venda em dinheiro' },
  { id: 'close-shift', label: 'Fechar turno e gerar relatório' },
  { id: 'adjustment', label: 'Lançar ajuste ou retirada' },
];

export default function CashRegisterScreen() {
  const subtleText = useThemeColor({ light: '#64748B', dark: '#94A3B8' }, 'text');
  const mutedText = useThemeColor({ light: '#475569', dark: '#9BA1A6' }, 'text');

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#F3F6F2', dark: '#121610' }}
      headerImage={
        <IconSymbol
          size={320}
          name="banknote.fill"
          color="#799A6A"
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title" style={[styles.title, { fontFamily: Fonts.rounded }]}>
          Caixa do turno
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Acompanhe entradas, retiradas e pendências do turno atual antes do fechamento.
        </ThemedText>
      </ThemedView>

      <Section title="Resumo financeiro">
        <View style={styles.summaryGrid}>
          {summaryCards.map((card) => (
            <SummaryCard key={card.id} card={card} helperColor={subtleText} />
          ))}
        </View>
      </Section>

      <Section title="Formas de pagamento">
        <ThemedView
          style={styles.paymentCard}
          lightColor="#FFFFFF"
          darkColor="#101512">
          {paymentBreakdown.map((method) => (
            <View key={method.id} style={styles.paymentRow}>
              <View style={styles.paymentLabelContainer}>
                <View style={[styles.paymentDot, { backgroundColor: method.accent }]} />
                <ThemedText style={styles.paymentLabel}>{method.label}</ThemedText>
              </View>
              <View style={styles.paymentMetrics}>
                <ThemedText style={styles.paymentAmount}>{method.amount}</ThemedText>
                <ThemedText style={[styles.paymentPercentage, { color: subtleText }]}>
                  {method.percentage}
                </ThemedText>
              </View>
            </View>
          ))}
        </ThemedView>
      </Section>

      <Section title="Lançamentos recentes">
        <ThemedView
          style={styles.movementsCard}
          lightColor="#FFFFFF"
          darkColor="#101512">
          {cashMovements.map((movement) => (
            <MovementRow key={movement.id} movement={movement} subtleColor={subtleText} />
          ))}
        </ThemedView>
      </Section>

      <Section title="Checklist de fechamento">
        <View style={styles.checklistContainer}>
          {checklist.map((item) => (
            <ThemedView
              key={item.id}
              style={[styles.checklistItem, item.status === 'done' && styles.checklistDone]}
              lightColor="#FFFFFF"
              darkColor="#101512">
              <View style={styles.checklistHeader}>
                <View
                  style={[
                    styles.statusBadge,
                    item.status === 'done' ? styles.statusBadgeDone : styles.statusBadgePending,
                  ]}
                >
                  <ThemedText style={styles.statusBadgeLabel}>
                    {item.status === 'done' ? 'Concluído' : 'Pendente'}
                  </ThemedText>
                </View>
                <ThemedText style={styles.checklistTitle}>{item.title}</ThemedText>
              </View>
              {item.note ? (
                <ThemedText style={[styles.checklistNote, { color: mutedText }]}>{item.note}</ThemedText>
              ) : null}
            </ThemedView>
          ))}
        </View>
      </Section>

      <Section title="Recados entre turnos">
        <View style={styles.shiftNotes}>
          {shiftNotes.map((note) => (
            <ThemedView key={note.id} style={styles.shiftNoteCard} lightColor="#F9F7EF" darkColor="#1A170E">
              <ThemedText style={styles.shiftNoteOperator}>{note.operator}</ThemedText>
              <ThemedText style={styles.shiftNoteHighlight}>{note.highlight}</ThemedText>
              <ThemedText style={[styles.shiftNoteTimestamp, { color: subtleText }]}>
                {note.timestamp}
              </ThemedText>
            </ThemedView>
          ))}
        </View>
      </Section>

      <Section title="Ações rápidas">
        <View style={styles.actionsGrid}>
          {quickActions.map((action) => (
            <Pressable
              key={action.id}
              accessibilityRole="button"
              style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
            >
              <ThemedText style={styles.actionButtonLabel}>{action.label}</ThemedText>
            </Pressable>
          ))}
        </View>
      </Section>
    </ParallaxScrollView>
  );
}

type SectionProps = {
  title: string;
  children: ReactNode;
};

function Section({ title, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <ThemedText type="subtitle" style={styles.sectionTitle}>
        {title}
      </ThemedText>
      {children}
    </View>
  );
}

type SummaryCardProps = {
  card: SummaryCard;
  helperColor: string;
};

const SummaryCard = memo(({ card, helperColor }: SummaryCardProps) => {
  return (
    <ThemedView style={styles.summaryCard} lightColor="#FFFFFF" darkColor="#101512">
      <View style={[styles.summaryAccent, { backgroundColor: card.accent }]} />
      <ThemedText style={styles.summaryTitle}>{card.title}</ThemedText>
      <ThemedText style={styles.summaryValue}>{card.value}</ThemedText>
      <ThemedText style={[styles.summaryHelper, { color: helperColor }]}>{card.helperText}</ThemedText>
    </ThemedView>
  );
});

type MovementRowProps = {
  movement: CashMovement;
  subtleColor: string;
};

const MovementRow = memo(({ movement, subtleColor }: MovementRowProps) => {
  const isCredit = movement.type === 'credit';

  return (
    <View style={styles.movementRow}>
      <View style={[styles.movementBadge, isCredit ? styles.movementBadgeCredit : styles.movementBadgeDebit]}>
        <ThemedText style={styles.movementBadgeLabel}>{isCredit ? 'Entrada' : 'Saída'}</ThemedText>
      </View>
      <View style={styles.movementDetails}>
        <ThemedText style={styles.movementDescription}>{movement.description}</ThemedText>
        <ThemedText style={[styles.movementTime, { color: subtleColor }]}>{movement.time}</ThemedText>
      </View>
      <ThemedText style={[styles.movementAmount, isCredit ? styles.creditAmount : styles.debitAmount]}>
        {movement.amount}
      </ThemedText>
    </View>
  );
});

const styles = StyleSheet.create({
  headerImage: {
    position: 'absolute',
    bottom: -80,
    left: -40,
    opacity: 0.35,
  },
  titleContainer: {
    gap: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    lineHeight: 32,
  },
  subtitle: {
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
    gap: 16,
  },
  sectionTitle: {
    fontFamily: Fonts.rounded,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryCard: {
    flexBasis: '48%',
    borderRadius: 18,
    padding: 18,
    gap: 8,
    overflow: 'hidden',
  },
  summaryAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  summaryTitle: {
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  summaryHelper: {
    fontSize: 13,
  },
  paymentCard: {
    borderRadius: 18,
    padding: 18,
    gap: 16,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  paymentDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
  },
  paymentLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  paymentMetrics: {
    alignItems: 'flex-end',
    gap: 4,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  paymentPercentage: {
    fontSize: 13,
  },
  movementsCard: {
    borderRadius: 18,
    padding: 18,
    gap: 14,
  },
  movementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  movementBadge: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  movementBadgeCredit: {
    backgroundColor: '#DCFCE7',
  },
  movementBadgeDebit: {
    backgroundColor: '#FEE2E2',
  },
  movementBadgeLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  movementDetails: {
    flex: 1,
    gap: 4,
  },
  movementDescription: {
    fontSize: 15,
    fontWeight: '600',
  },
  movementTime: {
    fontSize: 13,
  },
  movementAmount: {
    fontSize: 15,
    fontWeight: '600',
  },
  creditAmount: {
    color: '#0C9D61',
  },
  debitAmount: {
    color: '#B91C1C',
  },
  checklistContainer: {
    gap: 12,
  },
  checklistItem: {
    borderRadius: 18,
    padding: 18,
    gap: 10,
  },
  checklistDone: {
    opacity: 0.85,
  },
  checklistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusBadgeDone: {
    backgroundColor: '#DCFCE7',
  },
  statusBadgePending: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgeLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  checklistTitle: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  checklistNote: {
    fontSize: 13,
  },
  shiftNotes: {
    gap: 12,
  },
  shiftNoteCard: {
    borderRadius: 18,
    padding: 18,
    gap: 8,
  },
  shiftNoteOperator: {
    fontFamily: Fonts.rounded,
    fontSize: 16,
  },
  shiftNoteHighlight: {
    fontSize: 15,
    lineHeight: 20,
  },
  shiftNoteTimestamp: {
    fontSize: 13,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flexBasis: '48%',
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: '#0C9D61',
  },
  actionButtonPressed: {
    opacity: 0.85,
  },
  actionButtonLabel: {
    textAlign: 'center',
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

