# NovaWay 插件开发与市场对接指南

> 文档版本：v2 / 2026-11-17  
> 适用仓库：`../novaway-coder`（宿主）与当前仓库（官方市场）

本文覆盖插件开发、在本地接入 NovaWay、发布到官方市场，以及安装后的验收流程。若目标是开发包含多个 Agent、Skill、Tool、Prompt 和动态工作模式的完整产品化工作台，请先阅读：[`workbench-plugin-development-guide.md`](./workbench-plugin-development-guide.md)。规范以代码为准：

- Manifest 类型：`../novaway-coder/packages/plugin-api/src/manifest.ts`
- Contribution 类型：`../novaway-coder/packages/plugin-api/src/contributions.ts`、`../novaway-coder/packages/plugin-api/src/superagent.ts`
- 运行时上下文：`../novaway-coder/packages/plugin-api/src/context.ts`
- Manifest 解析与安全校验：`../novaway-coder/packages/novaway/src/plugin/manifest.ts`
- 官方市场 Manifest Schema：`catalog/schema/manifest.schema.json`

---

## 1. 目前市场是否已经可以正常使用？

**可以，但要明确“可用”的边界。** 截至 2026-11-17，NovaWay 官方市场已经打通并验收了以下生产链路：

1. 从官方 catalog 读取插件元数据；
2. 展示插件、分类、能力、兼容性、权限和 SHA-256；
3. 通过 HTTPS 下载不可变 Gitee archive ZIP；
4. 校验 SHA-256、下载大小、ZIP 路径、重复项、软链接和 POSIX 节点；
5. staging 后原子安装；
6. Plugin Host v2 发现、校验、激活并注册贡献；
7. 实际消费者使用 Agent、Skill、Tool、Command 及其他已发布贡献；
8. 停用时释放注册项；
9. 更新、回滚、卸载和失败恢复；
10. Web/Desktop、TUI、CLI 共用持久化的 marketplace operation history。

官方目录入口：

```text
https://gitee.com/NovaWay-AI/novaway-plugins/raw/main/catalog/index.json
```

官方插件仓库：

```text
https://gitee.com/NovaWay-AI/novaway-plugins
```

### 1.1 已有验收证据

- 当前仓库：`npm run validate` 已通过，当前目录包含 2 个稳定目录条目和 2 个本地包索引条目。
- 当前工作区公共能力验收：

  ```text
  cd ../novaway-coder/packages/novaway
NOVAWAY_OFFICE_PLUGIN_ARCHIVE=<ZIP绝对路径> bun test test/plugin/office-marketplace.test.ts
  1 pass, 0 fail, 126 expect()
  ```

  该测试使用不可变公开 artifact，校验目录、版本、大小、SHA-256，经过真实 `Marketplace.installZip`、Plugin Host v2 激活，并消费已发布能力。

- 核心 Host/Runtime 回归：`106 tests / 105 pass / 1 skip / 0 fail`。
- 总体验收报告见：`../novaway-coder/docs/plugin-marketplace-final-acceptance.md`。

### 1.2 仍然要注意的事项

- 当前 `novaway-coder` 工作树有大量未提交修改；上面的测试证明当前源码链路可用，**不等于这些修改已经形成新的正式 NovaWay Release**。
- 已发布版本不可覆盖。任何代码、Manifest、权限或 artifact 改动都必须增加版本并创建新的 Release。
- `catalog/index.json` 可以保留历史版本；发布的 ZIP、版本和 digest 都是不可变的。
- `PPT Master` 当前包含 13,091 个资源文件，ZIP 安装器的条目上限已调整为 20,000，资源包可以走完整安装链路；但“插件能安装”不等于“模型已经生成了正确的 Office/PPT 产物”，后者仍需单独做客户端产物验收。
- `kind: code` / `kind: mixed` 虽然已经进入 v2 类型契约，但当前公开市场的统一安装验收路径以 `kind: declarative` 为准。第三方市场插件应使用声明式 Manifest，并通过 `entry` 加载受控的包内模块；不要仅因为 Schema 接受 `main` 就认为代码型插件已经可从市场激活。

---

## 2. 插件模型和目录结构

NovaWay 的原生市场格式是 **Manifest v2**。Claude 插件、旧 Extension、`novaway.json` 插件和 TUI 插件可以被兼容归一化，但新插件不要依赖这些旧格式。

一个可发布插件的推荐目录：

```text
my-plugin/
├── plugin.json
├── README.md
├── LICENSE
├── agents/
│   └── reviewer.md
├── skills/
│   └── my-skill/
│       └── SKILL.md
├── tools/
│   └── echo.mjs
├── commands/
│   └── ...
├── runtime/
│   └── ...
└── test/
    └── ...
```

约束：

- `plugin.json` 必须位于 ZIP 解包后的插件根目录；ZIP 可以有一层顶层目录，安装器会尝试 unwrap。
- 所有 `entry`、prompt、Skill 和迁移文件必须位于插件根目录以内。
- 不要把 `node_modules`、`.git`、用户密钥、构建缓存打进 Release。
- Manifest 中的插件 `name` 是命名空间，不是只用于展示的名称。
- 作者写的本地 contribution id 最终会变成 `plugin-name_local-id`，避免跨插件冲突。

---

## 3. 最小 Manifest

### 3.1 只提供 Skill

```json
{
  "$schema": "https://gitee.com/NovaWay-AI/novaway-plugins/blob/main/catalog/schema/manifest.schema.json",
  "apiVersion": 2,
  "name": "acme-weather",
  "version": "1.0.0",
  "kind": "declarative",
  "description": "Weather guidance for NovaWay.",
  "engines": { "novaway": ">=0.0.0" },
  "categories": ["developer-tools"],
  "activationEvents": ["onStartup"],
  "contributes": { "skills": ["./skills"] }
}
```

`./skills` 目录中需要有一个或多个 `SKILL.md`。Skill 的 front matter 至少应包含：

```markdown
---
name: acme-weather-skill
description: Explain how to use the weather capability.
---

# Weather skill

Describe the behavior and safety boundaries here.
```

### 3.2 提供 Tool、Agent、Skill、Command

```json
{
  "apiVersion": 2,
  "name": "acme-assistant",
  "version": "1.0.0",
  "kind": "declarative",
  "description": "An example executable NovaWay plugin.",
  "engines": { "novaway": ">=0.0.0" },
  "contributes": {
    "tools": [
      {
        "id": "echo",
        "description": "Echo user-provided text.",
        "parameters": {
          "type": "object",
          "properties": { "text": { "type": "string" } },
          "required": ["text"],
          "additionalProperties": false
        },
        "entry": "./tools/echo.mjs"
      }
    ],
    "agents": [
      {
        "id": "reviewer",
        "description": "Reviews a request and returns an evidence-based plan.",
        "mode": "subagent",
        "prompt": { "file": "./agents/reviewer.md" },
        "tools": ["acme-assistant_echo"]
      }
    ],
    "skills": ["./skills"],
    "commands": [
      {
        "id": "plan",
        "description": "Create an implementation plan.",
        "template": "Create a concise implementation plan for $ARGUMENTS",
        "argumentHint": "$ARGUMENTS",
        "agent": "acme-assistant_reviewer"
      }
    ]
  }
}
```

注意：

- Agent 必须是对象声明，不能只写一个目录字符串。
- Agent 的 `tools`、Command 的 `agent` 应使用最终命名空间名称，例如 `acme-assistant_echo`。
- Command 的模板只会进入输入框；它不会绕过用户输入框直接调用宿主命令。
- Tool 的 JSON Schema 是模型可见契约，不能用运行时参数校验代替。

---

## 4. 可用 Contribution 总览

Manifest 的 `contributes` 键来自 `@novaway/plugin-api` 的唯一清单。当前支持：

| Manifest 键 | 用途 | 典型形式 | 主要限制 |
|---|---|---|---|
| `tools` | 模型可调用工具 | 对象数组，含 `id`、`description`、`parameters`、`entry` | 默认按写操作、需确认、不可重试处理；安全属性应显式声明 |
| `agents` | Primary/Subagent | 对象数组，含 `prompt` | Prompt 可内联或包内文件 |
| `skills` | Skill 目录或声明 | `"./skills"` 或对象数组 | 目录中使用 `SKILL.md` |
| `commands` | Slash command 模板 | 对象数组 | 支持 `$ARGUMENTS`、`$1` 到 `$9` |
| `interceptors` | 消息、工具、权限等拦截器 | `"./interceptors.mjs"` | 导出对象或数组；必须可释放 |
| `providers` | Provider 描述/适配器 | `"./provider.mjs"` 数组 | 第三方必须经过 capability gate |
| `officeEngines` | Office 文件读写引擎 | 对象数组，含 `format`、`kind`、`extensions`、`entry` | 市场插件需声明 `capabilities.ui: ["office-engine"]` |
| `publishDrivers` | 发布账号和发布驱动 | entry 字符串数组 | 必须在 `capabilities.publishDrivers` 中列出 driver id 或 `*` |
| `surfaces` | 侧栏、设置、会话等 UI 入口 | 声明式对象数组 | 第三方 UI 使用 iframe；不能加载宿主 builtin component |
| `previewers` | 文件预览器 | `match` + `render` 或 `viewId` | 第三方优先 iframe，声明 `readOnly` 和 priority |
| `mcpServers` | MCP Server | id 到配置的对象 | `local` 用 command，`remote` 用 URL |
| `outputStyles` | 输出风格 | 包内模块路径 | 由宿主加载模块导出 |
| `lspServers` | LSP Server | 包内模块路径 | 命令和语言配置由声明提供 |
| `httpRoutes` | 插件 HTTP 路由 | 对象数组，含 method/path/entry | 宿主自动加 `/plugin/<pluginID>` 前缀 |
| `triggers` | Super-Agent 触发器 | 含 `id`、`kind`、`entry` | `match` 应轻量、无副作用 |
| `fastPath` | 0 token 快速路径 | 含 `id`、`entry` | 只能基于结构化事实处理 |
| `routingPolicies` | 线程路由 | 含 `id`、`entry` | 返回结构化 `RoutingDecision` |
| `workerTypes` | Worker 类型 | 含 `id`、`entry` | 必须实现 Worker 生命周期 |
| `watchdogPolicies` | 看门狗策略 | 含 `id`、`entry` | 基于可观测进展 |
| `channels` | 对话/IM/结构化通知通道 | 含 `id`、`kind`、`entry` | IM 文本有长度边界 |
| `schedulers` | 定时任务 | 含 schedule、entry | 返回可释放资源 |
| `eventSources` | 文件、Webhook、轮询等事件源 | 含 kind、entry | `start()` 必须返回 Disposable |
| `agentRuntimes` | Super-Agent Runtime | 含版本、能力、entry | 声明 streaming/pause/resume/cancellation |
| `superAgentStrategies` | 策略 | 含版本、entry | 可标记 deterministic |
| `taskKinds` | Task 类型 | 含版本、entry | 声明任务能力 |
| `verifiers` | 验证器 | 含版本、entry、kinds | 明确能验证的 Task 类型 |
| `repairStrategies` | 修复策略 | 含版本、entry | 明确 failureKinds |
| `agentTemplates` | Agent 模板 | 声明式对象 | 提供 title、description、goal、tags |
| `superAgentPolicies` | Super-Agent 策略 | 含版本、entry | 通过 capability 授权 |
| `superAgentSurfaces` | Super-Agent UI | 声明式对象 | 只能使用受支持 slot/render |
| `storage` | 插件 KV 和迁移设置 | `{namespace, migrations}` | 插件级设置，不是带 id 的 registry item |
| `lifecycleHooks` | 生命周期模块 | 包内模块路径 | 与 `interceptors` 不同 |

所有条目的完整字段以 TypeScript 类型为准。未识别的 `contributes` 键会产生诊断并被忽略。

---

## 5. Tool、模块和运行时写法

### 5.1 Tool entry

`entry` 指向插件根目录内的 ES module。推荐导出一个接收插件 API 的工厂：

```js
// tools/echo.mjs
export default (api) => ({
  async execute(args, context) {
    const text = typeof args?.text === "string" ? args.text : ""
    api.log?.debug?.("echo called")
    return `echo:${text}`
  },
})
```

实际项目应使用 `AbortSignal`、限制结果大小、为写操作请求权限，并避免把 token 或完整用户输入写入日志。官方 fixture 可参考：
`plugins/com.novaway.office-suite/tools/workbench-status.mjs`。

### 5.2 拦截器和声明式 entry

声明为模块路径的贡献通常按以下规则加载：

```js
// interceptors.mjs
export default [
  {
    id: "trace",
    hook: "chat.params",
    handler(input, output) {
      if (output && typeof output === "object") output.myPlugin = true
    },
  },
]
```

`httpRoutes`、`triggers`、`fastPath`、`routingPolicies`、`workerTypes`、`watchdogPolicies`、`channels`、`schedulers`、`eventSources` 等带 `entry` 的对象，入口模块可以导出一个对象；宿主会把 Manifest 的静态字段和模块导出合并，并在加载时校验 id 与路径。

不要：

- 使用 `../` 越出插件根目录；
- 在模块加载顶层启动无法停止的 timer、socket 或 child process；
- 隐式依赖宿主当前工作目录；
- 在停用后继续注册或执行工具。

### 5.3 第三方 PluginContext 和权限

第三方插件拿到的是受限的 `PluginContext`，包括：

- `tools`、`agents`、`commands`、`skills`、`interceptors` 注册表；
- `storage` 插件专属 KV；
- `secrets` 密钥存取；
- `http` 网络客户端；
- `log` 和 `signal`；
- capability gate 后的 `providers` / `surfaces` 受限接口。

第三方不能直接访问第一方的完整 `KernelApi`，例如宿主 session、LLM、任意路径文件写入、任意配置写入和后台执行权限。能力必须写入 Manifest：

```json
{
  "capabilities": {
    "fs": ["plugin-data", "workspace-read"],
    "network": ["api.example.com"],
    "process": ["spawn"],
    "secrets": ["api-token"],
    "tools": ["acme-assistant_echo"],
    "providers": ["acme-provider"],
    "publishDrivers": ["acme-publisher"],
    "ui": ["office-engine"]
  }
}
```

未声明即拒绝。`capabilities` 是运行时边界，不是市场展示用的宣传字段；catalog 中的 `capabilities` 则是由真实 Manifest contribution 生成的检索元数据。

---

## 6. UI Surface 和 Previewer

第三方插件可以提供声明式 Surface：

```json
{
  "contributes": {
    "surfaces": [
      {
        "slot": "sidebar.item",
        "id": "dashboard",
        "title": "Dashboard",
        "icon": "dot-grid",
        "action": {
          "type": "view",
          "viewId": "acme-assistant.dashboard",
          "render": {
            "type": "iframe",
            "url": "https://example.com/dashboard.html"
          }
        }
      },
      {
        "slot": "settings.section",
        "id": "settings",
        "title": "Settings",
        "view": {
          "type": "declarative",
          "fields": [
            { "key": "token", "type": "secret", "label": "Token" },
            { "key": "enabled", "type": "boolean", "label": "Enabled", "default": true }
          ]
        }
      }
    ],
    "previewers": [
      {
        "id": "data-preview",
        "match": { "extension": ".acme" },
        "render": {
          "type": "iframe",
          "url": "https://example.com/preview.html"
        },
        "priority": 10,
        "readOnly": true
      }
    ]
  }
}
```

安全边界：

- 远程 iframe 使用 `sandbox="allow-scripts"` 和 `referrerPolicy="no-referrer"`。
- 第三方不能声明宿主内置组件作为 `builtin` renderer。
- Surface 的 `command` 只能引用同一插件声明的 Command；不能调用 `settings.*`、`session.*`、`plugin.*` 宿主命令。
- `secret` 只是密码输入样式；配置值仍可能以明文保存，插件必须在文档中告知用户。
- iframe 可以监听 `novaway.plugin.init`，并用 `novaway.plugin.action` 请求同插件 Command；宿主会验证 plugin id 和 command 所属关系。

---

## 7. 本地接入 NovaWay

### 7.1 直接作为项目插件调试

开发阶段不需要先发布市场。把插件目录放到项目的 `.novaway/plugins`：

```text
my-project/
└── .novaway/
    └── plugins/
        └── acme-assistant/
            ├── plugin.json
            ├── tools/
            └── ...
```

NovaWay 会从以下目录发现插件：

- `<config>/marketplace`：市场安装目录；
- `<config>/plugins`、`<config>/extensions`：用户插件；
- `<workspace>/.novaway/plugins`、`<workspace>/.novaway/extensions`：项目插件；
- 兼容的 Claude 目录和 TUI 入口。

然后执行重新加载，在 HTTP API 中检查：

```text
GET /extension
GET /extension/contributions
```

CLI 只读市场 operation history：

```bash
novaway marketplace operations --json
novaway marketplace operations --operation-id <operation-id> --json
```

### 7.2 通过 Web/Desktop 市场安装

打开 Settings → Extensions → Marketplace，默认官方源是：

```text
NovaWay Official
https://gitee.com/NovaWay-AI/novaway-plugins/raw/main/catalog/index.json
```

安装时应确认：

- source trust 为 `official` 或你明确接受的 `unverified`；
- 版本和 runtime target 正确；
- 权限列表符合预期；
- SHA-256 存在；
- operation history 最终为 `completed`，而不是只看到 `installed`。

市场界面和 HTTP API 使用同一条生命周期状态：`installationStatus`、`activationStatus`、`consumerStatus`、`cleanupStatus`、`requiresRestart`、`phase`、`progress`、`errorCode`、`recoveryHint`。

### 7.3 通过 HTTP API 安装

宿主提供：

```text
GET    /extension/marketplace
GET    /extension/marketplace/operations
GET    /extension/marketplace/operations/:operationId
POST   /extension/marketplace/install
POST   /extension/marketplace/:name/update/preview
POST   /extension/marketplace/:name/update
POST   /extension/marketplace/:name/rollback
DELETE /extension/marketplace/:name
```

ZIP 安装 payload 示例：

```json
{
  "kind": "zip",
  "name": "acme-assistant",
  "url": "https://github.com/acme/acme-assistant/releases/download/v1.0.0/acme-assistant-1.0.0.zip",
  "version": "1.0.0",
  "sha256": "<64 位十六进制 SHA-256>",
  "sourceId": "novaway-official",
  "permissions": [],
  "dependencies": {},
  "conflicts": []
}
```

宿主会强制 HTTPS、解析最终 redirect host、限制下载/解压大小、拒绝路径穿越和危险 ZIP 条目。不要在开发或生产流程中绕过这些校验。

### 7.4 本地源码和 artifact 验证

官方插件仓库当前命令：

```bash
cd /path/to/novaway-plugins
npm run validate
python scripts/build_plugin.py acme-assistant
# 若必须保留 ZIP 原始文件，则使用：
python scripts/build_plugin.py acme-assistant --stored
```

开发目录调试推荐直接使用 `.novaway/plugins`；如果要测试真实下载和 digest，必须把 ZIP 放在 HTTPS 可访问地址，并让安装请求携带 `sha256`。`file://` 和未经校验的本地路径不能代表市场安装行为。

---

## 8. 官方市场发布流程

官方市场仓库 当前仓库的责任边界是：插件源代码、Manifest Schema、catalog、artifact、digest、Release 和验收 fixture。推荐流程如下。

### Step 1：创建插件

```bash
cd /path/to/novaway-plugins
mkdir -p plugins/com.acme.weather
# 写 plugin.json、README.md、LICENSE 和贡献文件
```

市场 `packageId` 应与目录名一致，并且使用稳定、全小写、可长期维护的 id。不要把展示名称当 package id。

### Step 2：校验和打包

```bash
npm run validate
python scripts/build_plugin.py com.acme.weather
sha256sum dist/com.acme.weather-1.0.0.zip
```

Windows 可以使用：

```powershell
(Get-FileHash .\dist\com.acme.weather-1.0.0.zip -Algorithm SHA256).Hash.ToLower()
```

构建脚本会固定 ZIP 时间、统一文本换行，并输出 `packageId`、`version`、`asset`、`sha256`、`size`。构建结果必须可复现。

### Step 3：更新 catalog

每个稳定条目至少需要：

```json
{
  "packageId": "com.acme.weather",
  "name": "Acme Weather",
  "displayName": "天气助手",
  "displayNameI18n": {
    "zh-CN": "天气助手",
    "zh-TW": "天氣助手",
    "en": "Acme Weather"
  },
  "version": "1.0.0",
  "description": "...",
  "author": "Acme",
  "repository": "https://github.com/acme/weather",
  "license": "MIT",
  "categories": ["developer-tools"],
  "tags": ["weather"],
  "runtimeTargets": ["novaway-v2"],
  "packageFormats": ["release"],
  "compatibility": {
    "minNovaWayApi": "0.0.0",
    "manifestVersion": 2,
    "requiresRestart": false
  },
  "capabilities": ["skills", "tools"],
  "permissions": [],
  "artifacts": [
    {
      "type": "github-release",
      "url": "https://github.com/acme/weather/releases/download/com.acme.weather-v1.0.0/com.acme.weather-1.0.0.zip",
      "repository": "acme/weather",
      "tag": "com.acme.weather-v1.0.0",
      "asset": "com.acme.weather-1.0.0.zip",
      "sha256": "<构建输出>",
      "size": 12345
    }
  ]
}
```

`name` 是目录中的默认/英文名称；`displayName` 和 `displayNameI18n` 是市场卡片使用的用户可见名称。请保留稳定的英文 `packageId`，不要用中文替换它，因为安装记录、依赖、更新匹配、卸载路径和运行时命名空间都依赖 `packageId`。NovaWay 会按当前语言优先选择 `displayNameI18n`，然后回退到 `displayName`、`name` 和 `packageId`。

`capabilities` 应从真实 `contributes` 生成，不能按插件名称猜测。每个 artifact 必须有 HTTPS URL、完整 SHA-256 和精确字节数。

如需帮助用户按「工作台、智能体、技能、MCP 连接器、工具、桌面 UI」筛选，可在 catalog entry 增加 `marketTypes`。它是面向市场展示的稳定类型，不替代运行时 `capabilities`；例如办公工作台可以声明：

```json
{
  "marketTypes": ["workbench", "agents", "skills"],
  "capabilities": ["agents", "skills"]
}
```

`marketTypes` 支持 `workbench`、`agents`、`skills`、`mcp`、`tools`、`commands`、`providers`、`ui`、`office` 和 `interceptors`。一个插件可以同时属于多个类型。

### Step 4：创建不可变 Release

```bash
git tag com.acme.weather-v1.0.0
git push origin main --tags
```

Release asset 的文件名、tag、catalog URL、SHA-256、size 必须一一相等。不能重新上传不同内容覆盖同一版本；修复必须发布 `1.0.1`。

### Step 5：运行验收

```bash
cd ../novaway-coder/packages/novaway
bun run verify:plugins
bun run typecheck
```

插件贡献必须有真实消费者测试，至少证明：

1. catalog 能解析；
2. artifact 能下载并校验；
3. ZIP 能安全安装；
4. Plugin Host 能无诊断发现；
5. Plugin Host 能激活；
6. 贡献能在对应 registry 出现；
7. 代表性消费者实际使用贡献；
8. 停用或卸载后贡献被释放。

只有“目录能打开”或“ZIP 能下载”不能作为 stable 发布证据。

---

## 9. 测试清单

### 插件仓库

```bash
cd /path/to/novaway-plugins
npm run validate
node scripts/index-local.mjs --check
python scripts/build_plugin.py <package-directory-name>
```

### 宿主 Plugin API / Runtime

```bash
cd ../novaway-coder/packages/novaway
bun test test/plugin/manifest.test.ts
bun test test/plugin/host.test.ts
bun test test/plugin/catalog.test.ts
bun test test/plugin/runtime-context.test.ts
bun test test/plugin/runtime-host.test.ts
bun test test/plugin/runtime-tool.test.ts
bun test test/plugin/storage.test.ts
bun test test/plugin/runtime-hooks.test.ts
```

完整插件门禁：

```bash
bun run verify:plugins
```

### 公共 artifact 验收

```bash
NOVAWAY_OFFICE_PLUGIN_ARCHIVE=<ZIP绝对路径> bun test test/plugin/office-marketplace.test.ts --timeout 300000
```

此测试不是普通单元测试：它使用真实 Office ZIP、安装器和 Plugin Host 生命周期；本地验收通过后，再将同一个 ZIP 发布到 Gitee archive 并核对 catalog 摘要。

### App 浏览器验收

```bash
cd ../novaway-coder/packages/app
PLAYWRIGHT_PORT=3219 \
  bunx playwright test e2e/marketplace-lifecycle.spec.ts \
  --project=chromium --workers=1
```

应覆盖浏览、搜索、分类、官方源、详情、安装、进度、更新、回滚、卸载、失败恢复、离线目录错误和已安装插件开关。

---

## 10. 常见失败和排查方式

### 10.1 `manifest` 被标记为 invalid

检查：

- `apiVersion` 是否为 `2`；
- `name` 是否匹配 `^[a-z0-9][a-z0-9_-]*$`；
- `kind: code/mixed` 是否漏 `main`；
- `contributes` 是否为对象；
- Tool 是否同时有 `id`、`description`、`parameters`；
- Agent 和 Command 是否误写成旧目录字符串；
- `surfaces`、`previewers` 的 slot、match、render 是否完整。

通过 `/plugin/diagnostics`（如当前客户端暴露该诊断端点）或 `/extension` 的 issue 字段查看具体错误。

### 10.2 装上了但消费者看不到

按顺序区分四个状态：

```text
installed → discovered → active/registered → usable
```

- 只有 `installed`：检查插件是否被 Host 发现、Manifest 是否在插件根目录；
- 只有 `discovered`：检查 API 版本、engine、依赖、冲突和启用状态；
- 已 `active` 但没有 contribution：检查贡献 key、entry 路径和 registry；
- 已注册但不可用：检查消费者是否真的读取该 registry，不能只检查 UI 是否显示。

### 10.3 `capability_denied`

这是预期的安全失败，不是宿主随机错误。检查 Manifest 是否声明了对应能力：

- 网络：`capabilities.network` 主机白名单；
- 密钥：`capabilities.secrets` key；
- Provider：`capabilities.providers` provider id；
- Publish：`capabilities.publishDrivers` driver id；
- Office：市场插件需要 `capabilities.ui` 中的 `office-engine`；
- 文件和进程：`fs` / `process`；
- 工具调用：`tools`。

### 10.4 更新后出现重复 Command 或 Tool

不要手动把多个相同 package 的版本目录都放在 `.novaway/plugins` 或 marketplace 目录。市场安装器会按 `name@version` 管理并清理同名安装；手工复制时应删除旧副本，再执行 reload。

### 10.5 SHA-256 不一致

确认：

- catalog 指向的 Release tag 和 asset 名称正确；
- Windows/Linux 构建是否都使用了官方 `build_plugin.py`；
- Release asset 是否被重新上传；
- catalog 的 size 是否为下载后的真实字节数；
- 是否把源码 ZIP、GitHub 自动生成的 Source ZIP 和插件 artifact 混用了。

版本发布后不要修 catalog 来掩盖 artifact 变化，应创建新版本。

### 10.6 Surface 不显示

检查：

- slot 是否在白名单；
- 第三方是否误用 `builtin` component；
- iframe URL 是否为 `http(s)`；
- action command 是否确实由同一插件声明；
- 插件是否激活而不是只有静态发现；
- App 是否已经 reload，并查看 operation history。

---

## 11. 发布前最终检查表

### Manifest

- [ ] `apiVersion: 2`、稳定 `name`、SemVer `version`。
- [ ] `kind: declarative`，且没有把未接入的 `main` 路径当作市场激活能力。
- [ ] `engines.novaway`、description、license、categories 完整。
- [ ] 每个贡献都有静态声明；Tool 有完整 JSON Schema。
- [ ] 所有包内路径都在插件根目录内。
- [ ] 能力和权限按最小原则声明。

### 安全和生命周期

- [ ] 没有 secrets、`.env`、用户数据或 node_modules。
- [ ] 网络、文件、进程和密钥访问都有可解释的 capability。
- [ ] timer、listener、worker、event source 都能 dispose。
- [ ] Tool 有 abort、结果大小和破坏性操作处理。
- [ ] 停用、重新激活、更新、回滚后没有重复注册和资源泄漏。

### 市场

- [ ] `npm run validate` 通过。
- [ ] artifact 构建可复现。
- [ ] Release tag、asset、catalog URL、SHA-256、size 一致。
- [ ] 版本未覆盖已有 Release。
- [ ] catalog 的 capabilities 与真实 Manifest 一致。
- [ ] 有真实消费者测试，而不是只测 JSON 解析和下载。
- [ ] Web/Desktop 浏览器生命周期测试通过。
- [ ] 公共 artifact 冷启动、激活、消费和停用测试通过。

---

## 12. 参考实现

官方仓库中的最小可执行 fixture：

```text
plugins/com.novaway.office-suite
```

尤其建议阅读：

- `plugins/com.novaway.office-suite/plugin.json`
- `plugins/com.novaway.office-suite/tools/workbench-status.mjs`
- `plugins/com.novaway.office-suite/skills/ppt-workflow/SKILL.md`
- `plugins/com.novaway.office-suite/README.md`
- `scripts/build_plugin.py`
- `scripts/validate.mjs`
- `CONTRIBUTING.md`

NovaWay 侧的相关实现：

- `../novaway-coder/packages/novaway/src/extension/catalog.ts`：官方目录解析；
- `../novaway-coder/packages/novaway/src/extension/marketplace.ts`：下载、digest、安全解压、安装和回滚；
- `../novaway-coder/packages/novaway/src/plugin/host.ts`：发现、校验、依赖、冲突和状态；
- `../novaway-coder/packages/novaway/src/plugin/runtime/activation.ts`：Manifest 到 registry 的激活；
- `../novaway-coder/packages/novaway/src/plugin/runtime/host.ts`：激活、停用和资源释放；
- `../novaway-coder/packages/novaway/src/server/routes/instance/httpapi/groups/extension.ts`：市场 HTTP API；
- `../novaway-coder/packages/app/src/components/settings-market-catalog.tsx`：Web/Desktop 市场 UI。

## 11. Claude / ZCode 插件兼容性

NovaWay 可以从 Claude 和 ZCode 市场源导入并安装常见的声明式插件，但这不是对第三方私有运行时的完全承诺。市场适配器会把常见的 `Skill`、`Agent`、`Command`、基础 `MCP` 和部分 `Tool` 贡献归一化到 NovaWay v2，并继续经过权限、能力声明和资源路径校验。

| 来源和能力 | 兼容性 |
| --- | --- |
| Claude Skill、Command、常规 Agent、基础 MCP | 基础兼容，安装后使用 NovaWay 命名空间 |
| Claude 私有 runtime、私有 API、特殊 settings | 不保证，需要适配 |
| Claude 特殊 hooks 或交互协议 | 部分兼容，可能只保留声明式部分 |
| ZCode 普通 ZIP Skill | 基础兼容，按 SHA-256 校验后安装 |
| ZCode Agent、Command、MCP | 取决于 manifest 是否能映射到 NovaWay v2 |
| ZCode 私有 componentTypes、UI 和 runtime | 需要适配，不会绕过 NovaWay 权限边界 |

安装前应在详情中核对来源、版本、声明能力和权限。无法映射的专有运行时不会被当作原生 NovaWay 能力执行；插件仍然必须通过 capability gate 和用户权限检查。

## 12. 插件头像和目录展示元数据

目录条目可以声明 `displayName`、`displayNameI18n`、`icon` 和 `screenshots`。头像必须使用 HTTPS URL；`data:`、`file:`、`javascript:` 和 HTTP 地址会被目录解析器丢弃。推荐把 SVG 或 PNG 放在插件仓库的 `assets/icon.svg`，再在 catalog 中填写稳定的 Gitee raw URL：

```json
{
  "displayName": "办公工作台",
  "icon": "https://gitee.com/NovaWay-AI/novaway-plugins/raw/main/plugins/com.novaway.office-suite/assets/icon.svg"
}
```

市场卡片优先显示目录头像，网络失败或头像无效时自动回退到 NovaWay 生成式图标。头像不是插件执行入口，不会改变插件权限或可信等级。
