# Agent Studio 第一步：全局架构与基础框架

> 目标：先给出“可落地”的技术栈、目录结构、接口契约；后续再逐步实现。

## 1. 技术栈选型

## 1.1 前端（Web IDE + Chat）
- **Vite + React + TypeScript**：构建速度快，适合本地工具。
- **TailwindCSS + shadcn/ui**：快速搭建现代深色风格 UI。
- **Monaco Editor**：代码预览与编辑。
- **react-markdown + rehype-highlight**：对话中 Markdown 与代码高亮。
- **zustand**：轻量状态管理（会话、模型、工具状态）。
- **SSE/WebSocket**：流式回复与工具执行状态推送。

## 1.2 后端（本地 Agent Runtime）
- **Node.js + TypeScript + Fastify**：轻量高性能，插件生态成熟。
- **OpenAI-compatible provider adapter**：统一 DeepSeek/MiniMax/OpenAI 等。
- **zod**：请求与工具参数校验。
- **execa**：受控执行命令。
- **fast-glob + ripgrep(可选)**：文件搜索。
- **diff-match-patch**：局部文本替换与变更追踪。

## 1.3 安全与运行
- 配置目录：`~/.my-ai-coder/config.json`
- 工作目录白名单：仅允许在用户指定 workspace 下读写。
- 工具调用审计日志：`~/.my-ai-coder/logs/*.jsonl`
- 命令执行超时与并发限制。

## 2. 目录结构设计（Monorepo）

```text
agent-studio/
├─ docs/
│  └─ ARCHITECTURE.md
├─ backend/
│  ├─ src/
│  │  ├─ server.ts                  # Fastify 入口
│  │  ├─ routes/
│  │  │  ├─ chat.ts                 # /api/chat
│  │  │  ├─ providers.ts            # /api/providers
│  │  │  ├─ session.ts              # /api/session
│  │  │  └─ workspace.ts            # /api/workspace/*
│  │  ├─ agent/
│  │  │  ├─ runtime.ts              # 推理+工具循环
│  │  │  ├─ providerAdapter.ts      # OpenAI-compatible 适配
│  │  │  └─ toolRegistry.ts         # 工具注册与 schema
│  │  ├─ tools/
│  │  │  ├─ readFile.ts
│  │  │  ├─ writeFile.ts
│  │  │  ├─ editFileDiff.ts
│  │  │  ├─ runCommand.ts
│  │  │  └─ searchFiles.ts
│  │  ├─ services/
│  │  │  ├─ configStore.ts          # ~/.my-ai-coder/config.json
│  │  │  ├─ workspaceGuard.ts       # 路径安全边界
│  │  │  └─ eventStream.ts          # SSE 推送
│  │  └─ contracts.ts               # 前后端共享类型（第一步先落这里）
├─ frontend/
│  ├─ src/
│  │  ├─ app/
│  │  │  ├─ layout/                 # IDE布局（聊天区/侧栏/状态栏）
│  │  │  ├─ chat/                   # 消息流
│  │  │  ├─ diff/                   # 文件diff面板
│  │  │  └─ settings/               # Provider设置抽屉
│  │  ├─ lib/
│  │  │  └─ api.ts                  # API client + SSE client
│  │  └─ stores/
│  │     ├─ sessionStore.ts
│  │     └─ settingsStore.ts
└─ package.json                     # workspace scripts（后续补齐）
```

## 3. 前后端接口定义（V1）

## 3.1 Provider 配置
- `GET /api/providers`
  - 返回已配置 provider 列表（隐藏 apiKey，仅返回 masked）。
- `POST /api/providers`
  - 入参：`{ id, name, baseUrl, apiKey, modelCatalog?: string[] }`
  - 行为：新增或覆盖 provider。
- `DELETE /api/providers/:id`
  - 行为：删除 provider。
- `GET /api/providers/models?providerId=xxx`
  - 返回模型列表（优先用户配置，否则走远端探测/缓存）。

## 3.2 会话与聊天
- `POST /api/session`
  - 入参：`{ workspaceRoot, providerId, model, systemPrompt? }`
  - 返回：`{ sessionId }`
- `POST /api/chat`
  - 入参：`{ sessionId, message, stream: true }`
  - 行为：进入 agent loop，模型可触发 tools。
- `GET /api/chat/stream/:sessionId` (SSE)
  - 事件：`token`, `tool_call`, `tool_result`, `diff_preview`, `done`, `error`。

## 3.3 本地文件与命令（由 Agent 调用，也可在调试模式手动调用）
- `POST /api/workspace/read-file`
  - `{ path } -> { content, encoding }`
- `POST /api/workspace/write-file`
  - `{ path, content } -> { bytesWritten }`
- `POST /api/workspace/edit-file-diff`
  - `{ path, searchString, replaceString } -> { replacements, previewDiff }`
- `POST /api/workspace/run-command`
  - `{ command, cwd?, timeoutMs? } -> { exitCode, stdout, stderr }`
- `POST /api/workspace/search-files`
  - `{ query, cwd?, glob?, limit? } -> { matches[] }`

## 4. Tool Calling 规范（发给大模型）

注册 5 个工具：
1. `read_file(path)`
2. `write_file(path, content)`
3. `edit_file_diff(path, search_string, replace_string)`
4. `run_command(command)`
5. `search_files(query)`

所有工具均统一返回：
```json
{
  "ok": true,
  "data": {},
  "error": null,
  "meta": { "durationMs": 123 }
}
```

## 5. 第一步完成定义

- ✅ 已明确技术栈
- ✅ 已明确目录结构
- ✅ 已明确 API 契约
- ✅ 已明确 Tool Calling 接口

下一步将进入：
1) 初始化 backend/frontend 工程骨架；
2) 先打通 Provider 配置与 `/api/chat` 的流式输出；
3) 再接入工具执行与 Diff 面板。
