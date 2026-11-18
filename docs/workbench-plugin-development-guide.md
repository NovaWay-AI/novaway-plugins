# NovaWay 完整工作台插件开发指南

> 文档版本：v1.0 / 2026-11-18  
> 适用范围：NovaWay Plugin Manifest v2、Plugin Host v2、官方插件市场  
> 配套文档：[`plugin-development-and-novaway-integration.md`](./plugin-development-and-novaway-integration.md)

本指南面向要开发“完整工作台”的团队，而不是只写一个 Skill 或 Tool 的开发者。阅读完后，你应该能够从产品设计开始，完成一个包含 Agent、Skill、Tool、Prompt、Command、MCP、设置页面和市场发布信息的可安装工作台插件。

典型工作台包括：

- 办公工作台：文档、PPT、表格、会议、资料、任务和沟通；
- 短剧生成工作台：选题、人物、分集、分镜、对白、配音和导出；
- 运营工作台：选题、内容生产、账号、发布、数据和复盘；
- 设计工作台：品牌、海报、封面、素材、规范和审稿；
- 行业工作台：将某个行业的角色、流程、工具、数据源和交付模板封装成一个可直接使用的产品。

---

## 1. 先理解工作台是什么

### 1.1 工作台不是单独的一种运行时插件类型

NovaWay 当前没有要求插件声明新的 `contributes.workbenches` 注册表。工作台是由插件贡献的 Agent 元数据动态组合出来的产品化模式：

```text
工作台 = 一个稳定的 workbench 元数据
       + 一组属于同一 modeGroup 的 Primary Agent
       + 这些 Agent 使用的 Skill
       + Agent 可调用的 Tool / Command / MCP / Provider
       + Prompt、模板、设置和可选 UI Surface
       + 市场目录中的中文展示信息
```

宿主只固定提供一个内核模式：`forge`（Creova）。办公、短剧、运营、设计等其他工作台都必须通过已安装并已激活的插件动态出现。

插件作者不应该修改 NovaWay 宿主源码来增加模式，也不应该要求用户安装后重启客户端。

### 1.2 工作台从哪里来

至少一个可见的 Primary Agent 需要声明：

```json
{
  "mode": "primary",
  "options": {
    "modeGroup": "office",
    "workbench": {
      "id": "zen",
      "name": "办公模式",
      "shortName": "办公",
      "icon": "Z",
      "description": "文档、演示、表格、会议和资料处理工作台。",
      "color": "var(--app-mode-zen)",
      "foreground": "var(--app-mode-zen-foreground)"
    }
  }
}
```

字段含义：

| 字段 | 是否必需 | 说明 |
|---|---:|---|
| `options.modeGroup` | 是 | Agent 所属工作台组。组内其他 Agent 使用相同值。建议使用稳定、全小写的英文值。 |
| `options.workbench.id` | 是，工作台拥有者 Agent 必须有 | 工作台稳定 ID，安装、持久化和动态模式匹配使用，不能随意改名。 |
| `options.workbench.name` | 是 | 左上角模式切换器中的完整名称。 |
| `options.workbench.shortName` | 是 | 小屏或胶囊切换器中的短名称。 |
| `options.workbench.icon` | 推荐 | 工作台图标或图标字母。 |
| `options.workbench.description` | 推荐 | 工作台用途说明。 |
| `options.workbench.color` | 推荐 | CSS 颜色变量或合法颜色值。 |
| `options.workbench.foreground` | 推荐 | 前景色变量或合法颜色值。 |

工作台拥有者 Agent 可以是办公场景的第一个 Agent，也可以是一个专门的工作台协调 Agent。其他 Agent 只需声明相同的 `modeGroup`，宿主会将它们归入同一个动态工作台。

### 1.3 动态生命周期

```text
市场安装 → 下载、校验、原子安装 → Host 发现 → Runtime 激活
→ Agent / Skill / Tool / Command 注册 → plugin.changed
→ NovaWay 实时刷新 → 左上角出现工作台
```

停用、卸载、更新和回滚也必须触发刷新：

```text
停用或卸载 → 释放注册项 → plugin.changed
→ 工作台消失 → 当前正在使用该工作台时回退到 forge
```

用户不应该为了使用或移除工作台而重启 NovaWay。

---

## 2. 开发前的产品设计

不要从 `plugin.json` 开始。先写一页工作台产品设计，至少回答下面的问题。

### 2.1 工作台定位

```text
工作台名称：短剧生成工作台
目标用户：短视频编剧、内容团队、制片人
核心结果：从一个主题生成可审阅、可修改、可导出的短剧方案
主要交付：选题卡、人物小传、分集大纲、分镜表、对白稿、导出包
```

### 2.2 工作台中的角色

每一个稳定的业务角色都应该对应一个 Primary Agent 或 Subagent：

| 角色 | Agent 类型 | 示例职责 |
|---|---|---|
| 工作台协调者 | `primary` | 理解用户目标、分派场景 Agent、汇总最终结果 |
| 选题策划 | `primary` | 生成选题、受众、冲突和卖点 |
| 剧本编剧 | `primary` | 编写分集剧情和对白 |
| 分镜导演 | `primary` | 将剧本拆成镜头、景别、动作和台词 |
| 质检员 | `subagent` | 检查人物一致性、节奏、敏感内容和格式 |

Primary Agent 出现在工作台的可选角色中；Subagent 用于内部协作，不应该因为它存在而生成一个新的模式。

### 2.3 场景和交付物

每个场景应该有明确的输入、处理、输出、验收和失败处理：

```text
用户目标 → 场景选择 → 主 Agent → Skill 方法论 → Tool 获取/生成资料
→ Subagent 检查 → Command / Surface 导出 → 用户审阅并继续修改
```

---

## 3. 推荐的插件目录

```text
com.acme.short-drama/
├── plugin.json
├── README.md
├── LICENSE
├── agents/
│   ├── workbench.md
│   ├── topic-planner.md
│   ├── script-writer.md
│   ├── storyboard-director.md
│   └── quality-reviewer.md
├── skills/
│   ├── short-drama-topic/SKILL.md
│   ├── short-drama-script/SKILL.md
│   └── short-drama-storyboard/SKILL.md
├── tools/
│   ├── character-sheet.mjs
│   ├── episode-outline.mjs
│   └── export-package.mjs
├── commands/
│   └── export-drama.md
├── mcp/
│   └── media-search.json
├── ui/
│   ├── settings.json
│   └── dashboard.html
└── test/
    ├── manifest.test.mjs
    └── acceptance.md
```

基本规则：

1. `plugin.json` 必须位于插件根目录；
2. 所有 `file`、`source.file` 和 `entry` 路径都必须位于插件根目录内；
3. 不要将 `.git`、`node_modules`、`.env`、密钥、缓存和本地用户数据打进 ZIP；
4. 每个本地 contribution ID 在插件内部保持稳定；
5. 外部引用使用最终命名空间，例如 `short-drama_script-writer`；
6. 不要依赖宿主当前工作目录；
7. 让 `README.md` 能解释安装后用户如何开始第一项任务。

---

## 4. 编写 Manifest v2

### 4.1 工作台 Manifest 示例

下面是一个可作为起点的声明式工作台。实际项目可以按需删减，但不要复制不需要的权限和贡献点。

```json
{
  "$schema": "https://gitee.com/NovaWay-AI/novaway-plugins/blob/main/catalog/schema/manifest.schema.json",
  "apiVersion": 2,
  "name": "short-drama",
  "version": "1.0.0",
  "kind": "declarative",
  "description": "短剧选题、剧本、分镜和交付工作台。",
  "engines": { "novaway": ">=0.0.0" },
  "categories": ["creative", "video", "productivity"],
  "activationEvents": ["onStartup"],
  "capabilities": {
    "fs": ["plugin-data", "workspace-read", "workspace-write"],
    "network": ["api.example.com"],
    "secrets": ["media-api-token"],
    "tools": [
      "short-drama_character-sheet",
      "short-drama_episode-outline",
      "short-drama_export-package"
    ],
    "ui": ["short-drama.dashboard"]
  },
  "contributes": {
    "agents": [
      {
        "id": "workbench",
        "description": "短剧生成工作台协调者，负责理解目标并组织选题、剧本和分镜流程。",
        "mode": "primary",
        "prompt": { "file": "./agents/workbench.md" },
        "tools": [
          "short-drama_character-sheet",
          "short-drama_episode-outline",
          "short-drama_export-package"
        ],
        "options": {
          "displayName": "短剧工作台",
          "category": "短剧生成",
          "modeGroup": "short-drama",
          "workbench": {
            "id": "short-drama",
            "name": "短剧生成",
            "shortName": "短剧",
            "icon": "S",
            "description": "从选题到剧本、分镜和交付包的一体化短剧创作空间。",
            "color": "var(--app-mode-short-drama, var(--app-mode-forge))",
            "foreground": "var(--app-mode-short-drama-foreground, var(--app-mode-forge-foreground))"
          },
          "scene": "orchestrate"
        }
      },
      {
        "id": "topic-planner",
        "description": "短剧选题策划，输出受众、冲突、卖点和可拍摄性分析。",
        "mode": "primary",
        "prompt": { "file": "./agents/topic-planner.md" },
        "options": {
          "displayName": "选题策划",
          "category": "短剧生成",
          "modeGroup": "short-drama",
          "scene": "topic"
        }
      },
      {
        "id": "script-writer",
        "description": "短剧编剧，输出分集大纲、场次、对白和动作。",
        "mode": "primary",
        "prompt": { "file": "./agents/script-writer.md" },
        "options": {
          "displayName": "剧本编剧",
          "category": "短剧生成",
          "modeGroup": "short-drama",
          "scene": "script"
        }
      },
      {
        "id": "storyboard-director",
        "description": "分镜导演，将剧本转换成镜头表和拍摄执行信息。",
        "mode": "primary",
        "prompt": { "file": "./agents/storyboard-director.md" },
        "options": {
          "displayName": "分镜导演",
          "category": "短剧生成",
          "modeGroup": "short-drama",
          "scene": "storyboard"
        }
      },
      {
        "id": "quality-reviewer",
        "description": "检查人物一致性、剧情节奏、格式和内容安全。",
        "mode": "subagent",
        "prompt": { "file": "./agents/quality-reviewer.md" },
        "options": { "modeGroup": "short-drama" }
      }
    ],
    "skills": [
      {
        "id": "topic-planning",
        "description": "短剧选题方法和输出格式。",
        "source": { "file": "./skills/short-drama-topic/SKILL.md" }
      },
      {
        "id": "script-writing",
        "description": "短剧剧本和对白写作方法。",
        "source": { "file": "./skills/short-drama-script/SKILL.md" }
      },
      {
        "id": "storyboarding",
        "description": "短剧分镜拆解和拍摄表格式。",
        "source": { "file": "./skills/short-drama-storyboard/SKILL.md" }
      }
    ],
    "tools": [
      {
        "id": "character-sheet",
        "description": "根据人物输入生成结构化人物卡。",
        "parameters": {
          "type": "object",
          "properties": {
            "characters": { "type": "array", "items": { "type": "string" } },
            "constraints": { "type": "string" }
          },
          "required": ["characters"],
          "additionalProperties": false
        },
        "safety": {
          "readOnly": false,
          "destructive": false,
          "idempotent": true,
          "maxResultBytes": 20000,
          "interrupt": "cancel"
        },
        "entry": "./tools/character-sheet.mjs"
      },
      {
        "id": "episode-outline",
        "description": "生成分集大纲并保存为工作台数据。",
        "parameters": {
          "type": "object",
          "properties": {
            "title": { "type": "string" },
            "episodes": { "type": "integer", "minimum": 1, "maximum": 100 },
            "premise": { "type": "string" }
          },
          "required": ["title", "episodes", "premise"],
          "additionalProperties": false
        },
        "safety": {
          "readOnly": false,
          "destructive": false,
          "idempotent": true,
          "maxResultBytes": 50000,
          "interrupt": "cancel"
        },
        "entry": "./tools/episode-outline.mjs"
      },
      {
        "id": "export-package",
        "description": "将当前短剧资料导出为可交付的 Markdown/JSON 包。",
        "parameters": {
          "type": "object",
          "properties": {
            "project": { "type": "string" },
            "format": { "type": "string", "enum": ["markdown", "json"] }
          },
          "required": ["project", "format"],
          "additionalProperties": false
        },
        "safety": {
          "readOnly": false,
          "destructive": false,
          "idempotent": true,
          "maxResultBytes": 10000,
          "interrupt": "cancel"
        },
        "entry": "./tools/export-package.mjs"
      }
    ],
    "commands": [
      {
        "id": "new-drama",
        "description": "创建一个新的短剧项目。",
        "template": "创建一个短剧项目：$ARGUMENTS",
        "argumentHint": "题材、受众、集数和平台",
        "agent": "short-drama_workbench"
      },
      {
        "id": "export-drama",
        "description": "导出当前短剧交付包。",
        "template": "导出当前短剧项目，格式为 $ARGUMENTS",
        "argumentHint": "markdown 或 json",
        "agent": "short-drama_workbench"
      }
    ],
    "storage": {
      "namespace": "short-drama",
      "migrations": "./runtime/storage-migrations.mjs"
    }
  }
}
```

说明：

- `workbench` 是 Agent `options` 中的扩展元数据，不是宿主静态模式表；
- `modeGroup` 必须在同一个工作台的 Agent 之间保持一致；
- `workbench.id` 应该全局稳定，不能用中文显示名代替；
- `agent`、`tools` 等引用使用插件命名空间；
- `capabilities` 是运行时权限，不是市场分类；
- `surfaces` 是可选 UI，不是工作台存在的必要条件；
- 如果不需要设置页面、首页卡片或自定义预览，不要为了“看起来完整”强行声明它们。

### 4.2 命名空间和 ID

```text
插件 Manifest name：short-drama
本地 Agent id：workbench
最终 Agent id：short-drama_workbench
本地 Tool id：episode-outline
最终 Tool id：short-drama_episode-outline
```

本地 ID 与最终 ID 分开理解。跨贡献引用使用最终命名空间，不能把最终名称重复写入本地 `id`，否则更新和迁移时容易产生双重前缀。

### 4.3 ID 变更策略

以下字段视为稳定协议：Manifest `name`、catalog `packageId`、`workbench.id`、Agent/Skill/Tool/Command ID、持久化 namespace 和跨贡献引用。只改名称、图标、描述或中文显示名时保持 ID 不变；确需更换 ID 时必须提供迁移说明。

## 5. 编写 Agent：工作台的角色层

### 5.1 工作台协调 Agent

协调 Agent 的职责不是把所有业务知识塞进一段超长 Prompt，而是：

1. 判断用户想做哪一种场景；
2. 选择合适的 Agent、Skill、Tool 或 Command；
3. 向用户确认关键约束；
4. 组织中间产物和质量检查；
5. 返回清晰的下一步和最终交付物。

`agents/workbench.md` 建议结构：

```markdown
# 短剧生成工作台协调者

## 角色
你负责把用户的短剧目标拆解成可执行的选题、剧本、分镜和交付流程。

## 开始前必须确认
- 题材和受众
- 平台和时长
- 集数或总时长
- 期望的交付格式
- 是否有必须保留的人物、品牌或素材

## 场景路由
- 只有选题想法：使用选题策划
- 已有梗概并需要完整剧情：使用剧本编剧
- 已有剧本并准备拍摄：使用分镜导演
- 用户要求验收：调用质检 Agent

## 输出约束
- 先给结论和当前状态
- 清楚区分用户事实、模型推断和待确认事项
- 不要声称已经生成文件，除非 Tool 返回成功结果
- 任何导出前先让用户确认标题、版本和格式

## 失败处理
- 资料不足：列出缺失信息，不要编造
- 工具失败：说明失败阶段、可重试动作和已保存的中间结果
- 权限不足：解释需要的权限，不要绕过权限
```

### 5.2 场景 Agent

每个场景 Agent 应该有明确输入和输出，通过 Skill 引用详细方法论，只绑定完成工作所需的 Tool，并定义质量标准和失败状态。不要把密钥、内部路径或宿主实现细节写入输出。

### 5.3 Subagent

Subagent 适合做结构检查、事实核验、格式转换、内容安全检查和生成第二意见。Subagent 不应该声明自己的 `workbench` 对象，也不应该让宿主生成新的工作台模式。

---

## 6. 编写 Skill：工作台的方法论层

Skill 不是“再写一遍 Agent Prompt”。Skill 是可复用的操作方法、格式规范、检查表和示例。

推荐 `SKILL.md` 结构：

```markdown
---
name: short-drama-script
description: 编写可拍摄的短剧分集剧本、场次、对白和动作。
---

# 短剧剧本 Skill

## 适用场景
当用户已经有选题或梗概，需要生成可审阅的分集剧本时使用。

## 输入
- 故事 premise
- 人物卡
- 集数和单集时长
- 平台限制
- 内容边界

## 工作流程
1. 提取冲突和主线目标
2. 为每集确定开场钩子、推进、转折和结尾悬念
3. 将每集拆成场次
4. 编写动作、对白和情绪变化
5. 检查人物动机和前后集连续性

## 输出格式
每集必须包含：集标题、本集目标、场次列表、场景/时间、人物、动作、对白和结尾悬念。

## 质量检查
- 每一集都有可执行冲突
- 人物行为符合人物卡
- 对白没有替代动作说明的空话
- 不把未确认事实写成事实
- 不输出未通过审查的敏感内容
```

Skill 的描述要能让 Agent 判断“什么时候使用”。不要把整个插件的所有知识都放进一个没有边界的 Skill。

---

## 7. 编写 Tool：工作台的执行层

### 7.1 Tool 设计原则

Tool 是可执行能力，不是 Prompt 的别名。每个 Tool 都要定义输入 JSON Schema、输出结构、是否只读、是否可重复、是否破坏性、最大结果大小、中断行为以及失败和重试策略。

默认安全值是最保守的：写操作、不可并发、具有破坏性、不可重试、需要用户确认。因此只读 Tool 也应显式声明 `readOnly: true`，不要依赖默认值。

### 7.2 Tool entry 示例

```js
// tools/character-sheet.mjs
export default (api) => ({
  async execute(args, context) {
    const characters = Array.isArray(args?.characters)
      ? args.characters.filter((item) => typeof item === "string")
      : []

    if (characters.length === 0) throw new Error("至少需要一个人物名称")
    if (context?.signal?.aborted || api.signal?.aborted) throw new Error("操作已取消")

    return {
      version: 1,
      characters: characters.map((name) => ({
        name,
        role: "待确认",
        goal: "待补充",
        conflict: "待补充",
        relationship: "待补充"
      })),
      constraints: typeof args.constraints === "string" ? args.constraints : ""
    }
  }
})
```

生产 Tool 还应限制输入长度和数组数量、限制输出字节数、使用 AbortSignal、不记录 Token 和完整用户资料、对文件写入使用插件数据区或用户明确选择的工作区路径，并将中间产物和最终产物区分开。

### 7.3 不要把所有工作都做成 Tool

只是提示词模板、固定输出格式或无副作用的方法论，优先使用 Skill 或 Command。需要真实文件读写、远程 API、结构化产物或明确副作用时才使用 Tool。

---

## 8. Command、MCP、Provider 和 Office 能力

### 8.1 Command

Command 是用户可重复调用的入口，适合新建工作台项目、生成固定类型产物、导出结果和执行一次明确工作流。模板支持 `$ARGUMENTS` 与 `$1` 到 `$9`，不应该绕过用户确认直接执行破坏性操作。

### 8.2 MCP

MCP 适合封装素材库、企业知识库、发布平台、数据库和设计资源服务。必须明确 local/remote 类型，声明网络和密钥 capability，在 README 中说明首次配置、超时、失败与重试策略，不能把 Token 写进 Manifest 或 Release ZIP。

### 8.3 Provider

只有确实要让 NovaWay 将其识别为模型供应商时才声明 Provider。需要同步提供 Provider ID、模型列表或发现逻辑、认证方式、base URL、价格和能力信息，以及 Tool choice、reasoning、system role 等兼容性说明。

### 8.4 Office Engine

Office Engine 适用于文档、表格、演示和 PDF 文件处理。需要声明格式、文件扩展名、只读能力和包内 entry。不要仅因为工作台叫“办公”就声明 Office Engine，只有插件真的提供对应引擎时才声明。

---


### 8.5 更多贡献类型

NovaWay Manifest v2 还支持 `interceptors`、`providers`、`officeEngines`、`publishDrivers`、`previewers`、`surfaces`、`storage`、`httpRoutes`、`triggers`、`fastPath`、`routingPolicies`、`workerTypes`、`watchdogPolicies`、`channels`、`schedulers`、`eventSources`、`agentRuntimes`、`superAgentStrategies`、`taskKinds`、`verifiers`、`repairStrategies`、`agentTemplates`、`superAgentPolicies` 和 `superAgentSurfaces`。

不要为了让工作台“看起来完整”全部声明这些贡献点。只选择真实消费者会使用、并且有测试和生命周期实现的能力。字段完整契约以 `packages/plugin-api/src/manifest.ts`、`contributions.ts` 和 `superagent.ts` 为准。

---

## 9. UI 和设置设计

完整工作台可以没有自定义 UI，直接复用 NovaWay 的会话、模式切换器、Agent 选择和文件能力。只有产品确实需要时才增加 Surface。

推荐的 UI 层次：

```text
左上角模式切换器：工作台身份
首页卡片：快速开始一个场景
会话输入框：自然语言任务
Agent 选择器：场景角色
Surface：设置、仪表板、导出、账号连接
文件预览：产物查看和审阅
```

第三方 UI 规则：

- 优先使用 declarative view 或受限 iframe；
- 不引用宿主内部组件名；
- 不直接调用宿主任意命令；
- Surface Command 只能引用同一插件声明的 Command；
- 远程页面不能把用户密钥拼到 URL；
- `secret` 是输入类型，不等于插件可以忽略密钥保护；
- 插件停用后 UI 应消失或显示不可用状态；
- UI 不应成为工作台出现的唯一条件，工作台身份必须来自 Agent 元数据。

---

## 10. 权限、数据和生命周期

### 10.1 最小权限

按最小权限声明：

```json
{
  "capabilities": {
    "fs": ["plugin-data", "workspace-read"],
    "network": ["api.example.com"],
    "process": [],
    "secrets": ["api-token"],
    "tools": ["short-drama_export-package"],
    "ui": ["short-drama.dashboard"]
  }
}
```

不要为了避免调试报错而声明 `workspace-write`、全部网络域名或全部 Tool。

### 10.2 数据分层

| 数据 | 推荐位置 | 说明 |
|---|---|---|
| 插件默认模板 | Release 包内 | 版本化、只读 |
| 用户设置 | `storage` namespace | 可迁移，不写入其他插件 namespace |
| API Token | `secrets` | 不写入 Prompt、日志和导出文件 |
| 中间工作数据 | 插件数据区或用户选定项目 | 明确生命周期 |
| 最终交付物 | 用户明确的工作区路径 | 通过 Tool 或导出操作产生 |

### 10.3 可释放资源

Timer、WebSocket、EventSource、文件监听、子进程、MCP 连接、事件订阅、临时文件和 Registry 注册项都必须支持停用时释放。不要在模块顶层启动一个无法停止的后台任务，使用 PluginContext 的 `signal` 响应取消和停用。

---

## 11. 本地开发和实时验收

### 11.1 项目插件目录

```text
my-project/
└── .novaway/
    └── plugins/
        └── com.acme.short-drama/
            ├── plugin.json
            ├── agents/
            ├── skills/
            └── tools/
```

本地开发阶段先验证：Manifest 能被发现、贡献能注册、工作台拥有者元数据能读取、同组 Agent 能被过滤到同一工作台、Tool/Command/Skill 命名空间正确、停用后工作台消失、重新启用后重新出现，并且全程不需要重启。

### 11.2 HTTP 检查

根据当前宿主实例地址检查：

```text
GET /extension
GET /extension/contributions
```

重点查看插件 status 是否为 `active`、manifest issue、Agent 的 `mode`/`options.modeGroup`/`options.workbench`、最终命名空间以及停用后的清理结果。

### 11.3 市场安装验收

```text
目录加载 → 详情展示 → 安装确认 → 下载 → SHA-256 校验
→ staging → 原子替换 → 激活 → 注册 → 左上角出现工作台
→ 停用/卸载 → 工作台消失
```

安装、更新、回滚和卸载都应该在 operation history 中变成 `completed`。普通 declarative 工作台不应该依赖重启才能出现。

---

## 12. 测试方案

### 12.1 插件仓库

```bash
cd /path/to/novaway-plugins
npm run validate
node scripts/index-local.mjs --check
python scripts/build_plugin.py com.acme.short-drama
```

测试至少包括 JSON Schema、包内路径、贡献 ID 唯一性、引用完整性、`modeGroup` 一致性、工作台拥有者元数据和 catalog capabilities 一致性。

### 12.2 工作台动态行为

宿主测试至少覆盖：

```text
无插件时：layout.mode.all() 只有 forge
安装工作台插件后：出现插件声明的 workbench.id
没有显式 workbench 时：不会被宿主自动映射成 zen/office 等静态 ID
同一 modeGroup 的多个 Agent：只产生一个工作台
停用插件后：工作台消失
卸载当前工作台：current 回退到 forge
旧持久化 ID：不会让已卸载工作台静态复活
```

### 12.3 Tool 和消费者

不要只测试 Tool 函数返回字符串。至少测试真实 Host 发现、激活、注册、Agent 引用 Tool、Command 引用 Agent、Skill 使用、错误和取消、结果大小限制以及停用后的清理。

### 12.4 公共 artifact

```bash
cd /path/to/novaway-coder/packages/novaway
NOVAWAY_OFFICE_PLUGIN_ARCHIVE=<ZIP绝对路径> bun test test/plugin/office-marketplace.test.ts --timeout 300000
```

工作台插件还应检查：catalog 包含 `marketTypes: ["workbench", ...]`、中文 display name、正确 SHA-256/size、安装后 workbench 元数据可见、左上角实时出现、卸载后实时消失。

---

## 13. 市场目录和中文显示名称

### 13.1 稳定 ID 与显示名分开

不要把中文名称写进 `packageId`：

```json
{
  "packageId": "com.acme.short-drama",
  "name": "short-drama",
  "displayName": "短剧生成工作台",
  "displayNameI18n": {
    "zh-CN": "短剧生成工作台",
    "zh-TW": "短劇生成工作台",
    "en": "Short Drama Workbench"
  }
}
```

`packageId` 用于安装、更新、卸载、依赖、冲突和运行时目录；`displayName` 是默认用户显示名；`displayNameI18n` 用于多语言市场卡片。

### 13.2 工作台 catalog 示例

```json
{
  "packageId": "com.acme.short-drama",
  "name": "short-drama",
  "displayName": "短剧生成工作台",
  "displayNameI18n": {
    "zh-CN": "短剧生成工作台",
    "zh-TW": "短劇生成工作台",
    "en": "Short Drama Workbench"
  },
  "version": "1.0.0",
  "description": "从选题到分镜和交付包的一体化短剧创作工作台。",
  "runtimeTargets": ["novaway-v2"],
  "packageFormats": ["release"],
  "capabilities": ["agents", "skills", "tools", "commands"],
  "marketTypes": ["workbench", "agents", "skills", "tools", "commands"],
  "compatibility": {
    "minNovaWayApi": "0.0.0",
    "manifestVersion": 2,
    "requiresRestart": false
  },
  "permissions": [],
  "artifacts": [
    {
      "type": "github-release",
      "url": "https://github.com/acme/short-drama/releases/download/com.acme.short-drama-v1.0.0/com.acme.short-drama-1.0.0.zip",
      "repository": "acme/short-drama",
      "tag": "com.acme.short-drama-v1.0.0",
      "asset": "com.acme.short-drama-1.0.0.zip",
      "sha256": "<64 位十六进制 SHA-256>",
      "size": 123456
    }
  ]
}
```

`capabilities` 表示插件真实贡献了什么；`marketTypes` 表示用户在市场里如何筛选它。`workbench` 只在确认插件形成可直接使用的产品化方案时添加。

---

## 14. 版本、依赖和发布

### 14.1 版本升级

以下变化必须发布新版本：Prompt 行为、Tool 参数或输出、Agent/Skill/Command ID、工作台 ID、权限、依赖版本或 artifact 内容。已经发布的 ZIP、tag、SHA-256 和 size 不可覆盖，修复必须使用新版本，例如 `1.0.1`。

### 14.2 依赖和冲突

如果工作台依赖 PPT、图片、MCP 或 Provider 插件：

```json
{
  "dependencies": {
    "com.acme.ppt-master": ">=6.9.0"
  },
  "conflicts": ["com.example.legacy-office"]
}
```

README 和市场详情必须说明依赖是否自动安装、是否需要单独启用、缺少依赖时哪些场景不可用，以及卸载主工作台时依赖是否保留。

### 14.3 Release 命名

推荐：

```text
packageId: com.acme.short-drama
tag:       com.acme.short-drama-v1.0.0
asset:     com.acme.short-drama-1.0.0.zip
```

目录、Release asset、artifact URL、SHA-256 和字节数必须一致。

---

## 15. 常见错误

### 错误 1：在宿主 `APP_MODES` 中添加工作台

错误做法：

```ts
APP_MODES.push({ id: "short-drama", ... })
```

后果是插件卸载后工作台仍然存在，市场安装状态和模式列表不一致。正确做法是在插件 Agent 的 `options.workbench` 声明元数据，让宿主动态读取。

### 错误 2：只写 `modeGroup: "office"`，没有 `workbench`

旧插件可能因此被归类为普通组，但不能可靠地提供产品化名称、颜色和稳定模式 ID。新插件必须让至少一个 Primary Agent 声明完整 `workbench`。

### 错误 3：每个 Agent 使用不同的 `modeGroup`

这会让一个工作台被拆成多个工作台，或者导致 Agent 在切换器中不可见。一个工作台的所有 Primary Agent 应使用同一个 `modeGroup`。

### 错误 4：把所有逻辑塞进一个超级 Agent

工作台不是一个巨型 Prompt。应将角色、方法论、执行动作、导出和验收拆成可测试的 Agent、Skill、Tool、Command。

### 错误 5：把展示名写进 packageId

中文名称可以修改，稳定 ID 不应该修改。使用 `displayName` / `displayNameI18n`。

### 错误 6：声明了权限但没有实际功能

过度声明权限会降低用户信任，也可能被 Host 拒绝。只声明当前版本真正需要的能力。

### 错误 7：只验证安装，不验证消费

“ZIP 下载成功”不等于“工作台可用”。必须验证发现、激活、注册、Agent 筛选、实际消费、停用和卸载清理。

### 错误 8：用宿主内置 Agent 作为插件回退

工作台插件缺失时应该提示用户安装或回退到 `forge`，不能偷偷使用宿主内置办公、短剧或运营 Agent，避免卸载后能力仍然残留。

### 错误 9：把密钥写进 Prompt、JSON 或日志

密钥只能通过 secrets/设置流程配置。导出、错误消息、截图和测试 fixture 都要检查脱敏。

---

## 16. 从零到发布的完整执行清单

### A. 产品设计

- [ ] 定义工作台名称、用户、核心结果和交付物。
- [ ] 列出场景 Agent、Subagent、Skill、Tool、Command 和外部连接器。
- [ ] 为每个场景定义输入、输出、质量检查和失败处理。
- [ ] 确认哪些能力必须在线、需要密钥或需要写文件。

### B. Manifest

- [ ] `apiVersion` 为 `2`。
- [ ] `name` 稳定、全小写、可作为命名空间。
- [ ] `kind: declarative`，或明确验证 code/mixed 的激活路径。
- [ ] 至少一个 Primary Agent 有完整 `modeGroup` + `workbench`。
- [ ] 同组 Agent 的 `modeGroup` 一致。
- [ ] 所有 Agent、Skill、Tool、Command ID 唯一且引用正确。
- [ ] Tool 有完整 JSON Schema 和安全属性。
- [ ] 只声明实际需要的 capability。

### C. 内容和执行

- [ ] Agent Prompt 有角色、输入、流程、输出、质量和失败处理。
- [ ] Skill 有清晰的适用场景和可复用方法。
- [ ] Tool 有输入校验、取消、结果大小和错误处理。
- [ ] Command 不绕过用户确认。
- [ ] MCP/Provider/Office Engine 有完整配置和 README。
- [ ] 所有资源停用时可释放。

### D. 本地验收

- [ ] `.novaway/plugins` 可以发现插件。
- [ ] `/extension` 中插件为 active。
- [ ] `/extension/contributions` 中贡献出现。
- [ ] 左上角只有 forge 或 forge + 插件工作台。
- [ ] 工作台能切换并过滤对应 Agent。
- [ ] Agent 能实际使用 Skill 和 Tool。
- [ ] 停用后工作台立即消失。
- [ ] 卸载当前工作台后回退到 forge。
- [ ] 不需要重启 NovaWay。

### E. 市场发布

- [ ] `npm run validate` 通过。
- [ ] ZIP 构建可复现。
- [ ] Release tag、asset、URL、SHA-256、size 一致。
- [ ] catalog 有 `displayName` / `displayNameI18n`。
- [ ] catalog 有 `marketTypes: ["workbench", ...]`。
- [ ] 公共 artifact 能冷启动安装、激活和消费。
- [ ] 更新、回滚、卸载和失败恢复通过。
- [ ] 发布后不覆盖旧版本。

---

## 17. 参考实现

官方办公工作台：

```text
plugins/com.novaway.office-suite/plugin.json
```

官方工作台验收实现：

```text
plugins/com.novaway.office-suite/plugin.json
plugins/com.novaway.office-suite/tools/workbench-status.mjs
```

通用插件对接指南：

```text
docs/plugin-development-and-novaway-integration.md
```

如果本指南与源码行为不一致，以以下 TypeScript 契约和实际测试为准：

```text
../novaway-coder/packages/plugin-api/src/manifest.ts
../novaway-coder/packages/plugin-api/src/contributions.ts
../novaway-coder/packages/plugin-api/src/context.ts
../novaway-coder/packages/app/src/context/layout.tsx
../novaway-coder/packages/novaway/src/plugin/manifest.ts
```
