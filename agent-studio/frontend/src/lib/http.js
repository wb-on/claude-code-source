export function apiUrl(path) {
  const base = import.meta.env.VITE_API_BASE_URL || '';
  return `${base}${path}`;
}

export async function fetchJson(path, options) {
  const res = await fetch(apiUrl(path), options);
  const text = await res.text();
  let json = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { error: text || '非 JSON 响应' };
  }
  if (!res.ok) {
    throw new Error(json.error || `HTTP ${res.status}`);
  }
  return json;
}
