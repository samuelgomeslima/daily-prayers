const fs = require('node:fs/promises');
const path = require('node:path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const STORE_FILE = path.join(DATA_DIR, 'conversations.json');

const ensureStoreReady = async () => {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(STORE_FILE);
  } catch {
    await fs.writeFile(STORE_FILE, JSON.stringify({}), 'utf8');
  }
};

const readStore = async () => {
  await ensureStoreReady();

  try {
    const raw = await fs.readFile(STORE_FILE, 'utf8');
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);

    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed;
    }

    return {};
  } catch (error) {
    console.warn('Failed to read conversation store. Resetting file.', error);
    await fs.writeFile(STORE_FILE, JSON.stringify({}), 'utf8');
    return {};
  }
};

const writeStore = async (store) => {
  await ensureStoreReady();
  await fs.writeFile(STORE_FILE, JSON.stringify(store), 'utf8');
};

const buildKey = (conversationId, agent) => {
  const normalizedId = conversationId?.trim();
  if (!normalizedId) {
    return null;
  }

  const normalizedAgent = agent?.trim();
  return normalizedAgent ? `${normalizedAgent}:${normalizedId}` : normalizedId;
};

const getConversation = async (conversationId, agent) => {
  const key = buildKey(conversationId, agent);

  if (!key) {
    return [];
  }

  const store = await readStore();
  const history = store[key];

  return Array.isArray(history) ? history : [];
};

const setConversation = async (conversationId, agent, messages) => {
  const key = buildKey(conversationId, agent);

  if (!key) {
    return;
  }

  const store = await readStore();
  store[key] = messages;
  await writeStore(store);
};

module.exports = {
  getConversation,
  setConversation,
};
