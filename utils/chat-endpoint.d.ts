export interface ExpoGoExtras {
  debuggerHost?: string | null;
  hostUri?: string | null;
}

export interface ExpoExtras {
  expoGo?: ExpoGoExtras | null;
  chatBaseUrl?: string | null;
  apiBaseUrl?: string | null;
  [key: string]: unknown;
}

export interface ExpoConfigLike {
  hostUri?: string | null;
  extra?: ExpoExtras | null;
}

export interface ManifestExtras {
  expoGo?: ExpoGoExtras | null;
  chatBaseUrl?: string | null;
  apiBaseUrl?: string | null;
  [key: string]: unknown;
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

export interface ResolveApiEndpointOptions {
  env?: Record<string, string | undefined>;
  constants?: ExpoConstantsLike | null;
  envKeys?: string[] | null;
  extraKeys?: string[] | null;
}

export interface ResolveChatEndpointOptions extends ResolveApiEndpointOptions {}

export declare function resolveApiEndpoint(
  path: string,
  options?: ResolveApiEndpointOptions | null
): string | null;

export declare function resolveChatEndpoint(
  options?: ResolveChatEndpointOptions | null
): string | null;

export type {
  ExpoConstantsLike as ExpoConstants,
  ResolveApiEndpointOptions as ResolveApiEndpointParams,
  ResolveChatEndpointOptions as ResolveChatEndpointParams,
};
