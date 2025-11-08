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

7. **绑定自定义域（解决域名冲突）**

   **⚠️ 重要：** 如果前端已经使用 `fhjkl.online`，Worker 需要使用子域名（如 `api.fhjkl.online`）避免冲突。

   **方法1：通过 Cloudflare Dashboard（推荐）**
   
   1. 登录 Cloudflare Dashboard
   2. 进入 **Workers & Pages**（不是单独的 Workers）
   3. 点击你的 Worker 服务名称（`graphql-chat-worker`）
   4. 点击 **Settings** 标签
   5. 滚动到 **Triggers** 部分
   6. 找到 **Routes** 或 **Custom Domains** 选项
   7. 点击 **Add Route** 或 **Add Custom Domain**
   8. 输入路由模式：`api.fhjkl.online/*` 或直接添加域名 `api.fhjkl.online`
   9. 选择 Zone：`fhjkl.online`
   10. 保存后，Cloudflare 会自动配置 DNS（如果没有配置，需要手动添加 CNAME 记录）

   **方法2：使用命令行**
   
   ```bash
   # 查看当前路由
   npx wrangler routes list
   
   # 如果需要，可以使用 wrangler 命令添加路由
   # 但通常通过 Dashboard 更直观
   ```

   **方法3：在 wrangler.toml 中配置（需要 zone_id）**
   
   如果知道 zone_id，可以在 `wrangler.toml` 中添加：
   ```toml
   routes = [
     { pattern = "api.fhjkl.online/*", zone_name = "fhjkl.online" }
   ]
   ```
   
   然后重新部署：`npm run deploy`

   **配置前端环境变量**
   
   在前端项目的 Cloudflare Pages 设置中，添加环境变量：
   - Key: `VITE_GRAPHQL_ENDPOINT`
   - Value: `https://api.fhjkl.online/graphql`

8. **日志与排查**
   - 本地：`npm run dev -- --log-level debug`
   - 线上：`wrangler tail` 或 Dashboard → Workers → Logs

> 建议部署完成后，使用 `graphql-request` 或 GraphiQL 再次测试 `askAI`，确认已能连通 OpenAI。
