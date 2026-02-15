# 研究发现：Semi-UI 迁移分析

**最后更新**: 2025-02-10

---

## 当前项目状态

### 依赖情况

```json
{
  "@douyinfe/semi-icons": "^2.80.0",  // 已安装
  "@douyinfe/semi-ui": "^2.80.0",     // 已安装
  "antd": "^6.2.3",                    // 需要移除
  "@ant-design/icons": "^6.1.0",       // 需要移除
  "react": "^18"                       // React 18（可继续使用 semi-ui）
}
```

### 关键发现

1. **React 版本**: 当前使用 React 18，可使用 `@douyinfe/semi-ui`（React 19 版本仅在升级到 React 19 时需要）

2. **Semi-UI 已部分使用**: FlowGram 组件已经在使用 Semi-UI

3. **Ant Design 使用情况**:
   - SharePage.tsx: 大量使用 `antd` 组件
   - 其他页面需要进一步检查

---

## Semi-UI AI 组件分析

### 1. Sidebar 侧边信息栏

**文档**: https://semi.design/zh-CN/ai/sidebar

**核心能力**:
- `Container`: 基础容器，支持宽度可伸缩
- `MCPConfigure`: MCP 工具的展示、启用/关闭、配置
- `Annotation`: 参考来源管理
- `CodeItem` / `CodeContent`: 代码预览
- `FileItem` / `FileContent`: 富文本编辑/预览

**适用场景**:
- 替代当前的 MCP 新建弹窗
- 替代模型配置侧边栏
- 替代知识库管理界面
- 替代应用配置界面

### 2. AIChatInput 聊天输入框

**文档**: https://semi.design/zh-CN/ai/aiChatInput

**核心能力**:
- 基于 tiptap 的富文本输入
- 文件上传支持
- 引用内容展示
- 配置区域（模型选择、联网搜索、MCP 工具等）
- 建议列表
- 技能及模版支持
- 消息发送/停止生成

**适用场景**:
- SharePage 的输入框完全可用此组件替代

### 3. AIChatDialogue AI对话

**文档**: https://semi.design/zh-CN/ai/aiChatDialogue

**核心能力**:
- 对话消息展示
- 用户/AI 消息区分
- 消息操作（复制、反馈等）
- 流式输出支持

**适用场景**:
- SharePage 的对话区域可用此组件优化

---

## 无障碍支持分析

**文档**: https://semi.design/zh-CN/experience/accessibility

### A11y 主题特性

1. **高对比度**: 增加了基础色盘各个颜色的对比度
2. **大字体**: 加大了字体 token 的字号
3. **键盘导航**: 完整的键盘快捷键支持
4. **焦点管理**: 清晰的焦点状态

### 对于 SharePage 的价值

SharePage 是面向居民百姓的分享页面，无障碍支持非常重要：
- 老年用户可能需要更高的对比度
- 键盘导航方便不使用鼠标的用户
- 屏幕阅读器支持方便视障用户

---

## 组件迁移映射表

| Ant Design 组件 | Semi-UI 替代 | 迁移复杂度 |
|----------------|-------------|-----------|
| Button | Button | 低 |
| Input / TextArea | Input / TextArea | 低 |
| Modal | Modal | 中 |
| Drawer | SideSheet | 中 |
| message | Toast | 低 |
| Space | Space | 低 |
| Image | Image | 低 |
| @ant-design/icons | @douyinfe/semi-icons | 中（图标名称不同） |

---

## SharePage.tsx 当前分析

### 使用的 Ant Design 组件

```tsx
import { Input, Button, message, Drawer, Space, Modal, Image } from 'antd';
import {
  SendOutlined, CopyOutlined, LikeOutlined, DislikeOutlined,
  CloseOutlined, PlusOutlined, MessageOutlined, DeleteOutlined,
  AudioOutlined, AudioMutedOutlined, MenuOutlined, LeftOutlined,
  RightOutlined, ZoomInOutlined, ZoomOutOutlined,
} from '@ant-design/icons';
```

### 迁移计划

1. **输入区域**: 使用 `AIChatInput` 替代
   - 支持 TextArea → AIChatInput 内置
   - 语音输入按钮 → AIChatInput 扩展
   - 发送按钮 → AIChatInput 内置

2. **对话展示**: 使用 `AIChatDialogue` 或保留 Markdown 渲染
   - 消息气泡样式适配 Semi-UI

3. **反馈 Drawer**: 使用 `SideSheet` 替代

4. **图片预览 Modal**: 使用 `Modal` 或 `ImageView` 替代

5. **侧边栏**: 可考虑使用 `Sidebar.Container`

---

## 待解决问题

1. [ ] 确认是否需要 React 19 升级
2. [ ] 确认无障碍主题的应用范围（仅 SharePage 还是全局）
3. [ ] FlowGram 内部的 Ant Design 依赖检查
4. [ ] 自定义图标的迁移方案

---

## 技术债务

1. SharePage.tsx 文件过大（1500+ 行），迁移时可考虑拆分
2. 流式消息处理的逻辑较复杂，需确保迁移后功能正常
3. 图片预览功能可考虑使用 Semi-UI ImageView 组件简化
