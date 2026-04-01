import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { dirname, join } from 'path';

const CONFIG_PATH = join(homedir(), '.agent_config.json');

function ensureDir() {
  const dir = dirname(CONFIG_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function defaultConfig() {
  return { providers: [] };
}

export function getConfigPath() {
  return CONFIG_PATH;
}

export function loadConfig() {
  ensureDir();
  if (!existsSync(CONFIG_PATH)) return defaultConfig();
  try {
    const parsed = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
    if (!Array.isArray(parsed.providers)) return defaultConfig();
    return parsed;
  } catch {
    return defaultConfig();
  }
}

export function saveConfig(nextConfig) {
  ensureDir();
  writeFileSync(CONFIG_PATH, JSON.stringify(nextConfig, null, 2), 'utf8');
  return nextConfig;
}

export function maskKey(key = '') {
  if (!key) return '';
  if (key.length <= 8) return `${key.slice(0, 2)}***`;
  return `${key.slice(0, 4)}***${key.slice(-4)}`;
}

export function listProvidersSafe() {
  const cfg = loadConfig();
  return cfg.providers.map(p => ({
    id: p.id,
    name: p.name,
    baseUrl: p.baseUrl,
    modelCatalog: p.modelCatalog || [],
    apiKeyMasked: maskKey(p.apiKey),
  }));
}

export function upsertProvider(provider) {
  const cfg = loadConfig();
  const idx = cfg.providers.findIndex(p => p.id === provider.id);
  const row = {
    id: provider.id,
    name: provider.name || provider.id,
    baseUrl: provider.baseUrl,
    apiKey: provider.apiKey,
    modelCatalog: Array.isArray(provider.modelCatalog) ? provider.modelCatalog : [],
    updatedAt: new Date().toISOString(),
  };
  if (idx >= 0) cfg.providers[idx] = row;
  else cfg.providers.push(row);
  saveConfig(cfg);
  return row;
}

export function deleteProvider(providerId) {
  const cfg = loadConfig();
  cfg.providers = cfg.providers.filter(p => p.id !== providerId);
  saveConfig(cfg);
  return true;
}

export function getProvider(providerId) {
  const cfg = loadConfig();
  return cfg.providers.find(p => p.id === providerId) || null;
}
