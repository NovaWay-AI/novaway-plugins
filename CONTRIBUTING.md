# Contributing

## Plugin requirements

每个插件必须提供：

- `plugin.json`；
- README 和许可证；
- 明确的 runtime 和 API 兼容范围；
- contribution 和权限声明；
- 可复现的构建或打包方式；
- 安装、启用、停用和真实消费者测试；
- 版本化的 GitHub Release artifact。

目录中的条目不是手工广告位。插件只有通过 schema、权限、安全和消费者覆盖检查后，才能进入 stable 频道。

## Versioning

已发布版本不可覆盖。修复或权限变化必须使用新的版本号和新的 Release artifact。
