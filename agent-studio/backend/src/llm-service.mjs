import OpenAI from 'openai';
import { TOOL_DEFS, TOOL_IMPL } from './tools.mjs';

function parseToolArgs(raw) {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function toSseWrite(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export async function runAgentChatSse({ provider, model, messages, workspaceRoot, res }) {
  const client = new OpenAI({
    apiKey: provider.apiKey,
    baseURL: provider.baseUrl,
  });

  const workingMessages = [...messages];
  const maxIters = 8;

  for (let i = 0; i < maxIters; i += 1) {
    const response = await client.chat.completions.create({
      model,
      messages: workingMessages,
      tools: TOOL_DEFS,
      tool_choice: 'auto',
      temperature: 0.2,
    });

    const msg = response.choices?.[0]?.message;
    if (!msg) {
      toSseWrite(res, 'error', { message: 'LLM 响应为空' });
      return;
    }

    if (msg.tool_calls?.length) {
      workingMessages.push({
        role: 'assistant',
        content: msg.content || '',
        tool_calls: msg.tool_calls,
      });

      for (const tc of msg.tool_calls) {
        const name = tc.function?.name;
        const impl = TOOL_IMPL[name];
        const args = parseToolArgs(tc.function?.arguments);
        toSseWrite(res, 'tool_call', { name, args });

        if (!impl) {
          const errorResult = { ok: false, error: `Unknown tool: ${name}` };
          workingMessages.push({
            role: 'tool',
            tool_call_id: tc.id,
            content: JSON.stringify(errorResult),
          });
          toSseWrite(res, 'tool_result', errorResult);
          continue;
        }

        try {
          const data = await impl(args, { workspaceRoot });
          const result = { ok: true, data };
          workingMessages.push({
            role: 'tool',
            tool_call_id: tc.id,
            content: JSON.stringify(result),
          });
          toSseWrite(res, 'tool_result', result);
        } catch (err) {
          const result = { ok: false, error: err instanceof Error ? err.message : String(err) };
          workingMessages.push({
            role: 'tool',
            tool_call_id: tc.id,
            content: JSON.stringify(result),
          });
          toSseWrite(res, 'tool_result', result);
        }
      }
      continue;
    }

    const finalText = msg.content || '';
    // 简单分片推送，保证前端“流式感知”
    for (const chunk of finalText.match(/.{1,80}/g) || ['']) {
      toSseWrite(res, 'token', { text: chunk });
    }
    toSseWrite(res, 'done', { text: finalText });
    return;
  }

  toSseWrite(res, 'error', { message: '超过最大工具循环次数' });
}
