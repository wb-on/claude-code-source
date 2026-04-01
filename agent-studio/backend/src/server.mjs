import express from 'express';
import cors from 'cors';
import { resolve } from 'path';
import {
  deleteProvider,
  getConfigPath,
  getProvider,
  listProvidersSafe,
  upsertProvider,
} from './config-store.mjs';
import { runAgentChatSse } from './llm-service.mjs';

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, configPath: getConfigPath() });
});

app.get('/api/providers', (_req, res) => {
  res.json({ providers: listProvidersSafe() });
});

app.post('/api/providers', (req, res) => {
  const { id, name, baseUrl, apiKey, modelCatalog } = req.body || {};
  if (!id || !baseUrl || !apiKey) {
    return res.status(400).json({ error: 'id/baseUrl/apiKey 必填' });
  }
  const row = upsertProvider({ id, name, baseUrl, apiKey, modelCatalog });
  res.json({ ok: true, provider: { ...row, apiKey: undefined } });
});

app.delete('/api/providers/:id', (req, res) => {
  deleteProvider(req.params.id);
  res.json({ ok: true });
});

app.post('/api/chat/stream', async (req, res) => {
  const { providerId, model, messages, workspaceRoot } = req.body || {};
  if (!providerId || !model || !Array.isArray(messages) || !workspaceRoot) {
    return res.status(400).json({ error: 'providerId/model/messages/workspaceRoot 必填' });
  }

  const provider = getProvider(providerId);
  if (!provider) return res.status(404).json({ error: `Provider not found: ${providerId}` });

  const safeWorkspaceRoot = resolve(workspaceRoot);

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  });

  try {
    await runAgentChatSse({
      provider,
      model,
      messages,
      workspaceRoot: safeWorkspaceRoot,
      res,
    });
  } catch (err) {
    res.write(`event: error\n`);
    res.write(`data: ${JSON.stringify({ message: err instanceof Error ? err.message : String(err) })}\n\n`);
  } finally {
    res.end();
  }
});

const port = Number(process.env.AGENT_STUDIO_PORT || 8787);
app.listen(port, () => {
  console.log(`[agent-studio] backend listening on http://127.0.0.1:${port}`);
  console.log(`[agent-studio] config: ${getConfigPath()}`);
});
