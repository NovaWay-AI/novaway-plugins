---
name: office-ppt
description: Generate, revise and review editable presentations from documents, data and reference templates using the NovaWay-maintained PPT Master plugin.
---

# 办公演示助手

整理提案、汇报、培训、商业计划、产品介绍与课程需求；将 PPT 制作交给 NovaWay 定制的 PPT Master，不另建渲染流程。

## 执行

1. 确认受众、目标、资料、页数、交付格式以及用户是否提供模板。区分事实、推断与待确认数据。
2. 核对可用技能中存在 `ppt-master_ppt-master`，通过 skill 工具按此完整名称加载。它来自 `com.novaway.ppt-master`，不是宿主另行安装的上游同名 `ppt-master`。
3. 未安装或被禁用时，说明需要安装或启用定制 PPT Master；未经授权不要安装插件。只可交付明确标记“未导出 PPTX”的页级草稿，不切换到自制 HTML → PPTX 或宿主 `novaway office-ppt` 链路。
4. 按 PPT Master 返回的绝对资源目录、路由、确认节点与质量门执行。需要 Python 时使用宿主提供的隔离解释器和依赖准备流程，不猜测源码路径或修改系统 Python。
5. 让 PPT Master 决定生成、重建、美化、创建模板或原生编辑的具体流程；不要提前生成另一条路线的 HTML、SVG 或中间文件。保留其许可证和署名检查，不绕过失败检查。
6. 默认将最终演示放在 `.novaway/office/ppt/`，工作文件放在 `.novaway/office/ppt-work/<deck-slug>/`。遵循用户指定的输出路径；不要覆盖未获授权的原稿。
7. 检查实际产物的页数、文字溢出、遮挡、可编辑对象与演讲备注；只有真实导出并完成相应检查后才交付 PPTX 路径。依赖、权限或脚本失败时如实报告，不伪造通过状态。

## 可选设计参考

仅在需要设计参考时读取本 Skill 目录的 `templates/presenton/catalog.json`，再读取选中家族的 `template.json`。包含 dynamic、editorial、executive、general、modern、momentum、standard、swift 八个家族。

这些 JSON 只提供配色、字体、留白与构图参考，不是原生 PPTX 模板，也不替代 PPT Master 的模板流程。用户的真实模板与品牌约束优先。所有资源路径相对于本 Skill 的基础目录；保留 `licenses/` 及模板来源署名。

## 交付

以 `# 办公产物` 开头，简要报告真实文件路径、页数、检查结果与未解决项。最终文件与 SVG、草稿、备份等过程资源分开，只为最终交付文件输出产物引用。

只交付草稿时使用 `## 第 N 页：标题`，包含布局、视觉、主文案与演讲备注，并明确写出“未导出 PPTX”。偏好与记忆仅提出建议，不能作为已确认事实。
