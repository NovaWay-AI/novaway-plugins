# NovaWay Official Plugins

NovaWay 的公开官方插件市场仓库。

这个仓库负责维护：

- 版本化市场目录；
- NovaWay 官方插件；
- 插件 manifest 和 schema；
- 可控 fixture 与兼容性测试；
- Gitee archive 制品和 SHA-256；
- 目录生成与 Gitee archive 发布流程。

NovaWay 客户端从本仓库读取 `catalog/index.json`，根据目录中的 artifact 信息下载并校验插件，然后交给对应的 Plugin Runtime 安装和激活。

## 开发文档

- [完整工作台插件开发指南](docs/workbench-plugin-development-guide.md)：从产品设计、Manifest、Agent、Skill、Tool、Command、MCP、UI、权限、本地调试、动态模式验收到市场发布的完整流程。
- [通用插件开发与 NovaWay 对接指南](docs/plugin-development-and-novaway-integration.md)：Manifest v2、贡献类型、运行时、市场目录和公共 artifact 验收。

工作台不是宿主里静态写死的模式。插件需要在 Primary Agent 的 `options` 中声明 `modeGroup` 和 `workbench` 元数据；安装并激活后，NovaWay 会实时将它加入左上角工作模式切换器，停用或卸载后自动移除。


官方 stable 目录当前包含两个可安装官方工作流：

- `com.novaway.office-suite@0.3.1`：完整办公工作台，包含 9 个 Agent、14 个 Office Skill（含 Anthropic 官方 DOCX/PDF/PPTX/XLSX 技能）、Tool、Command 和内置 PPT Workflow；
- `com.novaway.powersnexus@1.1.0`：工程技能库。

两个 Smoke 测试插件已经从源码、stable/local catalog、Release artifact、发布流程 和公开验收入口全部移除，不再作为市场插件展示。

插件贡献必须遵守 NovaWay v2 manifest 契约：Agent 使用对象声明并提供 inline 或包内 prompt 文件，Skill 使用 `SKILL.md`，Tool 提供带静态 schema 的安全 entry，Command 提供可消费的模板声明。

## 目录入口

- Schema：`catalog/schema/`
- 稳定频道：`catalog/channels/stable.json`
- 生成后的入口：`catalog/index.json`
- 首方插件：`plugins/<package-id>/`
- 测试 fixture：`fixtures/`

## 分类与本地办公包

`catalog/taxonomy.json` 分开维护能力类型（Skill、Agent、Tool、MCP 等）、市场展示类型（工作台、智能体、技能、MCP 连接器、工具、主题、其他等）和用途（办公、开发、数据等）。一个插件可以有多种能力和展示类型；能力从真实 `contributes` 生成，市场展示类型用于帮助用户筛选，不按名称猜测。

`catalog/local.json` 是本地源码包索引，不是可添加到客户端的远程安装源；它没有伪造未发布的 Release URL。运行 `node scripts/index-local.mjs` 更新，运行 `npm run validate` 校验源码引用及 stable 目录。

`plugins/com.novaway.office-suite` 是完整办公工作台，包含 9 个 Agent、14 个 Office Skill（9 个 NovaWay 办公 Skill、内置 PPT Master，以及 Anthropic 官方 DOCX/PDF/PPTX/XLSX Skill）、一个安全 Tool 和一个 Command，并声明动态 `office` 工作台元数据。安装后的贡献使用 `office-suite_` 命名空间。

- 构建：`npm run build:office`，生成 `dist/com.novaway.office-suite-0.3.1.zip`。
- NovaWay 源码仓库中，从 `packages/novaway` 运行：`NOVAWAY_OFFICE_PLUGIN_ARCHIVE=<ZIP绝对路径> bun test test/plugin/office-marketplace.test.ts`。
- 测试使用真实 ZIP、安装器、发现/激活、Agent/Skill/Tool/Command 服务与停用流程；仅下载传输被替换为本地字节，不访问远程 artifact。
- PPT Workflow 的 13,091 个资源文件、上游许可证、署名和来源元数据随 Office Suite 一起发布，NovaWay 技能运行时 ID 为 `office-suite_ppt-workflow`；Anthropic 官方技能目录同时保留各自的 `LICENSE.txt` 和必要脚本，运行时 ID 分别为 `office-suite_anthropic-docx`、`office-suite_anthropic-pdf`、`office-suite_anthropic-pptx`、`office-suite_anthropic-xlsx`；不再存在 `com.novaway.ppt-master` 独立市场条目，也不需要单独安装。
- Creova/forge 是宿主核心模式。办公工作台只是聚焦视图；在 Manifest capability 和宿主安全边界内，Creova 可以直接发现并自主调用已安装的 Office Agent、Skill、Tool、Command 和内置 PPT Master。
- 宿主已移除内置办公 Agent/Skill 注册与回退；办公场景仅路由到已激活的插件贡献，未安装时提示安装而非降级。真实模型生成 Office 文件的产物验收仍需在客户端单独进行。

每个官方插件目录都可以在 `assets/icon.svg` 提供头像，并在 catalog 条目中配置 HTTPS `icon` 地址。客户端优先加载该头像，加载失败时回退到 NovaWay 自动图标；头像只影响展示，不会改变插件权限。


`plugins/com.novaway.powersnexus` 是 NovaWay 维护的 PowersNexus（superpowers 分支）工程技能库，包含 23 个 declarative Skill（TDD、系统化调试、头脑风暴、计划与执行、代码评审、子代理协作、UI/UX 等），保留上游 MIT 许可证与署名。安装后的 Skill 使用 `powersnexus_` 命名空间。

- 构建：`npm run build:powersnexus`，生成 `dist/com.novaway.powersnexus-1.1.0.zip`。
- NovaWay 源码仓库中，从 `packages/novaway` 运行：`NOVAWAY_POWERSNEXUS_ARCHIVE=<ZIP绝对路径> bun test test/plugin/powersnexus-marketplace.test.ts`。
- 该包已从宿主内置默认种子（`DEFAULT_GLOBAL_PLUGINS` 的 Gitee git 种子）迁移为市场插件；宿主不再自动补种，需从市场安装启用。
- 构建确定性 `--stored` ZIP，将归档放入 `artifacts/` 并校验摘要与目录一致。

## 发布原则

- 已发布版本不可变；
- 生产安装优先使用 Gitee archive；
- 每个 artifact 必须有 SHA-256；
- catalog 由 CI 根据 manifest 和发布信息生成；
- 没有真实生产消费者的能力不得标记为 stable；
- 不把可变分支作为生产安装版本。
