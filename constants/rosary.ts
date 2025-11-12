export type MontfortMystery = {
  title: string;
  meditation: string;
  offering: string;
  fruit: string;
};

export type MysterySet = {
  id: 'joyful' | 'luminous' | 'sorrowful' | 'glorious';
  title: string;
  days: string;
  mysteries: MontfortMystery[];
};

export const ROSARY_MYSTERY_SETS: MysterySet[] = [
  {
    id: 'joyful',
    title: 'Mistérios Gozosos',
    days: 'Segunda-feira e Sábado',
    mysteries: [
      {
        title: '1º A Anunciação do Anjo Gabriel a Maria',
        meditation:
          'Contemplemos o anúncio do anjo e a entrega humilde de Nossa Senhora, que acolhe com fé a vontade de Deus.',
        offering:
          'Ofereço-vos, ó meu Jesus, este primeiro mistério em honra da Anunciação; concedei-me, pela intercessão de vossa Mãe Santíssima, a graça de uma humilde docilidade ao vosso querer.',
        fruit: 'Humildade e docilidade à vontade de Deus.',
      },
      {
        title: '2º A visitação de Maria a Santa Isabel',
        meditation:
          'Recordemos Maria, apressada em servir, levando Cristo no ventre e comunicando alegria e esperança à sua parenta Isabel.',
        offering:
          'Ofereço-vos, ó meu Jesus, este segundo mistério em honra da Visitação; que, por Maria, sejamos inflamados na caridade e prontos a servir.',
        fruit: 'Caridade fraterna e serviço generoso.',
      },
      {
        title: '3º O nascimento de Jesus em Belém',
        meditation:
          'Adoremos o Verbo feito carne que nasce pobre em Belém, trazendo luz ao mundo e paz aos corações simples.',
        offering:
          'Ofereço-vos, ó meu Jesus, este terceiro mistério em honra de vosso nascimento; fazei nascer em nós um amor ardente e a graça da pobreza espiritual.',
        fruit: 'Desapego dos bens terrenos e amor à pobreza evangélica.',
      },
      {
        title: '4º A apresentação de Jesus no Templo',
        meditation:
          'Meditamos Maria e José oferecendo o Menino Jesus ao Pai, e Simeão reconhecendo a luz para todas as nações.',
        offering:
          'Ofereço-vos, ó meu Jesus, este quarto mistério em honra de vossa Apresentação; concedei-nos a graça da obediência e da pureza de intenção.',
        fruit: 'Pureza e obediência à vontade divina.',
      },
      {
        title: '5º O reencontro de Jesus no Templo',
        meditation:
          'Contemplemos Maria e José procurando Jesus com dor e alegria ao encontrá-lo entre os doutores, cuidando das coisas do Pai.',
        offering:
          'Ofereço-vos, ó meu Jesus, este quinto mistério em honra de vosso reencontro no Templo; alcançai-nos um ardoroso zelo pelas coisas de Deus.',
        fruit: 'Busca incessante por Jesus e fidelidade à missão divina.',
      },
    ],
  },
  {
    id: 'luminous',
    title: 'Mistérios Luminosos',
    days: 'Quinta-feira',
    mysteries: [
      {
        title: '1º O Batismo de Jesus no Jordão',
        meditation:
          'Contemplemos Jesus humildemente nas águas do Jordão, o Pai que o proclama Filho amado e o Espírito que o unge para a missão.',
        offering:
          'Ofereço-vos, ó meu Jesus, este primeiro mistério luminoso em honra de vosso Batismo; renovai em nós a graça batismal e a fidelidade à vocação cristã.',
        fruit: 'Fidelidade às promessas batismais.',
      },
      {
        title: '2º As Bodas de Caná',
        meditation:
          'Vejamos Maria intercedendo pelos esposos e Jesus transformando água em vinho, manifestando o primeiro sinal de sua glória.',
        offering:
          'Ofereço-vos, ó meu Jesus, este segundo mistério luminoso em honra das Bodas de Caná; dai-nos, por Maria, a graça de confiar plenamente em vossa providência.',
        fruit: 'Confiança na intercessão de Maria e espírito de serviço.',
      },
      {
        title: '3º O anúncio do Reino de Deus com o convite à conversão',
        meditation:
          'Escutemos Jesus pregando o Reino, perdoando pecadores e chamando todos à conversão sincera do coração.',
        offering:
          'Ofereço-vos, ó meu Jesus, este terceiro mistério luminoso em honra do anúncio do Reino; infundi em nós arrependimento verdadeiro e sede de santidade.',
        fruit: 'Conversão permanente e ardor missionário.',
      },
      {
        title: '4º A Transfiguração de Jesus',
        meditation:
          'Admiremos Cristo glorioso no Tabor, que fortalece os discípulos com a visão de sua glória antes da cruz.',
        offering:
          'Ofereço-vos, ó meu Jesus, este quarto mistério luminoso em honra de vossa Transfiguração; concedei-nos crescer na esperança e na contemplação de vosso rosto.',
        fruit: 'Desejo da santidade e gosto pela oração.',
      },
      {
        title: '5º A instituição da Eucaristia',
        meditation:
          'Adoremos Jesus que se entrega como Pão vivo, deixando-nos a Eucaristia como memorial de sua paixão e presença real.',
        offering:
          'Ofereço-vos, ó meu Jesus, este quinto mistério luminoso em honra da instituição da Eucaristia; dai-nos um amor ardente ao Santíssimo Sacramento.',
        fruit: 'Amor e reparação a Jesus Eucarístico.',
      },
    ],
  },
  {
    id: 'sorrowful',
    title: 'Mistérios Dolorosos',
    days: 'Terça-feira e Sexta-feira',
    mysteries: [
      {
        title: '1º A agonia de Jesus no Horto',
        meditation:
          'Contemplemos Jesus em agonia no Getsêmani, aceitando o cálice da paixão por amor à humanidade.',
        offering:
          'Ofereço-vos, ó meu Jesus, este primeiro mistério doloroso em honra de vossa agonia; concedei-nos a graça de uma sincera contrição pelos pecados.',
        fruit: 'Contrição e conformidade com a vontade de Deus.',
      },
      {
        title: '2º A flagelação de Jesus atado à coluna',
        meditation:
          'Vejamos o Senhor flagelado, suportando golpes cruelmente por nossos pecados e curando-nos com suas chagas.',
        offering:
          'Ofereço-vos, ó meu Jesus, este segundo mistério doloroso em honra de vossa flagelação; fazei-nos puros de corpo e alma.',
        fruit: 'Pureza e mortificação dos sentidos.',
      },
      {
        title: '3º A coroação de espinhos',
        meditation:
          'Meditamos Jesus sendo escarnecido e coroado de espinhos, Rei de amor que reina da cruz.',
        offering:
          'Ofereço-vos, ó meu Jesus, este terceiro mistério doloroso em honra de vossa coroação; concedei-nos a graça da humildade e do desprezo pelas vaidades do mundo.',
        fruit: 'Desapego do mundo e humildade profunda.',
      },
      {
        title: '4º Jesus carrega a cruz até o Calvário',
        meditation:
          'Sigamos o Senhor que leva a cruz com paciência, caindo e levantando-se, sustentado pelo amor redentor.',
        offering:
          'Ofereço-vos, ó meu Jesus, este quarto mistério doloroso em honra de vossa subida ao Calvário; fortalecei-nos na paciência e na coragem para carregar nossas cruzes.',
        fruit: 'Paciência e fortaleza nas provações.',
      },
      {
        title: '5º A crucifixão e morte de Jesus',
        meditation:
          'Adoremos Jesus crucificado, que entrega a vida por nós e abre as portas da salvação.',
        offering:
          'Ofereço-vos, ó meu Jesus, este quinto mistério doloroso em honra de vossa crucifixão; inflamai-nos de amor à cruz e de zelo pela salvação das almas.',
        fruit: 'Amor a Jesus crucificado e zelo apostólico.',
      },
    ],
  },
  {
    id: 'glorious',
    title: 'Mistérios Gloriosos',
    days: 'Quarta-feira e Domingo',
    mysteries: [
      {
        title: '1º A ressurreição do Senhor',
        meditation:
          'Contemplemos Cristo ressuscitado, vencedor da morte, trazendo esperança nova a toda a criação.',
        offering:
          'Ofereço-vos, ó meu Jesus, este primeiro mistério glorioso em honra de vossa ressurreição; aumentai em nós a fé na vida eterna.',
        fruit: 'Fé viva e alegria pascal.',
      },
      {
        title: '2º A ascensão de Jesus aos céus',
        meditation:
          'Vejamos Jesus subindo ao céu, abrindo-nos o caminho para a casa do Pai e prometendo o Espírito Santo.',
        offering:
          'Ofereço-vos, ó meu Jesus, este segundo mistério glorioso em honra de vossa ascensão; fazei crescer em nós o desejo das coisas do alto.',
        fruit: 'Desejo do céu e desapego da terra.',
      },
      {
        title: '3º A vinda do Espírito Santo em Pentecostes',
        meditation:
          'Meditamos o Espírito Santo descendo sobre Maria e os apóstolos, inflamando-os para a missão.',
        offering:
          'Ofereço-vos, ó meu Jesus, este terceiro mistério glorioso em honra de Pentecostes; enviai-nos o vosso Espírito para que vivamos em santidade.',
        fruit: 'Fervor apostólico e docilidade ao Espírito Santo.',
      },
      {
        title: '4º A assunção de Maria ao céu',
        meditation:
          'Contemplemos a Virgem elevada em corpo e alma à glória celeste, primícias da Igreja triunfante.',
        offering:
          'Ofereço-vos, ó meu Jesus, este quarto mistério glorioso em honra da Assunção de Maria; concedei-nos a graça de uma santa perseverança.',
        fruit: 'Graça da boa morte e perseverança final.',
      },
      {
        title: '5º A coroação de Maria como Rainha do Céu e da Terra',
        meditation:
          'Vejamos Nossa Senhora coroada Rainha, intercedendo por seus filhos e conduzindo-os ao Reino eterno.',
        offering:
          'Ofereço-vos, ó meu Jesus, este quinto mistério glorioso em honra da coroação de Maria; tornai-nos dignos de sua proteção materna.',
        fruit: 'Devoção filial a Maria e confiança em sua intercessão.',
      },
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
