export type MysterySet = {
  id: 'joyful' | 'luminous' | 'sorrowful' | 'glorious';
  title: string;
  days: string;
  mysteries: string[];
};

export const ROSARY_MYSTERY_SETS: MysterySet[] = [
  {
    id: 'joyful',
    title: 'Mistérios Gozosos',
    days: 'Segunda-feira e Sábado',
    mysteries: [
      '1º A Anunciação do Anjo Gabriel a Maria',
      '2º A visitação de Maria a Santa Isabel',
      '3º O nascimento de Jesus em Belém',
      '4º A apresentação de Jesus no Templo',
      '5º O reencontro de Jesus no Templo',
    ],
  },
  {
    id: 'luminous',
    title: 'Mistérios Luminosos',
    days: 'Quinta-feira',
    mysteries: [
      '1º O Batismo de Jesus no Jordão',
      '2º As Bodas de Caná',
      '3º O anúncio do Reino de Deus com o convite à conversão',
      '4º A Transfiguração de Jesus',
      '5º A instituição da Eucaristia',
    ],
  },
  {
    id: 'sorrowful',
    title: 'Mistérios Dolorosos',
    days: 'Terça-feira e Sexta-feira',
    mysteries: [
      '1º A agonia de Jesus no Horto',
      '2º A flagelação de Jesus atado à coluna',
      '3º A coroação de espinhos',
      '4º Jesus carrega a cruz até o Calvário',
      '5º A crucifixão e morte de Jesus',
    ],
  },
  {
    id: 'glorious',
    title: 'Mistérios Gloriosos',
    days: 'Quarta-feira e Domingo',
    mysteries: [
      '1º A ressurreição do Senhor',
      '2º A ascensão de Jesus aos céus',
      '3º A vinda do Espírito Santo em Pentecostes',
      '4º A assunção de Maria ao céu',
      '5º A coroação de Maria como Rainha do Céu e da Terra',
    ],
  },
];

export const SAO_PAULO_TIME_ZONE = 'America/Sao_Paulo';

const WEEKDAY_TO_SET_ID: Record<string, MysterySet['id']> = {
  Sunday: 'glorious',
  Monday: 'joyful',
  Tuesday: 'sorrowful',
  Wednesday: 'glorious',
  Thursday: 'luminous',
  Friday: 'sorrowful',
  Saturday: 'joyful',
};

export function getTodayMysterySetId(sets: MysterySet[]): MysterySet['id'] | '' {
  if (sets.length === 0) {
    return '';
  }

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      timeZone: SAO_PAULO_TIME_ZONE,
    });
    const weekday = formatter.format(new Date());
    const mappedId = WEEKDAY_TO_SET_ID[weekday];

    if (!mappedId) {
      return sets[0]?.id ?? '';
    }

    return sets.find((set) => set.id === mappedId)?.id ?? sets[0]?.id ?? '';
  } catch (error) {
    return sets[0]?.id ?? '';
  }
}

export function getTodayMysterySet(sets: MysterySet[]): MysterySet | undefined {
  const todayId = getTodayMysterySetId(sets);
  if (!todayId) {
    return sets[0];
  }

  return sets.find((set) => set.id === todayId) ?? sets[0];
}
