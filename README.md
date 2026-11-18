# NovaWay Official Plugins

NovaWay 的公开官方插件市场仓库。

这个仓库负责维护：

- 版本化市场目录；
- NovaWay 官方插件；
- 插件 manifest 和 schema；
- 可控 fixture 与兼容性测试；
- GitHub Release 制品和 SHA-256；
- 目录生成与发布工作流。

NovaWay 客户端从本仓库读取 `catalog/index.json`，根据目录中的 artifact 信息下载并校验插件，然后交给对应的 Plugin Runtime 安装和激活。

## 开发文档

- [完整工作台插件开发指南](docs/workbench-plugin-development-guide.md)：从产品设计、Manifest、Agent、Skill、Tool、Command、MCP、UI、权限、本地调试、动态模式验收到市场发布的完整流程。
- [通用插件开发与 NovaWay 对接指南](docs/plugin-development-and-novaway-integration.md)：Manifest v2、贡献类型、运行时、市场目录和公共 artifact 验收。

工作台不是宿主里静态写死的模式。插件需要在 Primary Agent 的 `options` 中声明 `modeGroup` 和 `workbench` 元数据；安装并激活后，NovaWay 会实时将它加入左上角工作模式切换器，停用或卸载后自动移除。


官方 stable 目录当前包含两个可安装版本线：

- `com.novaway.marketplace-smoke@0.1.1`：真实 Skill 安装、激活和消费 fixture；
- `com.novaway.marketplace-capability-smoke@0.1.0`：真实 Agent、Skill、Tool 和 Command 安装、激活、注册、消费与停用 fixture。

第二个 fixture 的公开 Release 已通过 NovaWay 的 `Marketplace.installZip`、SHA-256、Plugin Host v2 discovery/activation 和真实消费者验收后才进入 stable。仅解析目录或成功下载不构成可用性证明。

插件贡献必须遵守 NovaWay v2 manifest 契约：Agent 使用对象声明并提供 inline 或包内 prompt 文件，Skill 使用 `SKILL.md`，Tool 提供带静态 schema 的安全 entry，Command 提供可消费的模板声明。

## 目录入口

- Schema：`catalog/schema/`
- 稳定频道：`catalog/channels/stable.json`
- 生成后的入口：`catalog/index.json`
- 首方插件：`plugins/<package-id>/`
- 测试 fixture：`fixtures/`

## 分类与本地办公包

`catalog/taxonomy.json` 分开维护能力类型（Skill、Agent、Tool、MCP 等）、市场展示类型（工作台、智能体、技能、MCP 连接器、工具、桌面 UI 等）和用途（办公、开发、数据等）。一个插件可以有多种能力和展示类型；能力从真实 `contributes` 生成，市场展示类型用于帮助用户筛选，不按名称猜测。

`catalog/local.json` 是本地源码包索引，不是可添加到客户端的远程安装源；它没有伪造未发布的 Release URL。运行 `node scripts/index-local.mjs` 更新，运行 `npm run validate` 校验源码引用及 stable 目录。

`plugins/com.novaway.office-suite` 是独立办公助手包，包含 9 个 Agent、9 个 Skill、Presenton 参考资源及原许可证。安装后的 ID 使用 `office-suite_` 命名空间，Agent 提示词、默认 Skill 与权限引用均指向插件贡献，避免测试误用内置同名能力。

- 构建：`npm run build:office`，生成 `dist/com.novaway.office-suite-0.1.1.zip`。
- NovaWay 源码仓库中，从 `packages/novaway` 运行：`NOVAWAY_OFFICE_PLUGIN_ARCHIVE=<ZIP绝对路径> bun test test/plugin/office-marketplace.test.ts`。
- 测试使用真实 ZIP、安装器、发现/激活、Agent/Skill 服务与 Skill 工具；仅下载传输被替换为本地字节，不访问远程 artifact。
- 验证范围包含默认 Skill 权限、实际资源目录、停用、重新加载和卸载，不代表模型生成 Office 文件已经验收。
- 当前没有迁出 `office_document_*`、`office_pptx_*`、`office_setup`、`pdf_create` 等宿主工具，也没有内置 Office MCP 可迁移；包不声明这些贡献。
- PPT 生成统一调用 `plugins/com.novaway.ppt-master` 内的定制版本，完整 Skill ID 为 `ppt-master_ppt-master`；不再降级到自制 HTML → PPTX。两个插件需分别安装启用，安装办公助手包不会自动安装 PPT Master 或 Python 依赖。
- 自制的 9 个办公 Agent 和 9 个 Skill 保留在本仓库独立维护；PPT Master 保留本地浏览器适配、完整上游资源及许可证。PPT Master 含 13,094 个资源文件，宿主 ZIP 安装器条目上限已调整为 20,000（下载 64 MB、解压 256 MB、路径/符号链接/中央目录校验不变），资源型技能可完整安装。
- 两个包均已登记 `catalog/index.json` 与 `catalog/channels/stable.json`，通过 GitHub Release 发布不可变 artifact。打 tag `com.novaway.office-suite-v<version>` / `com.novaway.ppt-master-v<version>` 触发对应发布工作流，构建确定性 `--stored` ZIP 并校验摘要与目录一致。
- 宿主已移除内置办公 Agent/Skill 注册与回退；办公场景仅路由到已激活的插件贡献，未安装时提示安装而非降级。真实模型生成 Office 文件的产物验收仍需在客户端单独进行。

## PowersNexus 技能库

`plugins/com.novaway.powersnexus` 是 NovaWay 维护的 PowersNexus（superpowers 分支）工程技能库，包含 23 个 declarative Skill（TDD、系统化调试、头脑风暴、计划与执行、代码评审、子代理协作、UI/UX 等），保留上游 MIT 许可证与署名。安装后的 Skill 使用 `powersnexus_` 命名空间。

- 构建：`npm run build:powersnexus`，生成 `dist/com.novaway.powersnexus-1.1.0.zip`。
- NovaWay 源码仓库中，从 `packages/novaway` 运行：`NOVAWAY_POWERSNEXUS_ARCHIVE=<ZIP绝对路径> bun test test/plugin/powersnexus-marketplace.test.ts`。
- 该包已从宿主内置默认种子（`DEFAULT_GLOBAL_PLUGINS` 的 Gitee git 种子）迁移为市场插件；宿主不再自动补种，需从市场安装启用。
- 打 tag `com.novaway.powersnexus-v<version>` 触发发布工作流，构建确定性 `--stored` ZIP 并校验摘要与目录一致。

## 发布原则

- 已发布版本不可变；
- 生产安装优先使用 GitHub Release asset；
- 每个 artifact 必须有 SHA-256；
- catalog 由 CI 根据 manifest 和发布信息生成；
- 没有真实生产消费者的能力不得标记为 stable；
- 不把可变分支作为生产安装版本。
