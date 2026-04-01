# Agent Studio Backend (Step 2)

## 功能
- Provider 配置管理（`~/.agent_config.json`）
- OpenAI-compatible Chat + SSE
- Tool Calling（read_file / write_file / run_command）
- 简单路径沙箱（限制在 `workspaceRoot`）

## 启动

```bash
cd agent-studio/backend
npm install
npm run dev
```

默认端口：`8787`

## 核心接口
- `GET /api/providers`
- `POST /api/providers`
- `DELETE /api/providers/:id`
- `POST /api/chat/stream` (SSE)
