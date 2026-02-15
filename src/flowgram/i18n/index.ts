/**
 * Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 */

export type Locale = 'zh-CN' | 'en-US';

export interface I18nMessages {
  // 工具栏
  fitView: string;
  minimap: string;
  readonly: string;
  editable: string;
  comment: string;
  annotation: string;
  download: string;
  problem: string;
  ungroup: string;
  autoLayout: string;
  switchLine: string;
  zoomIn: string;
  zoomOut: string;
  zoomTo: string;
  mouseMode: string;
  touchpadMode: string;
  undo: string;
  redo: string;
  addNode: string;
  testRun: string;
  trialRun: string;
  cancel: string;

  // 保存状态
  saving: string;
  saved: string;
  autoSaved: string;
  saveError: string;
  manualSave: string;

  // 节点菜单
  editTitle: string;
  moveOutOfContainer: string;
  createCopy: string;
  delete: string;
  collapse: string;
  expand: string;
  createGroup: string;
  group: string;

  // 表单
  title: string;
  titleRequired: string;
  api: string;
  inputUrlUseVar: string;
  headers: string;
  params: string;
  body: string;
  bodyType: string;
  timeout: string;
  retryTimes: string;
  none: string;
  json: string;
  rawText: string;
  inputRawTextUseVar: string;
  inputs: string;
  outputs: string;
  branch: string;
  data: string;
  inputsResult: string;
  outputsResult: string;
  running: string;
  inputForm: string;
  jsonMode: string;
  select: string;
  empty: string;
  noInputsFound: string;
  pleaseInputInteger: string;
  pleaseInputNumber: string;
  pleaseInputText: string;
  add: string;
  if: string;
  else: string;
  script: string;
  loopFor: string;
  loopOutputs: string;
  topK: string;
  method: string;
  knowledgeBaseSelect: string;
  mcpServiceSelect: string;
  workflowAppSelect: string;
  selectKnowledgeBase: string;
  selectMcpService: string;
  selectMethod: string;
  selectWorkflowApp: string;
  inputQueryUseVar: string;
  inputParamsUseVar: string;
  inputAppParamsUseVar: string;
  inputTopK: string;
  inputTimeout: string;
  query: string;
  queryRequired: string;
  knowledgeBaseRequired: string;
  mcpServiceRequired: string;
  methodRequired: string;
  workflowAppRequired: string;
  timeoutRequired: string;

  // 节点名称和描述
  start: string;
  startDesc: string;
  end: string;
  endDesc: string;
  http: string;
  httpDesc: string;
  condition: string;
  conditionDesc: string;
  loop: string;
  loopDesc: string;
  code: string;
  codeDesc: string;
  variable: string;
  variableDesc: string;
  llm: string;
  llmDesc: string;
  comment: string;
  knowledgeBase: string;
  knowledgeBaseDesc: string;
  mcpService: string;
  mcpServiceDesc: string;
  workflowApp: string;
  workflowAppDesc: string;

  // 语言切换
  language: string;
  switchToEnglish: string;
  switchToChinese: string;

  // 验证信息
  conditionRequired: string;
  downloadSuccess: string;

  // 顶部栏
  workflowApp: string;
  publish: string;
  publishSuccess: string;
  history: string;
  historyComingSoon: string;
  export: string;
  exportSuccess: string;
  createCopy: string;
  copySuccess: string;
  copyComingSoon: string;

  // 工作流编辑
  untitledWorkflow: string;
  workflow: string;
  editWorkflowInfo: string;
  icon: string;
  uploadIcon: string;
  name: string;
  nameRequired: string;
  enterName: string;
  description: string;
  enterDescription: string;
  save: string;
  updateSuccess: string;
  justNow: string;
  minutesAgo: string;
  saveFailed: string;
  versionHistory: string;
  noVersions: string;
  versionRestoreComingSoon: string;
  published: string;
}

const zhCN: I18nMessages = {
  // 工具栏
  fitView: '适应视图',
  minimap: '小地图',
  readonly: '只读',
  editable: '可编辑',
  comment: '添加备注',
  annotation: '注释',
  download: '下载',
  problem: '问题',
  ungroup: '取消分组',
  autoLayout: '自动布局',
  switchLine: '切换连线',
  zoomIn: '放大',
  zoomOut: '缩小',
  zoomTo: '缩放到',
  mouseMode: '鼠标模式',
  touchpadMode: '触控板模式',
  current: '当前',
  undo: '撤销',
  redo: '重做',
  addNode: '添加节点',
  testRun: '运行测试',
  trialRun: '试运行',
  cancel: '取消',

  // 保存状态
  saving: '保存中...',
  saved: '已保存',
  autoSaved: '已自动保存',
  saveError: '保存失败',
  manualSave: '保存',

  // 节点菜单
  editTitle: '编辑标题',
  moveOutOfContainer: '移出容器',
  createCopy: '创建副本',
  delete: '删除',
  collapse: '折叠',
  expand: '展开',
  createGroup: '创建分组',
  group: '分组',

  // 表单
  title: '标题',
  titleRequired: '标题为必填项',
  api: 'API',
  inputUrlUseVar: '输入 URL，使用变量通过 {',
  headers: '请求头',
  params: '参数',
  body: '请求体',
  bodyType: 'Body 类型',
  timeout: '超时时间(毫秒)',
  retryTimes: '重试次数',
  none: '无',
  json: 'JSON',
  rawText: '纯文本',
  inputRawTextUseVar: '输入原始文本，使用变量通过 {',
  inputs: '输入',
  outputs: '输出',
  branch: '分支',
  data: '数据',
  inputsResult: '输入结果',
  outputsResult: '输出结果',
  running: '运行中...',
  inputForm: '输入表单',
  jsonMode: 'JSON 模式',
  select: '选择',
  empty: '空',
  noInputsFound: '开始节点中未找到输入',
  pleaseInputInteger: '请输入整数',
  pleaseInputNumber: '请输入数字',
  pleaseInputText: '请输入文本',
  add: '添加',
  if: '如果',
  else: '否则',
  script: '脚本',
  loopFor: '循环',
  loopOutputs: '循环输出',
  topK: '返回数量',
  method: '调用方法',
  knowledgeBaseSelect: '选择知识库',
  mcpServiceSelect: '选择 MCP 服务',
  workflowAppSelect: '选择工作流应用',
  selectKnowledgeBase: '请选择知识库',
  selectMcpService: '请选择 MCP 服务',
  selectMethod: '请选择调用方法',
  selectWorkflowApp: '请选择工作流应用',
  inputQueryUseVar: '输入查询内容，使用变量通过 {',
  inputParamsUseVar: '输入方法参数（JSON格式），使用变量通过 {',
  inputAppParamsUseVar: '输入应用参数（JSON格式），使用变量通过 {',
  inputTopK: '请输入返回数量',
  inputTimeout: '请输入超时时间（毫秒）',
  query: '查询内容',
  queryRequired: '查询内容为必填项',
  knowledgeBaseRequired: '请选择知识库',
  mcpServiceRequired: '请选择 MCP 服务',
  methodRequired: '请选择调用方法',
  workflowAppRequired: '请选择工作流应用',
  timeoutRequired: '超时时间为必填项',

  // 节点名称和描述
  start: '开始',
  startDesc: '工作流的起始节点，用于设置启动工作流所需的信息。',
  end: '结束',
  endDesc: '工作流的最终节点，用于返回工作流运行后的结果信息。',
  http: 'HTTP 请求',
  httpDesc: '调用 HTTP API 接口，发送请求并获取响应数据。',
  condition: '条件分支',
  conditionDesc: '连接多个下游分支，只有满足设定的条件时才会执行对应的分支。',
  loop: '循环',
  loopDesc: '用于重复执行一系列任务，通过设置迭代次数和逻辑来控制。',
  code: '代码',
  codeDesc: '运行自定义脚本代码，支持 JavaScript 语法。',
  variable: '变量',
  variableDesc: '变量赋值和声明，用于定义和更新工作流中的变量。',
  llm: '大模型',
  llmDesc: '调用大语言模型，使用变量和提示词生成响应。',
  comment: '备注',
  knowledgeBase: '知识库',
  knowledgeBaseDesc: '从知识库中检索相关信息，支持向量搜索和语义匹配。',
  mcpService: 'MCP 服务',
  mcpServiceDesc: '调用 MCP (Model Context Protocol) 服务，扩展系统能力。',
  workflowApp: '工作流应用',
  workflowAppDesc: '调用已创建的工作流应用，实现工作流嵌套和复用。',

  // 语言切换
  language: '语言',
  switchToEnglish: 'Switch to English',
  switchToChinese: '切换到中文',

  // 验证信息
  conditionRequired: '条件为必填项',
  downloadSuccess: '下载 {{label}} 成功',

  // 顶部栏
  workflowApp: '工作流应用',
  publish: '发布',
  publishSuccess: '发布成功',
  history: '历史',
  historyComingSoon: '历史版本功能即将推出',
  export: '导出',
  exportSuccess: '导出成功',
  createCopy: '创建副本',
  copySuccess: '副本创建成功',
  copyComingSoon: '创建副本功能即将推出',

  // 工作流编辑
  untitledWorkflow: '未命名工作流',
  workflow: '工作流',
  editWorkflowInfo: '编辑工作流信息',
  icon: '图标',
  uploadIcon: '上传图标',
  name: '名称',
  nameRequired: '请输入名称',
  enterName: '请输入名称',
  description: '描述',
  enterDescription: '请输入描述',
  save: '保存',
  updateSuccess: '更新成功',
  justNow: '刚刚保存',
  minutesAgo: '分钟前保存',
  saveFailed: '保存失败',
  versionHistory: '历史版本',
  noVersions: '暂无历史版本',
  versionRestoreComingSoon: '版本恢复功能即将推出',
  published: '已发布',
};

const enUS: I18nMessages = {
  // 工具栏
  fitView: 'FitView',
  minimap: 'Minimap',
  readonly: 'Readonly',
  editable: 'Editable',
  comment: 'Comment',
  annotation: 'Annotation',
  download: 'Download',
  problem: 'Problem',
  ungroup: 'Ungroup',
  autoLayout: 'Auto Layout',
  switchLine: 'Switch Line',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  zoomTo: 'Zoom to',
  mouseMode: 'Mouse-Friendly',
  touchpadMode: 'Touchpad-Friendly',
  current: 'Current',
  undo: 'Undo',
  redo: 'Redo',
  addNode: 'Add Node',
  testRun: 'Test Run',
  trialRun: 'Trial Run',
  cancel: 'Cancel',

  // 保存状态
  saving: 'Saving...',
  saved: 'Saved',
  autoSaved: 'Auto-saved',
  saveError: 'Save Failed',
  manualSave: 'Save',

  // 节点菜单
  editTitle: 'Edit Title',
  moveOutOfContainer: 'Move out of container',
  createCopy: 'Create Copy',
  delete: 'Delete',
  collapse: 'Collapse',
  expand: 'Expand',
  createGroup: 'Create Group',
  group: 'Group',

  // 表单
  title: 'Title',
  titleRequired: 'Title is required',
  api: 'API',
  inputUrlUseVar: "Input URL, use var by '{'",
  headers: 'Headers',
  params: 'Params',
  body: 'Body',
  bodyType: 'Body Type',
  timeout: 'Timeout(ms)',
  retryTimes: 'Retry Times',
  none: 'None',
  json: 'JSON',
  rawText: 'Raw Text',
  inputRawTextUseVar: "Input raw text, use var by '{'",
  inputs: 'Inputs',
  outputs: 'Outputs',
  branch: 'Branch',
  data: 'Data',
  inputsResult: 'Inputs Result',
  outputsResult: 'Outputs Result',
  running: 'Running...',
  inputForm: 'Input Form',
  jsonMode: 'JSON Mode',
  select: 'Select',
  empty: 'Empty',
  noInputsFound: 'No inputs found in start node',
  pleaseInputInteger: 'Please input integer',
  pleaseInputNumber: 'Please input number',
  pleaseInputText: 'Please input text',
  add: 'Add',
  if: 'if',
  else: 'else',
  script: 'Script',
  loopFor: 'Loop For',
  loopOutputs: 'Loop Outputs',
  topK: 'Top K',
  method: 'Method',
  knowledgeBaseSelect: 'Select Knowledge Base',
  mcpServiceSelect: 'Select MCP Service',
  workflowAppSelect: 'Select Workflow App',
  selectKnowledgeBase: 'Please select knowledge base',
  selectMcpService: 'Please select MCP service',
  selectMethod: 'Please select method',
  selectWorkflowApp: 'Please select workflow app',
  inputQueryUseVar: 'Input query, use var by {',
  inputParamsUseVar: 'Input method params (JSON), use var by {',
  inputAppParamsUseVar: 'Input app params (JSON), use var by {',
  inputTopK: 'Please input return count',
  inputTimeout: 'Please input timeout (ms)',
  query: 'Query',
  queryRequired: 'Query is required',
  knowledgeBaseRequired: 'Knowledge base is required',
  mcpServiceRequired: 'MCP service is required',
  methodRequired: 'Method is required',
  workflowAppRequired: 'Workflow app is required',
  timeoutRequired: 'Timeout is required',

  // 节点名称和描述
  start: 'Start',
  startDesc: 'The starting node of the workflow, used to set the information needed to initiate the workflow.',
  end: 'End',
  endDesc: 'The final node of the workflow, used to return the result information after the workflow is run.',
  http: 'HTTP',
  httpDesc: 'Call the HTTP API',
  condition: 'Condition',
  conditionDesc: 'Connect multiple downstream branches. Only the corresponding branch will be executed if the set conditions are met.',
  loop: 'Loop',
  loopDesc: 'Used to repeatedly execute a series of tasks by setting the number of iterations and logic.',
  code: 'Code',
  codeDesc: 'Run the Script',
  variable: 'Variable',
  variableDesc: 'Variable Assign and Declaration',
  llm: 'LLM',
  llmDesc: 'Call the large language model and use variables and prompt words to generate responses.',
  comment: 'Comment',
  knowledgeBase: 'Knowledge Base',
  knowledgeBaseDesc: 'Retrieve relevant information from knowledge base, supports vector search and semantic matching.',
  mcpService: 'MCP Service',
  mcpServiceDesc: 'Call MCP (Model Context Protocol) service to extend system capabilities.',
  workflowApp: 'Workflow App',
  workflowAppDesc: 'Call an existing workflow app to enable workflow nesting and reuse.',

  // 语言切换
  language: 'Language',
  switchToEnglish: 'Switch to English',
  switchToChinese: '切换到中文',

  // 验证信息
  conditionRequired: 'Condition is required',
  downloadSuccess: 'Download {{label}} successfully',

  // 顶部栏
  workflowApp: 'Workflow App',
  publish: 'Publish',
  publishSuccess: 'Published successfully',
  history: 'History',
  historyComingSoon: 'History versions coming soon',
  export: 'Export',
  exportSuccess: 'Exported successfully',
  createCopy: 'Create Copy',
  copySuccess: 'Copy created successfully',
  copyComingSoon: 'Create copy feature coming soon',

  // 工作流编辑
  untitledWorkflow: 'Untitled Workflow',
  workflow: 'Workflow',
  editWorkflowInfo: 'Edit Workflow Info',
  icon: 'Icon',
  uploadIcon: 'Upload Icon',
  name: 'Name',
  nameRequired: 'Name is required',
  enterName: 'Enter name',
  description: 'Description',
  enterDescription: 'Enter description',
  save: 'Save',
  updateSuccess: 'Updated successfully',
  justNow: 'Just saved',
  minutesAgo: 'minutes ago',
  saveFailed: 'Save failed',
  versionHistory: 'Version History',
  noVersions: 'No versions yet',
  versionRestoreComingSoon: 'Version restore coming soon',
  published: 'Published',
};

const messages: Record<Locale, I18nMessages> = {
  'zh-CN': zhCN,
  'en-US': enUS,
};

type LocaleChangeListener = (locale: Locale) => void;

const listeners: Set<LocaleChangeListener> = new Set();

let currentLocale: Locale = (localStorage.getItem('flowgram-locale') as Locale) || 'zh-CN';

export const i18n = {
  get locale(): Locale {
    return currentLocale;
  },
  set locale(value: Locale) {
    if (currentLocale !== value) {
      currentLocale = value;
      localStorage.setItem('flowgram-locale', value);
      // 通知所有监听器语言已更改
      listeners.forEach((listener) => listener(value));
    }
  },
  // 切换语言
  toggle() {
    this.locale = this.locale === 'zh-CN' ? 'en-US' : 'zh-CN';
  },
  // 监听语言变化
  onChange(listener: LocaleChangeListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  t(key: keyof I18nMessages, params?: Record<string, string>): string {
    let message = messages[currentLocale][key] || messages['zh-CN'][key] || key;
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        message = message.replace(`{{${paramKey}}}`, paramValue);
      });
    }
    return message;
  },
};

export default i18n;
