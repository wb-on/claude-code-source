export type ProviderConfig = {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  modelCatalog?: string[];
};

export type ProviderConfigSafe = Omit<ProviderConfig, 'apiKey'> & {
  apiKeyMasked: string;
};

export type CreateSessionRequest = {
  workspaceRoot: string;
  providerId: string;
  model: string;
  systemPrompt?: string;
};

export type CreateSessionResponse = {
  sessionId: string;
};

export type ChatRequest = {
  sessionId: string;
  message: string;
  stream: true;
};

export type ToolEnvelope<T = unknown> = {
  ok: boolean;
  data: T | null;
  error: string | null;
  meta: { durationMs: number };
};

export type ReadFileInput = { path: string };
export type WriteFileInput = { path: string; content: string };
export type EditFileDiffInput = {
  path: string;
  searchString: string;
  replaceString: string;
};
export type RunCommandInput = {
  command: string;
  cwd?: string;
  timeoutMs?: number;
};
export type SearchFilesInput = {
  query: string;
  cwd?: string;
  glob?: string;
  limit?: number;
};

export type SseEventType =
  | 'token'
  | 'tool_call'
  | 'tool_result'
  | 'diff_preview'
  | 'done'
  | 'error';

export type SseEvent = {
  type: SseEventType;
  sessionId: string;
  payload: unknown;
};
