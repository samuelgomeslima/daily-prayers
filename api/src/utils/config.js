function getContainerName(envKey, fallback) {
  const value = process.env[envKey];
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  return fallback;
}

const containers = {
  users: () => getContainerName('COSMOS_DB_USERS_CONTAINER', 'users'),
  notes: () => getContainerName('COSMOS_DB_NOTES_CONTAINER', 'notes'),
  lifePlans: () => getContainerName('COSMOS_DB_LIFE_PLANS_CONTAINER', 'lifePlans'),
  modelSettings: () => getContainerName('COSMOS_DB_MODEL_SETTINGS_CONTAINER', 'modelSettings'),
};

module.exports = {
  containers,
};
