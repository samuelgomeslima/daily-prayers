import { useCallback, useEffect, useRef, useState } from 'react';
import * as FileSystem from 'expo-file-system';

type ConversationMessage = { id?: string };

type UsePersistentConversationOptions<T extends ConversationMessage> = {
  storageKey: string;
  initialMessages: T[];
  autoGenerateConversationId?: boolean;
};

type StoragePaths = {
  messagesPath: string;
  metaPath: string;
};

const DIRECTORY_NAME = 'conversations';

const ensureDirectoryAsync = async (): Promise<string> => {
  const baseDirectory = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;

  if (!baseDirectory) {
    throw new Error('No writable directory available for persistent conversations.');
  }

  const normalizedBase = baseDirectory.endsWith('/') ? baseDirectory : `${baseDirectory}/`;
  const directory = `${normalizedBase}${DIRECTORY_NAME}`;

  try {
    await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.toLowerCase().includes('already exists')) {
      throw error;
    }
  }

  return directory.endsWith('/') ? directory : `${directory}/`;
};

const sanitizeKey = (key: string) => {
  return key.replace(/[^a-z0-9-_]/gi, '_').toLowerCase();
};

const getStoragePathsAsync = async (storageKey: string): Promise<StoragePaths> => {
  const directory = await ensureDirectoryAsync();
  const sanitizedKey = sanitizeKey(storageKey);

  return {
    messagesPath: `${directory}${sanitizedKey}-messages.json`,
    metaPath: `${directory}${sanitizedKey}-meta.json`,
  };
};

const generateConversationId = () => {
  if (typeof globalThis?.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  const randomSuffix = Math.random().toString(16).slice(2, 10);
  return `conv-${Date.now()}-${randomSuffix}`;
};

const writeMessagesAsync = async (paths: StoragePaths, messages: unknown) => {
  try {
    await FileSystem.writeAsStringAsync(paths.messagesPath, JSON.stringify(messages));
  } catch (error) {
    console.warn('Failed to persist conversation messages.', error);
  }
};

const writeConversationIdAsync = async (paths: StoragePaths, conversationId: string | null) => {
  try {
    if (conversationId) {
      await FileSystem.writeAsStringAsync(
        paths.metaPath,
        JSON.stringify({ conversationId })
      );
    } else {
      await FileSystem.deleteAsync(paths.metaPath, { idempotent: true });
    }
  } catch (error) {
    console.warn('Failed to persist conversation metadata.', error);
  }
};

export const usePersistentConversation = <T extends ConversationMessage>(
  options: UsePersistentConversationOptions<T>
) => {
  const { storageKey, initialMessages, autoGenerateConversationId = false } = options;
  const [messages, setMessages] = useState<T[]>(() => [...initialMessages]);
  const [conversationId, setConversationIdState] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const pathsRef = useRef<StoragePaths | null>(null);

  useEffect(() => {
    let isMounted = true;

    const hydrateAsync = async () => {
      try {
        const paths = await getStoragePathsAsync(storageKey);
        if (!isMounted) {
          return;
        }

        pathsRef.current = paths;

        const [messagesRaw, metaRaw] = await Promise.all([
          FileSystem.readAsStringAsync(paths.messagesPath).catch(() => null),
          FileSystem.readAsStringAsync(paths.metaPath).catch(() => null),
        ]);

        if (!isMounted) {
          return;
        }

        if (messagesRaw) {
          try {
            const parsed = JSON.parse(messagesRaw);
            if (Array.isArray(parsed)) {
              setMessages(parsed);
            }
          } catch (error) {
            console.warn('Failed to parse stored conversation messages.', error);
          }
        }

        let resolvedConversationId: string | null = null;

        if (metaRaw) {
          try {
            const parsedMeta = JSON.parse(metaRaw);
            if (parsedMeta && typeof parsedMeta.conversationId === 'string') {
              resolvedConversationId = parsedMeta.conversationId;
            }
          } catch (error) {
            console.warn('Failed to parse stored conversation metadata.', error);
          }
        }

        if (!resolvedConversationId && autoGenerateConversationId) {
          resolvedConversationId = generateConversationId();
          await writeConversationIdAsync(paths, resolvedConversationId);
        }

        if (isMounted) {
          setConversationIdState(resolvedConversationId);
        }
      } catch (error) {
        console.warn(`Failed to hydrate conversation for key "${storageKey}".`, error);
        if (autoGenerateConversationId && isMounted) {
          setConversationIdState(generateConversationId());
        }
      } finally {
        if (isMounted) {
          setIsHydrated(true);
        }
      }
    };

    hydrateAsync();

    return () => {
      isMounted = false;
    };
  }, [autoGenerateConversationId, initialMessages, storageKey]);

  useEffect(() => {
    if (!isHydrated || !pathsRef.current) {
      return;
    }

    writeMessagesAsync(pathsRef.current, messages);
  }, [isHydrated, messages]);

  const setPersistedConversationId = useCallback(
    (value: string | null) => {
      setConversationIdState(value);
      if (pathsRef.current) {
        writeConversationIdAsync(pathsRef.current, value);
      }
    },
    []
  );

  const clearConversation = useCallback(async () => {
    let paths = pathsRef.current;

    if (!paths) {
      try {
        paths = await getStoragePathsAsync(storageKey);
        pathsRef.current = paths;
      } catch (error) {
        console.warn('Failed to resolve conversation storage paths during clear.', error);
        return;
      }
    }

    try {
      await FileSystem.deleteAsync(paths.messagesPath, { idempotent: true });
    } catch (error) {
      console.warn('Failed to remove stored conversation messages.', error);
    }

    try {
      await FileSystem.deleteAsync(paths.metaPath, { idempotent: true });
    } catch (error) {
      console.warn('Failed to remove stored conversation metadata.', error);
    }

    setMessages([...initialMessages]);

    if (autoGenerateConversationId) {
      const newConversationId = generateConversationId();
      setConversationIdState(newConversationId);
      if (paths) {
        await writeConversationIdAsync(paths, newConversationId);
      }
    } else {
      setConversationIdState(null);
    }
  }, [autoGenerateConversationId, initialMessages, storageKey]);

  return {
    messages,
    setMessages,
    conversationId,
    setConversationId: setPersistedConversationId,
    isHydrated,
    clearConversation,
  } as const;
};

export type UsePersistentConversationReturn<T extends ConversationMessage> = ReturnType<
  typeof usePersistentConversation<T>
>;
