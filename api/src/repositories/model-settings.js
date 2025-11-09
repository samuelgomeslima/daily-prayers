const { containers } = require('../utils/config');
const { readDocument, upsertDocument } = require('../utils/cosmos');

const AVAILABLE_MODELS = ['gpt-5-mini', 'gpt-4o-mini'];
const DEFAULT_SETTINGS = {
  catechistModel: 'gpt-4o-mini',
  chatModel: 'gpt-4o-mini',
};

function sanitizeModel(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();

  return AVAILABLE_MODELS.includes(normalized) ? normalized : null;
}

function sanitizeSettings(settings) {
  const catechistModel = sanitizeModel(settings?.catechistModel) ?? DEFAULT_SETTINGS.catechistModel;
  const chatModel = sanitizeModel(settings?.chatModel) ?? DEFAULT_SETTINGS.chatModel;

  return {
    catechistModel,
    chatModel,
  };
}

async function getModelSettings(userId) {
  const containerId = containers.modelSettings();

  try {
    const settings = await readDocument(containerId, userId, userId);
    return sanitizeSettings(settings);
  } catch (error) {
    if (error && typeof error.status === 'number' && error.status === 404) {
      return null;
    }

    throw error;
  }
}

async function saveModelSettings(userId, settings) {
  const containerId = containers.modelSettings();
  const sanitized = sanitizeSettings(settings);
  const now = new Date().toISOString();
  const payload = {
    id: userId,
    userId,
    ...sanitized,
    updatedAt: now,
  };

  const result = await upsertDocument(containerId, payload, userId);
  return result;
}

module.exports = {
  AVAILABLE_MODELS,
  DEFAULT_SETTINGS,
  getModelSettings,
  saveModelSettings,
  sanitizeSettings,
};
