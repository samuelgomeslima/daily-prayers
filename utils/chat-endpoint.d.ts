export interface ExpoGoExtras {
  debuggerHost?: string | null;
  hostUri?: string | null;
}

export interface ExpoExtras {
  expoGo?: ExpoGoExtras | null;
  chatBaseUrl?: string | null;
  apiBaseUrl?: string | null;
}

export interface ExpoConfigLike {
  hostUri?: string | null;
  extra?: ExpoExtras | null;
}

export interface ManifestExtras {
  expoGo?: ExpoGoExtras | null;
  chatBaseUrl?: string | null;
  apiBaseUrl?: string | null;
}

export interface ManifestLike {
  debuggerHost?: string | null;
  hostUri?: string | null;
  extra?: ManifestExtras | null;
}

export interface ExpoConstantsLike {
  expoConfig?: ExpoConfigLike | null;
  manifest2?: { extra?: ManifestExtras | null } | null;
  manifest?: ManifestLike | null;
}

export interface ResolveChatEndpointOptions {
  env?: Record<string, string | undefined>;
  constants?: ExpoConstantsLike | null;
}

export declare function resolveChatEndpoint(
  options?: ResolveChatEndpointOptions | null
): string | null;

export type { ExpoConstantsLike as ExpoConstants, ResolveChatEndpointOptions as ResolveChatEndpointParams };
