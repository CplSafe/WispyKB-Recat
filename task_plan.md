# 任务规划：用 Semi-UI 全面重构前端 UI

**项目**: frontend-vite
**创建时间**: 2025-02-10
**目标**: 使用 Semi-UI 全面替换 Ant Design，升级 UI 组件库

---

## 项目背景

我们已经成功接入了 Semi-UI 的 MCP 和 Skills。Semi Design 是字节跳动的企业级 UI 组件库，具有以下优势：

1. **React 19 原生支持** - `@douyinfe/semi-ui-19` 专门适配 React v19
2. **AI 组件生态** - 提供完整的 AI 场景组件（AIChatInput、AIChatDialogue、Sidebar）
3. **无障碍支持** - 专门的无障碍主题 `@semi-bot/semi-theme-a11y`
4. **现代化设计** - 设计语言更现代，适合面向居民百姓的应用

---

## 目标概述

### 核心目标
1. 完全移除 Ant Design (`antd`、`@ant-design/icons`)
2. 全面迁移到 Semi-UI (`@douyinfe/semi-ui`、`@douyinfe/semi-icons`)
3. 引入 Semi-UI AI 组件优化关键页面
4. 启用无障碍支持（针对 SharePage）

### 关键迁移场景

| 当前组件/场景 | Semi-UI 替代方案 | 优先级 |
|--------------|-----------------|--------|
| MCP/模型/知识库/应用的新建弹窗 | `Sidebar.MCPConfigure` | 高 |
| SharePage 对话输入框 | `AIChatInput` | 高 |
| SharePage 对话展示 | `AIChatDialogue` | 高 |
| 基础组件 (Button/Input/Modal等) | Semi-UI 对应组件 | 中 |
| 无障碍支持 | `@semi-bot/semi-theme-a11y` | 中 |

---

## 执行阶段

### 阶段 1：准备与环境配置 ✅
**状态**: 进行中

- [x] Semi-UI MCP 已接入
- [x] Semi-UI Skills 已创建
- [ ] 安装/确认 Semi-UI 依赖版本
- [ ] 安装 React 19 适配版本（如需要）
- [ ] 安装无障碍主题包

### 阶段 2：依赖清理与安装
**状态**: 待开始

**任务列表**:
- [ ] 卸载 `antd` 和 `@ant-design/icons`
- [ ] 确认 `@douyinfe/semi-ui` 版本
- [ ] 确认 `@douyinfe/semi-icons` 版本
- [ ] 安装 `@douyinfe/semi-ui-19`（如果使用 React 19）
- [ ] 安装 `@semi-bot/semi-theme-a11y`

### 阶段 3：核心页面迁移
**状态**: 待开始

**优先级排序**:
1. **SharePage.tsx** - 面向居民的分享页面
   - 使用 `AIChatInput` 替代当前输入框
   - 使用 `AIChatDialogue` 优化对话展示
   - 应用无障碍主题
2. **MCP/模型/知识库/应用管理页面**
   - 使用 `Sidebar.MCPConfigure` 统一新建体验
3. **DashboardPage.tsx** - 仪表盘
4. **其他页面** - 按需迁移

### 阶段 4：FlowGram 组件迁移
**状态**: 待开始

- [ ] FlowGram 内部的 Semi-UI 组件已有基础
- [ ] 统一使用 Semi-UI 图标
- [ ] 移除可能存在的 antd 依赖

### 阶段 5：样式主题定制
**状态**: 待开始

- [ ] 配置 Semi-UI Design Token
- [ ] 应用无障碍主题到 SharePage
- [ ] 确保品牌色一致性
- [ ] **项目整体主题根据 Semi-UI 重构**
  - [ ] 使用 Semi-UI 主题系统替换现有主题
  - [ ] 配置全局 Design Token
  - [ ] 统一颜色、字体、间距等设计规范
  - [ ] 应用到所有页面和组件

### 阶段 6：测试与验证
**状态**: 待开始

- [ ] 功能回归测试
- [ ] 无障碍功能测试
- [ ] React 19 兼容性测试
- [ ] 性能对比

---

## 关键决策记录

| 决策点 | 选择 | 理由 |
|--------|------|------|
| UI 框架 | Semi-UI | 字节生态，AI 组件完善，React 19 支持 |
| 主题方案 | A11y 主题 | 面向居民百姓，无障碍是刚需 |
| 输入框 | AIChatInput | 专为 AI 对话场景设计 |
| 侧边栏 | Sidebar.MCPConfigure | 统一 MCP/模型/知识库/应用配置体验 |

---

## 风险与缓解

| 风险 | 影响 | 缓解方案 |
|------|------|---------|
| React 版本兼容 | 高 | 确认使用 `semi-ui-19` |
| API 差异 | 中 | 使用 Semi MCP 查询文档 |
| 样式差异 | 中 | 配合设计调整 |
| FlowGram 兼容 | 低 | FlowGram 已使用 Semi-UI |

---

## 参考资料

- [Semi-UI React 19 适配](https://semi.design/zh-CN/ecosystem/react19)
- [Sidebar 侧边信息栏](https://semi.design/zh-CN/ai/sidebar)
- [AIChatDialogue AI对话](https://semi.design/zh-CN/ai/aiChatDialogue)
- [AIChatInput 聊天输入框](https://semi.design/zh-CN/ai/aiChatInput)
- [无障碍支持](https://semi.design/zh-CN/experience/accessibility)
- WORKFLOWS.md - Semi MCP 工具使用流程
- BEST_PRACTICES.md - Semi-UI 最佳实践

---

## 下一步行动

1. 检查当前 React 版本，决定使用 `@douyinfe/semi-ui` 还是 `@douyinfe/semi-ui-19`
2. 开始迁移 SharePage.tsx，使用 `AIChatInput` 和 `AIChatDialogue`
