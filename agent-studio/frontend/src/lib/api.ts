export type ProviderForm = {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  modelCatalog?: string[];
};

export async function listProviders() {
  const res = await fetch('/api/providers');
  if (!res.ok) throw new Error('listProviders failed');
  return res.json();
}

export async function upsertProvider(payload: ProviderForm) {
  const res = await fetch('/api/providers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('upsertProvider failed');
  return res.json();
}

export async function createSession(payload: {
  workspaceRoot: string;
  providerId: string;
  model: string;
  systemPrompt?: string;
}) {
  const res = await fetch('/api/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('createSession failed');
  return res.json();
}

export async function sendChat(payload: {
  sessionId: string;
  message: string;
  stream: true;
}) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('sendChat failed');
  return res.json();
}

export function subscribeChatStream(
  sessionId: string,
  onEvent: (evt: MessageEvent<string>) => void,
) {
  const es = new EventSource(`/api/chat/stream/${sessionId}`);
  es.onmessage = onEvent;
  return () => es.close();
}
