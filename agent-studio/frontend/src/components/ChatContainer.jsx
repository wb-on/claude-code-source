import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Bot, LoaderCircle, User, Wrench } from 'lucide-react';

export default function ChatContainer({ messages, toolEvents, isLoading }) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-700 bg-slate-900/60 p-4 shadow-glass">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-200">对话</h2>
        {isLoading && (
          <div className="inline-flex items-center gap-2 text-xs text-cyan-300">
            <LoaderCircle className="animate-spin" size={14} /> Agent 思考中...
          </div>
        )}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
        {messages.map((m, idx) => (
          <div key={idx} className={`rounded-xl border p-3 ${m.role === 'user' ? 'border-cyan-700/50 bg-cyan-950/30' : 'border-slate-700 bg-slate-800/80'}`}>
            <div className="mb-2 flex items-center gap-2 text-xs text-slate-400">
              {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
              {m.role === 'user' ? '你' : 'Agent'}
            </div>
            <div className="prose prose-invert max-w-none prose-pre:rounded-lg prose-pre:border prose-pre:border-slate-700 prose-pre:bg-slate-950/80">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                {m.content || ''}
              </ReactMarkdown>
            </div>
          </div>
        ))}

        {toolEvents.map((evt, idx) => (
          <div key={`tool-${idx}`} className="rounded-xl border border-amber-700/40 bg-amber-950/20 p-3">
            <div className="mb-2 inline-flex items-center gap-2 text-xs text-amber-300">
              <Wrench size={14} />
              {evt.event === 'tool_call' ? '⚙️ 正在执行工具' : '✅ 工具执行结果'}
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap text-xs text-slate-200">
              {JSON.stringify(evt.data, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}
