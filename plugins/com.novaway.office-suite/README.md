# NovaWay 办公工作台

这是一个完整的 NovaWay 工作台插件。安装并激活 `com.novaway.office-suite` 后，左上角会实时出现“办公”工作台；无需重启即可使用办公 Agent、Skill、Tool、Command 和内置 PPT Master 能力。

## 内置能力

- 9 个办公 Primary Agent：文档整理、PPT 生成、表格分析、视觉设计、网页看板、AI 会议、AI 资料库、AI 任务、AI 沟通；
- 14 个 Office Skill：9 个办公 Skill、PPT Workflow（上游 PPT Master），以及 Anthropic 官方 DOCX/PDF/PPTX/XLSX 技能；
- `ppt-workflow`：PPT Master 原生可编辑 PPTX 生成、重建、美化、模板和编辑资源；
- `workbench-status`：验证工作台贡献已经被实时注册；
- `office-workbench-check`：验证命令；
- 动态工作台元数据：`office` 分组、办公图标、颜色和中文产品名称。

PPT Master 的上游资源、许可证和来源信息保存在本插件的 `skills/ppt-workflow/`、`skills/ppt-workflow/LICENSE`、`skills/ppt-workflow/SPONSORS*.md`、`ppt-master-upstream.json` 中。PPT Master 不再是单独的市场插件，也不需要另行安装。运行时 ID 为 `office-suite_ppt-workflow`。

## Creova 使用方式

Creova/forge 是 NovaWay 的宿主核心模式。办公工作台只是聚焦办公场景的产品化视图，不是能力权限边界。安装并激活本插件后，Creova 可以在遵守插件 Manifest capability gate、文件/网络/进程安全和 secrets 保护的前提下，自主发现并调用本插件的办公 Agent、Skill、Tool、Command 以及内置 PPT Master。用户不需要先切换到“办公”模式。

## 验收

1. 安装前模式切换器只有 Creova；
2. 安装并激活后，模式切换器实时出现“办公”；
3. Creova 和办公模式都能看到对应的办公 Agent；
4. `office-suite_ppt-workflow` 可以直接加载，且不存在单独 `com.novaway.ppt-master` 市场包；
5. `workbench-status` 和 `office-workbench-check` 可被真实消费者调用；
6. 停用或卸载 Office Suite 后，办公模式、办公 Agent、办公 Skill、Tool、Command 和 PPT Master 同时实时消失，当前模式回退到 Creova。

## 构建

```bash
npm run build:office
```

构建产物是 `dist/com.novaway.office-suite-0.3.1.zip`。

## Anthropic 官方办公技能

0.3.1 起，Office Suite 集成了 `anthropic-docx`、`anthropic-pdf`、`anthropic-pptx` 和 `anthropic-xlsx` 四个官方 Agent Skill，来源为 `anthropics/skills`。它们补充文件格式、解析、编辑、公式、渲染和交付检查规范；办公 Agent 仍负责业务目标、内容结构和路由，PPT 最终生成仍由内置 `ppt-workflow` 执行。

每个技能目录保留上游 `LICENSE.txt` 及必要脚本。官方技能可能依赖 Python 包、Node 包、LibreOffice、Poppler 或系统命令；NovaWay 不会在未授权时自动联网安装依赖，也不会默认把用户文档上传到第三方服务。依赖不可用时，Agent 必须说明限制，不得伪造文件已经生成或校验通过。

新增技能：

- `office-suite_anthropic-docx`：DOCX 创建、读取、XML 编辑、批注、修订和验证；
- `office-suite_anthropic-pdf`：PDF 文本/表格抽取、生成、表单、合并、拆分和 OCR 指南；
- `office-suite_anthropic-pptx`：PPTX 结构化生成、模板编辑、文字提取、缩略图和质量检查；
- `office-suite_anthropic-xlsx`：XLSX 数据清洗、公式、格式、图表和 LibreOffice 重算。

这些技能属于 Office Suite 内置贡献，不需要安装独立 Anthropic 插件。
