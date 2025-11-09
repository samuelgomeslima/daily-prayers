const crypto = require('crypto');

const { containers } = require('../utils/config');
const {
  createDocument,
  deleteDocument,
  queryDocuments,
  readDocument,
  replaceDocument,
} = require('../utils/cosmos');

function sanitizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

async function listNotes(userId) {
  const containerId = containers.notes();
  const query = 'SELECT * FROM c WHERE c.userId = @userId';
  const parameters = [{ name: '@userId', value: userId }];
  const results = await queryDocuments(containerId, query, parameters, { partitionKey: userId });

  return Array.isArray(results)
    ? results.map((note) => ({
        id: note.id,
        title: typeof note.title === 'string' ? note.title : '',
        content: typeof note.content === 'string' ? note.content : '',
        updatedAt: note.updatedAt || note.createdAt || new Date().toISOString(),
        createdAt: note.createdAt || note.updatedAt || new Date().toISOString(),
      }))
    : [];
}

async function createNote(userId, { title, content }) {
  const containerId = containers.notes();
  const now = new Date().toISOString();
  const document = {
    id: crypto.randomUUID(),
    userId,
    title: sanitizeText(title),
    content: sanitizeText(content),
    createdAt: now,
    updatedAt: now,
  };

  const created = await createDocument(containerId, document, userId);
  return created;
}

async function updateNote(userId, noteId, { title, content }) {
  const containerId = containers.notes();

  let existing;
  try {
    existing = await readDocument(containerId, noteId, userId);
  } catch (error) {
    if (error && typeof error.status === 'number' && error.status === 404) {
      return null;
    }

    throw error;
  }

  const updated = {
    ...existing,
    title: sanitizeText(title),
    content: sanitizeText(content),
    updatedAt: new Date().toISOString(),
  };

  const replaced = await replaceDocument(containerId, noteId, updated, userId);
  return replaced;
}

async function removeNote(userId, noteId) {
  const containerId = containers.notes();

  try {
    await deleteDocument(containerId, noteId, userId);
    return true;
  } catch (error) {
    if (error && typeof error.status === 'number' && error.status === 404) {
      return false;
    }

    throw error;
  }
}

module.exports = {
  createNote,
  listNotes,
  removeNote,
  updateNote,
};
