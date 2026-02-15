import 'reflect-metadata'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { unstableSetCreateRoot } from '@flowgram.ai/form-materials'
import App from './App.tsx'
// 火山引擎品牌主题（覆盖 Semi-UI 默认 Design Token）
import '@semi-bot/semi-theme-volcano_engine/semi.css'
// 无障碍增强样式
import './styles/a11y.css'
// 项目级全局样式（滚动条、打印等）
import './styles/global.css'

// React 18/19 polyfill for FlowGram form-materials
unstableSetCreateRoot(createRoot)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
