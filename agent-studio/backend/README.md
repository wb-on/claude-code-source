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


## 兼容与排查
- 后端启动时会自动创建配置文件：`~/.agent_config.json`
- 如果前端与后端不在同域，可在前端设置 `VITE_API_BASE_URL`，例如：`http://127.0.0.1:8787`
- 浏览器无法直接读取本机绝对路径，前端会提示你手动输入工作目录，再由后端读取目录树
