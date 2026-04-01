import { useMemo, useState } from 'react';
import { apiUrl } from '../lib/http';

function parseSseChunk(chunk) {
  return chunk
    .split('\n\n')
    .map(block => block.trim())
    .filter(Boolean)
    .map(block => {
      const lines = block.split('\n');
      const eventLine = lines.find(l => l.startsWith('event:')) || 'event: message';
      const dataLine = lines.find(l => l.startsWith('data:')) || 'data: {}';
      const event = eventLine.replace('event:', '').trim();
      const dataRaw = dataLine.replace('data:', '').trim();
      let data = {};
      try { data = JSON.parse(dataRaw); } catch { data = { raw: dataRaw }; }
      return { event, data };
    });
}

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [toolEvents, setToolEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const assistantText = useMemo(
    () => messages.filter(m => m.role === 'assistant').at(-1)?.content || '',
    [messages],
  );

  async function sendMessage({ providerId, model, workspaceRoot, userText }) {
    if (!userText?.trim()) return;

    const nextMessages = [...messages, { role: 'user', content: userText }];
    setMessages(nextMessages);
    setToolEvents([]);
    setIsLoading(true);

    const response = await fetch(apiUrl('/api/chat/stream'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providerId, model, workspaceRoot, messages: nextMessages }),
    });

    if (!response.ok) {
      const text = await response.text();
      let message = text;
      try {
        const json = JSON.parse(text);
        message = json.hint ? `${json.error}（${json.hint}）` : json.error || text;
      } catch {}
      setIsLoading(false);
      throw new Error(message || 'SSE 请求失败');
    }

    if (!response.body) {
      setIsLoading(false);
      throw new Error('后端未返回 SSE body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let currentAssistant = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const splitIndex = buffer.lastIndexOf('\n\n');
      if (splitIndex === -1) continue;

      const chunk = buffer.slice(0, splitIndex + 2);
      buffer = buffer.slice(splitIndex + 2);

      const events = parseSseChunk(chunk);
      for (const evt of events) {
        if (evt.event === 'token') {
          currentAssistant += evt.data.text || '';
          setMessages(prev => {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            if (last?.role === 'assistant') copy[copy.length - 1] = { ...last, content: currentAssistant };
            else copy.push({ role: 'assistant', content: currentAssistant });
            return copy;
          });
        }
        if (evt.event === 'tool_call' || evt.event === 'tool_result' || evt.event === 'error') {
          setToolEvents(prev => [...prev, evt]);
        }
        if (evt.event === 'done' && !currentAssistant && evt.data?.text) {
          currentAssistant = evt.data.text;
          setMessages(prev => [...prev, { role: 'assistant', content: currentAssistant }]);
        }
      }
    }

    setIsLoading(false);
  }

  return { messages, toolEvents, isLoading, assistantText, sendMessage };
}
