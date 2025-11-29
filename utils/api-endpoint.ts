const trim = (value?: string | null) => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  return trimmed.replace(/\/$/, '');
};

const resolveBase = () => {
  const candidates = [
    process.env.EXPO_PUBLIC_CHAT_BASE_URL,
    process.env.EXPO_PUBLIC_API_BASE_URL,
    process.env.EXPO_PUBLIC_SITE_URL,
  ];

  for (const candidate of candidates) {
    const normalized = trim(candidate);

    if (normalized) {
      return normalized;
    }
  }

  return null;
};

export function resolveApiBaseUrl() {
  return resolveBase();
}

export function buildApiUrl(path: string, baseOverride?: string | null) {
  const base = trim(baseOverride) ?? resolveBase();

  if (!base) {
    return null;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const sanitizedBase = base.replace(/\/$/, '');

  if (sanitizedBase.endsWith('/api')) {
    return `${sanitizedBase}${normalizedPath}`;
  }

  return `${sanitizedBase}/api${normalizedPath}`;
}
