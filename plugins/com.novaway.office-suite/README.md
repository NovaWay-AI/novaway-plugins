# NovaWay 办公工作台

这是一个完整的 NovaWay 工作台插件。安装并激活 `com.novaway.office-suite` 后，左上角会实时出现“办公”工作台；无需重启即可使用办公 Agent、Skill、Tool、Command 和内置 PPT Master 能力。

## 内置能力

- 9 个办公 Primary Agent：文档整理、PPT 生成、表格分析、视觉设计、网页看板、AI 会议、AI 资料库、AI 任务、AI 沟通；
- 9 个办公 Skill；
- `ppt-master`：PPT Master 原生可编辑 PPTX 生成、重建、美化、模板和编辑资源；
- `workbench-status`：验证工作台贡献已经被实时注册；
- `office-workbench-check`：验证命令；
- 动态工作台元数据：`office` 分组、办公图标、颜色和中文产品名称。

PPT Master 的上游资源、许可证和来源信息保存在本插件的 `skills/ppt-master/`、`skills/ppt-master/LICENSE`、`skills/ppt-master/SPONSORS*.md`、`ppt-master-upstream.json` 中。PPT Master 不再是单独的市场插件，也不需要另行安装。运行时 ID 为 `office-suite_ppt-master`。

## Creova 使用方式

Creova/forge 是 NovaWay 的宿主核心模式。办公工作台只是聚焦办公场景的产品化视图，不是能力权限边界。安装并激活本插件后，Creova 可以在遵守插件 Manifest capability gate、文件/网络/进程安全和 secrets 保护的前提下，自主发现并调用本插件的办公 Agent、Skill、Tool、Command 以及内置 PPT Master。用户不需要先切换到“办公”模式。

## 验收

1. 安装前模式切换器只有 Creova；
2. 安装并激活后，模式切换器实时出现“办公”；
3. Creova 和办公模式都能看到对应的办公 Agent；
4. `office-suite_ppt-master` 可以直接加载，且不存在单独 `com.novaway.ppt-master` 市场包；
5. `workbench-status` 和 `office-workbench-check` 可被真实消费者调用；
6. 停用或卸载 Office Suite 后，办公模式、办公 Agent、办公 Skill、Tool、Command 和 PPT Master 同时实时消失，当前模式回退到 Creova。

## 构建

```bash
npm run build:office
```

构建产物是 `dist/com.novaway.office-suite-0.2.1.zip`。
