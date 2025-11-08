# Worker (Cloudflare GraphQL API)

Cloudflare Worker 基于 `graphql-yoga` 暴露 `/graphql`，提供 `Query.ping` 与 `Mutation.askAI`，并通过 OpenAI/DeepSeek 完成回答。

## 部署手册（Cloudflare Workers）

1. **准备环境**
   - Node.js 18+、npm
   - Wrangler CLI（未安装则执行 `npm install -g wrangler`）

2. **安装依赖**

   ```bash
   cd worker
   npm install
   ```

3. **登录 Cloudflare**

   ```bash
   wrangler login
   ```

4. **配置 Secrets / Vars**

   ```bash
   npx wrangler secret put OPENAI_API_KEY   # 必填：OpenAI/DeepSeek Key
   npx wrangler secret put OPENAI_BASE_URL  # 选填：兼容服务地址，如 https://api.deepseek.com/v1
   npx wrangler secret put OPENAI_MODEL     # 选填：模型名，默认 gpt-4o-mini
   npx wrangler secret put SYSTEM_PROMPT    # 选填：自定义系统提示
   ```

   | 变量名            | 类型   | 说明                                        |
   | ----------------- | ------ | ------------------------------------------- |
   | `OPENAI_API_KEY`  | Secret | **必填**，OpenAI/DeepSeek 等服务 API Key    |
   | `OPENAI_BASE_URL` | Secret | 选填，默认 `https://api.openai.com/v1`      |
   | `OPENAI_MODEL`    | Secret | 选填，默认 `gpt-4o-mini`                    |
   | `SYSTEM_PROMPT`   | Secret | 选填，自定义系统提示语                      |

5. **本地调试**

   ```bash
   npm run dev
   ```

   - GraphQL endpoint：`http://127.0.0.1:8787/graphql`
   - 可在 GraphiQL/Altair 测试：

     ```graphql
     query Ping { ping }
     mutation AskAI($prompt: String!) { askAI(prompt: $prompt) }
     ```

6. **部署到 Cloudflare**

   ```bash
   npm run deploy
   ```

   - 部署完成后获得 `https://<name>.workers.dev/graphql`
   - 如需修改名称、兼容日期，请编辑 `wrangler.toml`

7. **绑定自定义域（可选）**
   - Dashboard → Workers → 服务 → Settings → Triggers → Custom Domains
   - 添加如 `api.example.com`，按提示配置 DNS
   - 前端 `VITE_GRAPHQL_ENDPOINT` 指向 `https://api.example.com/graphql`

8. **日志与排查**
   - 本地：`npm run dev -- --log-level debug`
   - 线上：`wrangler tail` 或 Dashboard → Workers → Logs

> 建议部署完成后，使用 `graphql-request` 或 GraphiQL 再次测试 `askAI`，确认已能连通 OpenAI。
