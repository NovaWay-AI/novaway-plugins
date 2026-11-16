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

## 当前状态

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

## 发布原则

- 已发布版本不可变；
- 生产安装优先使用 GitHub Release asset；
- 每个 artifact 必须有 SHA-256；
- catalog 由 CI 根据 manifest 和发布信息生成；
- 没有真实生产消费者的能力不得标记为 stable；
- 不把可变分支作为生产安装版本。
