const { containers } = require('../utils/config');
const { readDocument, upsertDocument } = require('../utils/cosmos');

const DEFAULT_PRACTICES = [
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

function createDefaultPlan(userId) {
  const now = new Date().toISOString();
  return {
    id: userId,
    userId,
    version: 1,
    updatedAt: now,
    practices: DEFAULT_PRACTICES.map((practice) => ({
      ...practice,
      completedPeriods: [],
    })),
  };
}

async function getLifePlan(userId) {
  const containerId = containers.lifePlans();

  try {
    const plan = await readDocument(containerId, userId, userId);
    return plan;
  } catch (error) {
    if (error && typeof error.status === 'number' && error.status === 404) {
      return null;
    }

    throw error;
  }
}

async function saveLifePlan(userId, plan) {
  const containerId = containers.lifePlans();
  const payload = {
    id: userId,
    userId,
    version: typeof plan?.version === 'number' ? plan.version : 1,
    updatedAt: new Date().toISOString(),
    practices: Array.isArray(plan?.practices) ? plan.practices : [],
  };

  const result = await upsertDocument(containerId, payload, userId);
  return result;
}

module.exports = {
  createDefaultPlan,
  getLifePlan,
  saveLifePlan,
};
