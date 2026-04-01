# Custom Model API WebUI

用于“个人魔改”场景：快速添加/管理多个 AI Provider 的 API 配置，并显示当前支持模型。

## 已内置 Provider
- deepseek
- minimax
- openai_compatible（可填任意 OpenAI 兼容网关）

## 启动

```bash
node custom-webui/server.mjs --port=3760
```

浏览器打开：

- `http://127.0.0.1:3760`

## 配置文件

- `~/.claude/custom-model-apis.json`

支持：
- 新增 / 更新 provider apiKey
- 自定义 baseUrl
- 自定义 models 列表
- 删除 provider
- 汇总展示“当前支持模型”
