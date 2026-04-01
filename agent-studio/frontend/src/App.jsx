import { Settings, SendHorizonal, FolderOpen, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import ChatContainer from './components/ChatContainer';
import SettingsModal from './components/SettingsModal';
import { useChat } from './hooks/useChat';
import { fetchJson } from './lib/http';

export default function App() {
  const [openSettings, setOpenSettings] = useState(false);
  const [workspaceRoot, setWorkspaceRoot] = useState('.');
  const [providerId, setProviderId] = useState('deepseek');
  const [model, setModel] = useState('deepseek-chat');
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [treeItems, setTreeItems] = useState([]);

  const { messages, toolEvents, isLoading, sendMessage } = useChat();

  async function browseWorkspace() {
    const next = window.prompt('请输入本地工作目录绝对路径（例如 C:\\Users\\wangb\\project）', workspaceRoot);
    if (!next) return;
    setWorkspaceRoot(next);

    try {
      const data = await fetchJson('/api/workspace/tree', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceRoot: next, subPath: '.' }),
      });
      setTreeItems(data.items || []);
      setError('');
    } catch (e) {
      setError(`目录读取失败：${e.message}`);
    }
  }

  async function onSend() {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    try {
      setError('');
      await sendMessage({ providerId, model, workspaceRoot, userText: text });
    } catch (e) {
      setError(e.message || '发送失败');
    }
  }

  async function checkBackend() {
    try {
      const data = await fetchJson('/api/health');
      setError(`后端已连接：${data.configPath}`);
    } catch (e) {
      setError(`后端连接失败：${e.message}`);
    }
  }

  return (
    <div className="mx-auto flex h-screen max-w-[1440px] flex-col p-4">
      <header className="mb-4 flex items-center justify-between rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-3 shadow-glass">
        <div>
          <div className="text-lg font-semibold text-slate-100">Agent Studio</div>
          <div className="text-xs text-slate-400">Local Coding Agent · SSE · Tool Calling</div>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost inline-flex items-center gap-2" onClick={checkBackend}><RefreshCw size={16} /> 连通性</button>
          <button className="btn-ghost inline-flex items-center gap-2" onClick={() => setOpenSettings(true)}><Settings size={16} /> 设置</button>
        </div>
      </header>

      {!!error && <div className="mb-3 rounded-lg border border-rose-700/40 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">{error}</div>}

      <main className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
        <ChatContainer messages={messages} toolEvents={toolEvents} isLoading={isLoading} />

        <aside className="overflow-auto rounded-2xl border border-slate-700 bg-slate-900/60 p-4 shadow-glass">
          <h3 className="mb-3 text-sm font-semibold text-slate-200">会话状态</h3>

          <label className="mb-1 block text-xs text-slate-400">Provider ID</label>
          <input className="input mb-3" value={providerId} onChange={e => setProviderId(e.target.value)} />

          <label className="mb-1 block text-xs text-slate-400">Model</label>
          <input className="input mb-3" value={model} onChange={e => setModel(e.target.value)} />

          <label className="mb-1 block text-xs text-slate-400">Workspace Root</label>
          <div className="mb-3 flex gap-2">
            <input className="input" value={workspaceRoot} onChange={e => setWorkspaceRoot(e.target.value)} />
            <button className="btn-ghost" onClick={browseWorkspace} title="浏览工作目录"><FolderOpen size={16} /></button>
          </div>

          <div className="mb-4 rounded-lg border border-slate-700 bg-slate-950/40 p-2">
            <div className="mb-2 text-xs text-slate-400">目录预览（前 200 项）</div>
            <div className="max-h-32 overflow-auto text-xs text-slate-300">
              {!treeItems.length ? '尚未读取目录' : treeItems.map((it, idx) => <div key={idx}>{it.type === 'dir' ? '📁' : '📄'} {it.name}</div>)}
            </div>
          </div>

          <label className="mb-1 block text-xs text-slate-400">输入</label>
          <textarea className="input min-h-28" placeholder="让 AI 帮你读文件、改代码、执行命令..." value={input} onChange={e => setInput(e.target.value)} />
          <button className="btn-primary mt-3 inline-flex w-full items-center justify-center gap-2" onClick={onSend} disabled={isLoading}>
            <SendHorizonal size={16} /> 发送
          </button>
        </aside>
      </main>

      <SettingsModal open={openSettings} onClose={() => setOpenSettings(false)} selectedProviderId={providerId} onSelectProvider={setProviderId} />
    </div>
  );
}
