import { Settings, SendHorizonal, FolderOpen } from 'lucide-react';
import { useState } from 'react';
import ChatContainer from './components/ChatContainer';
import SettingsModal from './components/SettingsModal';
import { useChat } from './hooks/useChat';

export default function App() {
  const [openSettings, setOpenSettings] = useState(false);
  const [workspaceRoot, setWorkspaceRoot] = useState('.');
  const [providerId, setProviderId] = useState('deepseek');
  const [model, setModel] = useState('deepseek-chat');
  const [input, setInput] = useState('');

  const { messages, toolEvents, isLoading, sendMessage } = useChat();

  async function onSend() {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    try {
      await sendMessage({
        providerId,
        model,
        workspaceRoot,
        userText: text,
      });
    } catch (e) {
      console.error(e);
      alert('发送失败，请确认后端已启动并且 provider 配置可用。');
    }
  }

  return (
    <div className="mx-auto flex h-screen max-w-[1440px] flex-col p-4">
      <header className="mb-4 flex items-center justify-between rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-3 shadow-glass">
        <div>
          <div className="text-lg font-semibold text-slate-100">Agent Studio</div>
          <div className="text-xs text-slate-400">Local Coding Agent · SSE · Tool Calling</div>
        </div>
        <button className="btn-ghost inline-flex items-center gap-2" onClick={() => setOpenSettings(true)}>
          <Settings size={16} /> 设置
        </button>
      </header>

      <main className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <ChatContainer messages={messages} toolEvents={toolEvents} isLoading={isLoading} />

        <aside className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4 shadow-glass">
          <h3 className="mb-3 text-sm font-semibold text-slate-200">会话状态</h3>

          <label className="mb-1 block text-xs text-slate-400">Provider ID</label>
          <input className="input mb-3" value={providerId} onChange={e => setProviderId(e.target.value)} />

          <label className="mb-1 block text-xs text-slate-400">Model</label>
          <input className="input mb-3" value={model} onChange={e => setModel(e.target.value)} />

          <label className="mb-1 block text-xs text-slate-400">Workspace Root</label>
          <div className="mb-4 flex gap-2">
            <input className="input" value={workspaceRoot} onChange={e => setWorkspaceRoot(e.target.value)} />
            <button className="btn-ghost"><FolderOpen size={16} /></button>
          </div>

          <label className="mb-1 block text-xs text-slate-400">输入</label>
          <textarea
            className="input min-h-28"
            placeholder="让 AI 帮你读文件、改代码、执行命令..."
            value={input}
            onChange={e => setInput(e.target.value)}
          />
          <button className="btn-primary mt-3 inline-flex w-full items-center justify-center gap-2" onClick={onSend} disabled={isLoading}>
            <SendHorizonal size={16} /> 发送
          </button>
        </aside>
      </main>

      <SettingsModal
        open={openSettings}
        onClose={() => setOpenSettings(false)}
        selectedProviderId={providerId}
        onSelectProvider={setProviderId}
      />
    </div>
  );
}
