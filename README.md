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

仓库刚刚建立，当前先提交市场目录协议和仓库骨架。插件发布必须通过 manifest 校验、安装测试和真实消费者测试后才能进入 `stable` 目录。

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
