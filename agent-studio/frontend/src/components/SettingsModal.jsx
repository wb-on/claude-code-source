import { Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fetchJson } from '../lib/http';

const emptyForm = { id: '', name: '', baseUrl: '', apiKey: '', modelCatalog: '' };

export default function SettingsModal({ open, onClose, selectedProviderId, onSelectProvider }) {
  const [providers, setProviders] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  async function refresh() {
    try {
      const data = await fetchJson('/api/providers');
      setProviders(data.providers || []);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    if (open) refresh();
  }, [open]);

  async function saveProvider() {
    try {
      const payload = {
        id: form.id.trim(),
        name: form.name.trim(),
        baseUrl: form.baseUrl.trim(),
        apiKey: form.apiKey.trim(),
        modelCatalog: form.modelCatalog
          .split(',')
          .map(v => v.trim())
          .filter(Boolean),
      };
      await fetchJson('/api/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setForm(emptyForm);
      await refresh();
    } catch (e) {
      setError(e.message);
    }
  }

  async function deleteProvider(id) {
    try {
      await fetchJson(`/api/providers/${encodeURIComponent(id)}`, { method: 'DELETE' });
      await refresh();
    } catch (e) {
      setError(e.message);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-700 bg-slate-900/95 p-5 shadow-glass">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-100">Provider 设置</h3>
          <button className="btn-ghost" onClick={onClose}><X size={16} /></button>
        </div>

        {!!error && <div className="mb-3 rounded-lg border border-rose-700/50 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">{error}</div>}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input className="input" placeholder="ID (deepseek)" value={form.id} onChange={e => setForm(s => ({ ...s, id: e.target.value }))} />
          <input className="input" placeholder="名称" value={form.name} onChange={e => setForm(s => ({ ...s, name: e.target.value }))} />
          <input className="input md:col-span-2" placeholder="Base URL" value={form.baseUrl} onChange={e => setForm(s => ({ ...s, baseUrl: e.target.value }))} />
          <input className="input md:col-span-2" placeholder="API Key" value={form.apiKey} onChange={e => setForm(s => ({ ...s, apiKey: e.target.value }))} />
          <input className="input md:col-span-2" placeholder="模型列表(逗号分隔)" value={form.modelCatalog} onChange={e => setForm(s => ({ ...s, modelCatalog: e.target.value }))} />
        </div>

        <div className="mt-3 flex justify-end">
          <button className="btn-primary inline-flex items-center gap-2" onClick={saveProvider}>
            <Plus size={16} /> 保存 Provider
          </button>
        </div>

        <div className="mt-6 rounded-xl border border-slate-700 bg-slate-800/60 p-3">
          <div className="mb-2 text-sm text-slate-300">已配置 Provider</div>
          <div className="space-y-2">
            {providers.map(p => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2">
                <div>
                  <div className="font-medium text-slate-100">{p.name} ({p.id})</div>
                  <div className="text-xs text-slate-400">{p.baseUrl} · {p.apiKeyMasked}</div>
                </div>
                <div className="flex gap-2">
                  <button className="btn-ghost" onClick={() => onSelectProvider(p.id)}>
                    {selectedProviderId === p.id ? '已选择' : '选择'}
                  </button>
                  <button className="btn-ghost" onClick={() => deleteProvider(p.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {!providers.length && <div className="text-sm text-slate-400">暂无 Provider</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
