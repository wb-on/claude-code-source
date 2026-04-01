#!/usr/bin/env node
import { createServer } from 'http';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { URL } from 'url';

const SUPPORTED_PROVIDERS = {
  deepseek: {
    label: 'DeepSeek',
    defaultBaseUrl: 'https://api.deepseek.com/v1',
    models: ['deepseek-chat', 'deepseek-reasoner'],
  },
  minimax: {
    label: 'MiniMax',
    defaultBaseUrl: 'https://api.minimax.chat/v1',
    models: ['abab6.5s-chat', 'abab6.5g-chat'],
  },
  openai_compatible: {
    label: 'OpenAI-Compatible',
    defaultBaseUrl: '',
    models: ['gpt-4o-mini', 'o3-mini'],
  },
};

const args = process.argv.slice(2);
const portArg = args.find(a => a.startsWith('--port='));
const port = portArg ? Number(portArg.split('=')[1]) : 3760;

const CONFIG_DIR = join(homedir(), '.claude');
const CONFIG_FILE = join(CONFIG_DIR, 'custom-model-apis.json');

function ensureConfigDir() {
  if (!existsSync(CONFIG_DIR)) mkdirSync(CONFIG_DIR, { recursive: true });
}

function loadConfig() {
  ensureConfigDir();
  if (!existsSync(CONFIG_FILE)) return { providers: [] };
  try {
    return JSON.parse(readFileSync(CONFIG_FILE, 'utf8'));
  } catch {
    return { providers: [] };
  }
}

function saveConfig(config) {
  ensureConfigDir();
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
}

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      if (!body) return resolve({});
      try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

const html = readFileSync(new URL('./public/index.html', import.meta.url), 'utf8');

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);

  if (url.pathname === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  if (url.pathname === '/api/providers' && req.method === 'GET') {
    sendJson(res, 200, SUPPORTED_PROVIDERS);
    return;
  }

  if (url.pathname === '/api/config' && req.method === 'GET') {
    const config = loadConfig();
    sendJson(res, 200, config);
    return;
  }

  if (url.pathname === '/api/config' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const { provider, apiKey, baseUrl, models } = body;
      if (!provider || !apiKey) {
        sendJson(res, 400, { error: 'provider 和 apiKey 必填' });
        return;
      }
      const config = loadConfig();
      const idx = config.providers.findIndex(p => p.provider === provider);
      const preset = SUPPORTED_PROVIDERS[provider] || { defaultBaseUrl: '' };
      const row = {
        provider,
        apiKey,
        baseUrl: baseUrl || preset.defaultBaseUrl,
        models: Array.isArray(models) && models.length ? models : preset.models || [],
        updatedAt: new Date().toISOString(),
      };
      if (idx >= 0) config.providers[idx] = row;
      else config.providers.push(row);
      saveConfig(config);
      sendJson(res, 200, { ok: true, config });
    } catch {
      sendJson(res, 400, { error: '请求体必须是 JSON' });
    }
    return;
  }

  if (url.pathname === '/api/models' && req.method === 'GET') {
    const config = loadConfig();
    const models = config.providers.flatMap(p => (p.models || []).map(m => ({ provider: p.provider, model: m })));
    sendJson(res, 200, { models });
    return;
  }

  if (url.pathname.startsWith('/api/config/') && req.method === 'DELETE') {
    const provider = decodeURIComponent(url.pathname.replace('/api/config/', ''));
    const config = loadConfig();
    config.providers = config.providers.filter(p => p.provider !== provider);
    saveConfig(config);
    sendJson(res, 200, { ok: true, config });
    return;
  }

  sendJson(res, 404, { error: 'Not Found' });
});

server.listen(port, () => {
  console.log(`Custom Model WebUI running at http://127.0.0.1:${port}`);
  console.log(`Config file: ${CONFIG_FILE}`);
});
