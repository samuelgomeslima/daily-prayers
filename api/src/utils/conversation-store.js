const fs = require('node:fs/promises');
const path = require('node:path');

const STORE_FILE_NAME = 'conversations.json';
const DEFAULT_DATA_DIR = path.join(__dirname, '..', '..', 'data');
const TEMP_DIR = path.join(
  process.env.CONVERSATION_STORE_TMP ?? process.env.TEMP ?? process.env.TMP ?? '/tmp',
  'daily-prayers'
);

let storeFilePath;
let initializingStorePromise;

const getCandidateDirectories = () => {
  const candidates = [process.env.CONVERSATION_STORE_DIR, DEFAULT_DATA_DIR, TEMP_DIR];

  return candidates
    .filter((dir) => typeof dir === 'string' && dir.trim().length > 0)
    .map((dir) => path.resolve(dir));
};

const ensureStoreReady = async () => {
  if (storeFilePath) {
    return storeFilePath;
  }

  if (initializingStorePromise) {
    return initializingStorePromise;
  }

  initializingStorePromise = (async () => {
    const attempted = new Set();
    let lastError;

    for (const dir of getCandidateDirectories()) {
      if (attempted.has(dir)) {
        continue;
      }

      attempted.add(dir);

      try {
        await fs.mkdir(dir, { recursive: true });
        const filePath = path.join(dir, STORE_FILE_NAME);

        try {
          await fs.access(filePath);
        } catch {
          await fs.writeFile(filePath, JSON.stringify({}), 'utf8');
        }

        storeFilePath = filePath;
        return storeFilePath;
      } catch (error) {
        lastError = error;
        console.warn(`Failed to initialize conversation store at "${dir}".`, error);
      }
    }

    throw lastError ?? new Error('Unable to initialize a conversation store location.');
  })();

  try {
    return await initializingStorePromise;
  } finally {
    initializingStorePromise = null;
  }
};

const readStore = async () => {
  const filePath = await ensureStoreReady();

  try {
    const raw = await fs.readFile(filePath, 'utf8');
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
    await fs.writeFile(filePath, JSON.stringify({}), 'utf8');
    return {};
  }
};

const writeStore = async (store) => {
  const filePath = await ensureStoreReady();
  await fs.writeFile(filePath, JSON.stringify(store), 'utf8');
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

  try {
    const store = await readStore();
    const history = store[key];

    return Array.isArray(history) ? history : [];
  } catch (error) {
    console.warn('Conversation store unavailable. Returning empty history.', error);
    return [];
  }
};

const setConversation = async (conversationId, agent, messages) => {
  const key = buildKey(conversationId, agent);

  if (!key) {
    return;
  }

  try {
    const store = await readStore();
    store[key] = messages;
    await writeStore(store);
  } catch (error) {
    console.warn('Failed to persist conversation history. Continuing without persistence.', error);
  }
};

module.exports = {
  getConversation,
  setConversation,
};
