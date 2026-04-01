# Agent Studio Frontend

## 启动

```bash
npm install
npm run dev
```

默认会监听 `0.0.0.0:5174`（通过 Vite `host: true`），
所以你可以访问：
- `http://localhost:5174`
- `http://127.0.0.1:5174`

## 后端联通

前端优先通过 Vite 代理访问后端：
- `/api/*` -> `http://127.0.0.1:8787`

请确认后端已启动：

```bash
cd ../backend
npm install
npm run dev
```

## 常见问题

1. 前端只能开 localhost 不能开 127.0.0.1
   - 已通过 `host: true` 修复；重启前端生效。

2. 前端打开但后端请求失败
   - 检查 `http://127.0.0.1:8787/api/health` 是否返回 JSON。
   - 若你希望绕过 Vite 代理，设置环境变量：
     - `VITE_API_BASE_URL=http://127.0.0.1:8787`
