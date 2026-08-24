<template>
  <div class="app-container" :class="{ dark: isDark, mobile: isMobile }" :data-mobile-view="isMobile ? mobileView : null">
    <EditorHeader
      :is-dark="isDark"
      :is-mobile="isMobile"
      @copy-html="onCopyHtml"
      @copy-rich-text="onCopyRichText"
      @open-storage="showStorageModal = true"
      @open-image-host="showImageHostModal = true"
      @open-theme="showThemePanel = true"
      @toggle-dark="toggleDark"
    />

    <div class="main-content">
      <!-- 左侧边栏（移动端隐藏） -->
      <Sidebar
        v-show="!isMobile"
        :is-dark="isDark"
        :history="historyList"
        :current-id="currentArticleId"
        @new-article="onNewArticle"
        @select="onSelectArticle"
        @delete="onDeleteArticle"
        @rename="onRenameArticle"
        @open-settings="showThemePanel = true"
        @open-help="showHelpPanel = true"
      />

      <!-- 中间编辑区（移动端 editor 视图显示） -->
      <div class="editor-side" :class="{ 'mobile-hidden': isMobile && mobileView === 'preview' }">
        <div class="pane-header editor-pane-header">
          <span class="pane-dot"></span>
          <span class="pane-title">Markdown 编辑器</span>
        </div>
        <div class="toolbar-wrapper">
          <QuickToolbar
            :is-dark="isDark"
            :can-undo="canUndo"
            :can-redo="canRedo"
            @insert="onToolbarAction"
            @open-help="showHelpPanel = true"
            @undo="onUndo"
            @redo="onRedo"
          />
        </div>
        <EditorPane
          ref="editorRef"
          v-model="mdContent"
          :is-dark="isDark"
          @scroll="onEditorScroll"
          @undo="onUndo"
          @redo="onRedo"
        />
        <!-- 编辑区状态栏（移动端隐藏） -->
        <div v-show="!isMobile" class="editor-status-bar">
          <span class="status-left">
            <span class="status-item">行数: {{ lineCount }}</span>
            <span class="status-item">字数: {{ charCount }}</span>
          </span>
          <span class="status-right">
            <span class="status-item">{{ displayStatusText }}</span>
          </span>
        </div>
      </div>

      <div v-show="!isMobile" class="resize-handle" @mousedown="startResize"></div>

      <!-- 右侧预览区（移动端 preview 视图显示） -->
      <PreviewPane
        v-show="!isMobile || mobileView === 'preview'"
        ref="previewRef"
        :html="previewHtml"
        :tokens="currentTokens"
        :is-dark="isDark"
        @scroll="onPreviewScroll"
      />
    </div>

    <!-- 移动端底部工具栏 -->
    <MobileToolbar
      v-if="isMobile"
      :is-dark="isDark"
      :active-view="mobileView"
      @view-change="mobileView = $event"
      @copy-wechat="onCopyRichText"
      @copy-html="onCopyHtml"
      @open-theme="showThemePanel = true"
      @open-storage="showStorageModal = true"
      @open-image-host="showImageHostModal = true"
    />

    <!-- 主题设置面板 -->
    <div
      v-if="showThemePanel"
      class="panel-overlay"
      @click.self="showThemePanel = false"
    >
      <div class="panel-drawer">
        <div class="panel-header">
          <h3>主题设置</h3>
          <button class="close-btn" @click="showThemePanel = false">×</button>
        </div>
        <div class="panel-body">
          <ThemeSetting
            v-model="themeId"
            v-model:custom-color-enabled="customColorEnabled"
            v-model:custom-primary-color="customPrimaryColor"
            v-model:author-name="authorName"
          />
        </div>
      </div>
    </div>

    <!-- 存储模式弹窗 -->
    <StorageModal
      v-model:visible="showStorageModal"
      :is-dark="isDark"
      :current-type="storageType"
      @change="onStorageTypeChange"
      @pick-folder="onPickFolder"
    />

    <!-- 图床设置弹窗 -->
    <ImageHostModal
      v-model:visible="showImageHostModal"
      :is-dark="isDark"
      :current-type="imageHostType"
      @change="onImageHostChange"
    />

    <!-- Toast 提示 -->
    <Toast
      v-model:visible="toastVisible"
      :message="toastMessage"
      :type="toastType"
      :duration="2000"
    />

    <!-- 语法帮助面板 -->
    <div
      v-if="showHelpPanel"
      class="panel-overlay"
      @click.self="showHelpPanel = false"
    >
      <div class="panel-drawer help-drawer">
        <div class="panel-header">
          <h3>组件库</h3>
          <button class="close-btn" @click="showHelpPanel = false">×</button>
        </div>
        <div class="panel-body">
          <SyntaxHelp :theme-id="themeId" :is-dark="isDark" @insert="onHelpInsert" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import EditorHeader from './components/EditorHeader.vue'
import StorageModal from './components/StorageModal.vue'
import ImageHostModal from './components/ImageHostModal.vue'
import EditorPane from './components/EditorPane.vue'
import PreviewPane from './components/PreviewPane.vue'
import ThemeSetting from './components/ThemeSetting.vue'
import QuickToolbar from './components/QuickToolbar.vue'
import SyntaxHelp from './components/SyntaxHelp.vue'
import Sidebar from './components/Sidebar.vue'
import Toast from './components/Toast.vue'
import MobileToolbar from './components/MobileToolbar.vue'
import type { HistoryItem } from './components/Sidebar.vue'
import { useDarkMode } from './composables/useDarkMode'
import { useClipboard } from './composables/useClipboard'
import { useEditorStorage } from './composables/useEditorStorage'
import { useMobileView } from './composables/useMobileView'
import {
  gzhRender,
  getTheme,
  deriveTokens
} from './xumd-gzh-render'
import type { RenderConfig, ThemeTokens, RenderResult } from './xumd-gzh-render'

// ============================================================
// 响应式状态
// ============================================================

const { isDark, toggleDark } = useDarkMode()
const { isMobile, activeView: mobileView } = useMobileView()
const { copyHtml: copyHtmlToClipboard, copyText } = useClipboard()
const {
  articles,
  currentArticleId: storageArticleId,
  config,
  storageType,
  saveStatusText,
  scheduleSave,
  saveNow,
  saveCurrentId,
  saveConfig,
  createArticle,
  deleteArticle,
  renameArticle,
  updateCurrentContent,
  switchToFileSystem,
  switchToLocalStorage,
  init: initStorage
} = useEditorStorage()

const editorRef = ref<InstanceType<typeof EditorPane> | null>(null)
const previewRef = ref<InstanceType<typeof PreviewPane> | null>(null)
const showThemePanel = ref(false)
const showHelpPanel = ref(false)
const showStorageModal = ref(false)
const showImageHostModal = ref(false)
const imageHostType = ref('local')
const previewHtml = ref('')
const copyOutputHtml = ref('')
const currentTokens = ref<ThemeTokens>({} as ThemeTokens)
const currentArticleId = ref('default')
const storageReady = ref(false)
// 临时状态文本（复制成功提示等），优先级高于保存状态
const tempStatusText = ref('')
let tempStatusTimer: ReturnType<typeof setTimeout> | null = null

// Toast 弹窗
const toastVisible = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error' | 'info'>('success')

function showToast(message: string, type: 'success' | 'error' | 'info' = 'success'): void {
  toastMessage.value = message
  toastType.value = type
  toastVisible.value = false
  // 下一帧再显示，触发动画
  requestAnimationFrame(() => {
    toastVisible.value = true
  })
}

// 显示的状态文本：临时状态优先，否则显示保存状态
const displayStatusText = computed(() => {
  return tempStatusText.value || saveStatusText.value
})

// 设置临时状态文本，一段时间后自动清除
function showTempStatus(text: string, duration = 2000): void {
  tempStatusText.value = text
  if (tempStatusTimer) clearTimeout(tempStatusTimer)
  tempStatusTimer = setTimeout(() => {
    tempStatusText.value = ''
  }, duration)
}

// 撤销 / 重做栈（编辑区返回与撤回按钮）
const undoStack = ref<string[]>([])
const redoStack = ref<string[]>([])
const canUndo = ref(false)
const canRedo = ref(false)
// 标记：由 undo/redo 触发的赋值，不应再入栈
let isApplyingHistory = false
// 上一次"稳定"内容：作为下一次变更前的快照基准入栈，保证 undo 能回到更早状态
// 注意：mdContent 在下方才声明，这里先置空，加载文章内容后再赋值（见 loadCurrentArticleContent 后）
let lastCommitted = ''

const UNDO_LIMIT = 100

// 外部加载内容（切换/新建/删除文章）时重置历史，避免把旧内容误入撤销栈
function resetHistory(content: string): void {
  undoStack.value = []
  redoStack.value = []
  canUndo.value = false
  canRedo.value = false
  lastCommitted = content
}

function pushUndo(): void {
  // 仅在内容真正发生变化时，把"变更前"的状态（lastCommitted）入栈
  if (lastCommitted === mdContent.value) return
  undoStack.value.push(lastCommitted)
  if (undoStack.value.length > UNDO_LIMIT) undoStack.value.shift()
  redoStack.value = []
  canUndo.value = undoStack.value.length > 0
  canRedo.value = false
  lastCommitted = mdContent.value
}

function onUndo(): void {
  if (undoStack.value.length === 0) return
  const prev = undoStack.value.pop() as string
  redoStack.value.push(mdContent.value)
  isApplyingHistory = true
  mdContent.value = prev
  // 同步更新基准，避免后续输入把错误状态入栈
  lastCommitted = prev
  nextTick(() => {
    isApplyingHistory = false
    editorRef.value?.setTextareaValue?.(prev)
  })
  canUndo.value = undoStack.value.length > 0
  canRedo.value = true
  // 不强制滚动：preventScroll 避免浏览器把编辑区拉到可见位置（即跳到底部）
  editorRef.value?.focus?.({ preventScroll: true })
}

function onRedo(): void {
  if (redoStack.value.length === 0) return
  const nextVal = redoStack.value.pop() as string
  undoStack.value.push(mdContent.value)
  // 重做也应记录"重做前"状态到基准，便于再次编辑时正确入栈
  lastCommitted = nextVal
  isApplyingHistory = true
  mdContent.value = nextVal
  nextTick(() => {
    isApplyingHistory = false
    editorRef.value?.setTextareaValue?.(nextVal)
  })
  canRedo.value = redoStack.value.length > 0
  canUndo.value = true
  // 不强制滚动：preventScroll 避免浏览器把编辑区拉到可见位置（即跳到底部）
  editorRef.value?.focus?.({ preventScroll: true })
}

// 历史记录列表
const historyList = ref<HistoryItem[]>([])

// 异步初始化存储和文章
async function initArticles(): Promise<void> {
  await initStorage()
  // 同步到历史记录列表
  historyList.value = articles.value.map(a => ({
    id: a.id,
    title: a.title,
    theme: getTheme(config.value.themeId)?.structure.name || '新墨绿·新绿',
    content: a.content,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt
  }))
  currentArticleId.value = storageArticleId.value || articles.value[0]?.id || ''
  if (historyList.value.length > 0 && mdContent.value === '') {
    mdContent.value = historyList.value[0].content
  }
  storageReady.value = true
}

initArticles()

// ============================================================
// 同步滚动
// ============================================================
let syncScrollSource: 'editor' | 'preview' | null = null
let syncScrollTimer: ReturnType<typeof setTimeout> | null = null

// 编辑器滚动 → 同步预览
function onEditorScroll(_scrollTop: number, _scrollHeight: number, _clientHeight: number): void {
  if (syncScrollSource === 'preview') return
  syncScrollSource = 'editor'

  const textarea = editorRef.value?.getTextarea()
  if (!textarea) return

  const ratio = textarea.scrollTop / (textarea.scrollHeight - textarea.clientHeight || 1)
  previewRef.value?.scrollToRatio(ratio)

  // 延迟重置来源，避免互相触发
  if (syncScrollTimer) clearTimeout(syncScrollTimer)
  syncScrollTimer = setTimeout(() => {
    syncScrollSource = null
  }, 100)
}

// 预览滚动 → 同步编辑器
function onPreviewScroll(scrollTop: number, scrollHeight: number, clientHeight: number): void {
  if (syncScrollSource === 'editor') return
  syncScrollSource = 'preview'

  const ratio = scrollTop / (scrollHeight - clientHeight || 1)
  editorRef.value?.scrollToRatio(ratio)

  if (syncScrollTimer) clearTimeout(syncScrollTimer)
  syncScrollTimer = setTimeout(() => {
    syncScrollSource = null
  }, 100)
}

// 默认 Markdown 内容
const defaultMdContent = `:::cover 封面标题
副标题内容
---
top: 原创文章
tag: 新手指南
bottom: 点击查看详情
image: logo-light.svg
:::

这是一款**专为公众号打造**的 Markdown 编辑器。所有样式都经过精心设计，支持 ==一键复制== 到公众号后台。

:::tip 快速开始
1. 在左侧编辑区编写 Markdown
2. 右侧实时预览渲染效果
3. 点击顶部"复制 HTML"或"复制富文本"按钮
4. 粘贴到公众号后台即可
:::

## 支持的语法

### 文本格式

**加粗文字**、*斜体文字*、==高亮文字==、\`行内代码\`、~~删除线~~

### 列表

- 无序列表项一
- 无序列表项二
  - 嵌套列表项
- 无序列表项三

1. 第一步：打开编辑器
2. 第二步：编写内容
3. 第三步：一键复制

### 代码块

\`\`\`javascript
function hello(name) {
  console.log(\`Hello, \${name}!\`);
  return 'Welcome to XuMD';
}
\`\`\`

### 引用

> 好的排版让阅读成为一种享受。
> — XuMD 设计理念

### 提示卡片

:::tip 提示
这是一个普通提示卡片，用于展示小贴士。
:::

:::warning 注意
这是一个警告卡片，用于强调重要信息。
:::

:::info 说明
这是一个信息卡片，用于补充说明内容。
:::

### FAQ 问答

:::faq 如何复制到公众号？
点击顶部"复制富文本"按钮，然后直接粘贴到公众号编辑器中即可保留全部样式。
:::

:::faq 图片支持哪些格式？
支持 JPG、PNG、GIF、WebP 等常见图片格式，可以拖拽、粘贴或点击按钮上传。
:::

[签名]
`

// 编辑器内容 — 从当前文章加载
const mdContent = ref('')

function loadCurrentArticleContent(): void {
  const current = historyList.value.find(a => a.id === currentArticleId.value)
  mdContent.value = current?.content || defaultMdContent
}
loadCurrentArticleContent()
// 文章初始内容作为撤销基准
lastCommitted = mdContent.value

// 切换/新建/删除文章导致内容被外部替换时，重置撤销历史，避免旧内容混入栈中
watch(currentArticleId, () => {
  nextTick(() => {
    resetHistory(mdContent.value)
  })
})

// 主题配置
const themeId = ref(config.value.themeId)
const customColorEnabled = ref(config.value.customColorEnabled)
const customPrimaryColor = ref(config.value.customPrimaryColor)
const authorName = ref(config.value.authorName)

// ============================================================
// 渲染逻辑
// ============================================================

let renderTimer: ReturnType<typeof setTimeout> | null = null

function scheduleRender(): void {
  if (renderTimer) clearTimeout(renderTimer)
  renderTimer = setTimeout(() => {
    doRender()
  }, 200)
}

function doRender(): void {
  try {
    const renderConfig: RenderConfig = {
      themeId: themeId.value,
      customColorEnabled: customColorEnabled.value,
      customTokens: customColorEnabled.value
        ? { primary: customPrimaryColor.value }
        : undefined,
      authorName: authorName.value || 'XuMD 用户',
      coverTitle: 'XuMD 公众号编辑器',
      coverSubtitle: authorName.value || '让排版更简单',
      // 移动端：复制输出启用 flex→table 兼容，避免公众号助手 App 排版错乱
      mobileCompat: isMobile.value
    }

    const result: RenderResult = gzhRender(mdContent.value, renderConfig)
    previewHtml.value = result.previewHtml
    copyOutputHtml.value = result.copyOutputHtml

    // 更新 tokens（用于预览样式）
    const theme = getTheme(themeId.value)
    if (theme) {
      let tokens = { ...theme.tokens }
      if (customColorEnabled.value && customPrimaryColor.value) {
        const themeIdVal = theme.structure.id
        const derived = deriveTokens({
          primary: customPrimaryColor.value,
          style: themeIdVal === 'red-white' || themeIdVal === 'olive-note'
            ? 'warm'
            : themeIdVal === 'graphite-min'
            ? 'minimal'
            : themeIdVal === 'zen-empty'
            ? 'zen'
            : 'default'
        })
        tokens = { ...tokens, ...derived }
      }
      currentTokens.value = tokens
    }
  } catch (e) {
    console.error('Render error:', e)
    previewHtml.value = `<p style="color:red;padding:20px;">渲染错误: ${e}</p>`
  }
}

// ============================================================
// 事件处理
// ============================================================

// 内容变化 → 标记编辑中 + 防抖保存 + 防抖渲染 + 入撤销栈
watch(mdContent, () => {
  // 由 undo/redo 触发的赋值无需再次入栈
  if (!isApplyingHistory) pushUndo()
  updateCurrentArticleMeta()
  scheduleSave()
  scheduleRender()
})

// 主题变化 → 保存配置 + 立即渲染
watch(
  [themeId, customColorEnabled, customPrimaryColor, authorName],
  () => {
    saveConfig({
      themeId: themeId.value,
      customColorEnabled: customColorEnabled.value,
      customPrimaryColor: customPrimaryColor.value,
      authorName: authorName.value
    })
    doRender()
  }
)

// 移动端状态变化 → 重新渲染（切换复制输出的 flex→table 兼容）
watch(isMobile, () => {
  doRender()
})

// 行数字数统计
const lineCount = computed(() => {
  return mdContent.value.split('\n').length
})

const charCount = computed(() => {
  return mdContent.value.replace(/\s/g, '').length
})

// 新建文章 - 通过 storage 适配器创建
async function onNewArticle(): Promise<void> {
  // 先保存当前文章
  await saveCurrentArticleNow()
  const item = await createArticle('未命名文章', '# 新文章\n\n开始写作...\n')
  // 同步到历史记录列表
  historyList.value.unshift({
    id: item.id,
    title: item.title,
    theme: getTheme(config.value.themeId)?.structure.name || '新墨绿·新绿',
    content: item.content,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  })
  currentArticleId.value = item.id
  mdContent.value = item.content
}

// 选择历史文章
async function onSelectArticle(item: HistoryItem): Promise<void> {
  if (item.id === currentArticleId.value) return
  // 先保存当前文章
  await saveCurrentArticleNow()
  // 切换到选中的文章
  currentArticleId.value = item.id
  saveCurrentId(item.id)
  // 加载文章内容
  mdContent.value = item.content
}

// 删除文章
async function onDeleteArticle(item: HistoryItem): Promise<void> {
  const index = historyList.value.findIndex(a => a.id === item.id)
  if (index === -1) return
  // 从存储中删除
  await deleteArticle(item.id)
  // 从列表中删除
  historyList.value.splice(index, 1)
  // 如果删除的是当前文章，切换到第一篇
  if (item.id === currentArticleId.value && historyList.value.length > 0) {
    currentArticleId.value = historyList.value[0].id
    saveCurrentId(historyList.value[0].id)
    mdContent.value = historyList.value[0].content
  }
}

// 重命名文章
async function onRenameArticle(item: HistoryItem, newTitle: string): Promise<void> {
  const newId = await renameArticle(item.id, newTitle)
  const found = historyList.value.find(a => a.id === item.id)
  if (found) {
    found.title = newTitle
    found.updatedAt = Date.now()
    if (newId !== item.id) {
      found.id = newId
    }
  }
  if (item.id === currentArticleId.value && newId !== item.id) {
    currentArticleId.value = newId
  }
}

// 更新当前文章元信息（标题、主题、修改时间），不触发保存
function updateCurrentArticleMeta(): void {
  const title = extractTitle(mdContent.value)
  const theme = getTheme(themeId.value)?.structure.name || '新墨绿·新绿'
  updateCurrentContent(mdContent.value, title, theme)
  // 同步到历史记录列表
  const current = historyList.value.find(a => a.id === currentArticleId.value)
  if (current) {
    current.content = mdContent.value
    current.title = title
    current.updatedAt = Date.now()
    current.theme = theme
    // 移动到列表头部
    const index = historyList.value.findIndex(a => a.id === currentArticleId.value)
    if (index > 0) {
      const [item] = historyList.value.splice(index, 1)
      historyList.value.unshift(item)
    }
  }
}

// 立即保存当前文章（切换文章、删除等关键操作前调用）
async function saveCurrentArticleNow(): Promise<void> {
  updateCurrentArticleMeta()
  await saveNow()
}

// 从 Markdown 提取标题
function extractTitle(md: string): string {
  const lines = md.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('# ')) {
      return trimmed.slice(2).trim() || '未命名文章'
    }
    if (trimmed.startsWith('## ')) {
      return trimmed.slice(3).trim() || '未命名文章'
    }
    if (trimmed.length > 0 && !trimmed.startsWith(':::')) {
      return trimmed.slice(0, 30) || '未命名文章'
    }
  }
  return '未命名文章'
}

// 存储模式切换
async function onStorageTypeChange(type: string): Promise<void> {
  if (type === 'localStorage') {
    await switchToLocalStorage()
    // 重新同步历史记录列表
    historyList.value = articles.value.map(a => ({
      id: a.id,
      title: a.title,
      theme: getTheme(config.value.themeId)?.structure.name || '新墨绿·新绿',
      content: a.content,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt
    }))
    if (historyList.value.length > 0) {
      currentArticleId.value = articles.value[0].id
      mdContent.value = articles.value[0].content
    }
    showTempStatus('已切换到浏览器本地存储')
  }
  showStorageModal.value = false
}

// 选择本地文件夹
async function onPickFolder(): Promise<void> {
  const ok = await switchToFileSystem()
  if (!ok) {
    showTempStatus('已取消选择文件夹')
    return
  }
  // 重新同步历史记录列表
  historyList.value = articles.value.map(a => ({
    id: a.id,
    title: a.title,
    theme: getTheme(config.value.themeId)?.structure.name || '新墨绿·新绿',
    content: a.content,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt
  }))
  if (historyList.value.length > 0) {
    currentArticleId.value = articles.value[0].id
    mdContent.value = articles.value[0].content
  } else {
    // 文件夹为空，创建一篇默认文章
    await onNewArticle()
  }
  showTempStatus('已连接本地文件夹')
  showStorageModal.value = false
}

// 图床切换
function onImageHostChange(type: string, _config: Record<string, unknown>): void {
  imageHostType.value = type
  const nameMap: Record<string, string> = {
    local: '本地 Base64',
    qiniu: '七牛云',
    aliyun: '阿里云 OSS'
  }
  showTempStatus(`图床已切换为：${nameMap[type] || type}`)
  showImageHostModal.value = false
}

// 复制 HTML
async function onCopyHtml(): Promise<void> {
  if (!copyOutputHtml.value) return
  const ok = await copyText(copyOutputHtml.value)
  if (ok) {
    showToast('HTML 已复制到剪贴板', 'success')
  } else {
    showToast('复制失败，请重试', 'error')
  }
  showTempStatus(ok ? 'HTML 已复制' : '复制失败')
}

// 复制富文本（复制到公众号）
async function onCopyRichText(): Promise<void> {
  if (!copyOutputHtml.value) return
  try {
    await copyHtmlToClipboard(copyOutputHtml.value)
    showToast('已复制，可粘贴到公众号', 'success')
    showTempStatus('✓ 已复制，可粘贴到公众号')
  } catch {
    showToast('复制失败，请重试', 'error')
    showTempStatus('复制失败，请重试')
  }
}

// 插入图片
function onInsertImage(): void {
  editorRef.value?.triggerFileInput()
}

// ============================================================
// 快捷工具栏操作
// ============================================================

function onToolbarAction(action: string): void {
  const editor = editorRef.value
  if (!editor) return

  // 先记录撤销点（仅对会改变内容的动作）
  const recordable = ![
    'image'
  ].includes(action)
  if (recordable) pushUndo()

  const textarea = editor.getTextarea()
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = mdContent.value.slice(start, end)
  const lineStart = mdContent.value.lastIndexOf('\n', start - 1) + 1
  const currentLine = mdContent.value.slice(lineStart, start)

  let insertText = ''
  let cursorOffset = 0

  switch (action) {
    case 'bold':
      insertText = `**${selectedText || '加粗文字'}**`
      cursorOffset = selectedText ? insertText.length : 2
      break
    case 'italic':
      insertText = `*${selectedText || '斜体文字'}*`
      cursorOffset = selectedText ? insertText.length : 1
      break
    case 'highlight':
      insertText = `==${selectedText || '高亮文字'}==`
      cursorOffset = selectedText ? insertText.length : 2
      break
    case 'strikethrough':
      insertText = `~~${selectedText || '删除文字'}~~`
      cursorOffset = selectedText ? insertText.length : 2
      break
    case 'inlineCode':
      insertText = `\`${selectedText || 'code'}\``
      cursorOffset = selectedText ? insertText.length : 1
      break
    case 'link':
      insertText = `[${selectedText || '链接文字'}](https://)`
      cursorOffset = selectedText ? insertText.length - 1 : 1
      break
    case 'image':
      onInsertImage()
      return
    case 'h1':
      insertText = '# '
      const newH1Content =
        mdContent.value.slice(0, lineStart) +
        '# ' +
        mdContent.value.slice(lineStart)
      mdContent.value = newH1Content
      nextTick(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2
        textarea.focus()
      })
      return
    case 'heading':
      if (currentLine.startsWith('#')) {
        // 已有标题，增加一级
        insertText = '#'
        editor.insertAtCursor('#')
        return
      } else {
        insertText = '## '
        // 在行首插入
        const newContent =
          mdContent.value.slice(0, lineStart) +
          '## ' +
          mdContent.value.slice(lineStart)
        mdContent.value = newContent
        // 更新光标位置
        nextTick(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 3
          textarea.focus()
        })
        return
      }
    case 'h3':
      insertText = '### '
      const newH3Content =
        mdContent.value.slice(0, lineStart) +
        '### ' +
        mdContent.value.slice(lineStart)
      mdContent.value = newH3Content
      nextTick(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 4
        textarea.focus()
      })
      return
    case 'ul':
      insertText = '- '
      // 行首插入
      const newUlContent =
        mdContent.value.slice(0, lineStart) +
        '- ' +
        mdContent.value.slice(lineStart)
      mdContent.value = newUlContent
      nextTick(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2
        textarea.focus()
      })
      return
    case 'ol':
      insertText = '1. '
      const newOlContent =
        mdContent.value.slice(0, lineStart) +
        '1. ' +
        mdContent.value.slice(lineStart)
      mdContent.value = newOlContent
      nextTick(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 3
        textarea.focus()
      })
      return
    case 'taskList':
      insertText = '- [ ] '
      const newTaskContent =
        mdContent.value.slice(0, lineStart) +
        '- [ ] ' +
        mdContent.value.slice(lineStart)
      mdContent.value = newTaskContent
      nextTick(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 6
        textarea.focus()
      })
      return
    case 'quote':
      insertText = '> '
      const newQuoteContent =
        mdContent.value.slice(0, lineStart) +
        '> ' +
        mdContent.value.slice(lineStart)
      mdContent.value = newQuoteContent
      nextTick(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2
        textarea.focus()
      })
      return
    case 'codeBlock':
      insertText = `\n\`\`\`javascript\n${selectedText || '// 代码'}\n\`\`\`\n`
      cursorOffset = selectedText ? insertText.length - 5 : 13
      break
    case 'hr':
      insertText = '\n---\n'
      cursorOffset = insertText.length
      break
    case 'tip':
      insertText = `\n:::tip 提示标题\n${selectedText || '提示内容'}\n:::\n`
      cursorOffset = selectedText ? insertText.length : 5
      break
    case 'warning':
      insertText = `\n:::warning 警告标题\n${selectedText || '警告内容'}\n:::\n`
      cursorOffset = selectedText ? insertText.length : 5
      break
    case 'info':
      insertText = `\n:::info 说明标题\n${selectedText || '说明内容'}\n:::\n`
      cursorOffset = selectedText ? insertText.length : 5
      break
    case 'faq':
      insertText = `\n:::faq 问题？\n${selectedText || '答案'}\n:::\n`
      cursorOffset = selectedText ? insertText.length : 3
      break
    case 'chapter':
      // 章节标题，行首插入
      insertText = '/// '
      const newChapterContent =
        mdContent.value.slice(0, lineStart) +
        '/// ' +
        mdContent.value.slice(lineStart)
      mdContent.value = newChapterContent
      nextTick(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 4
        textarea.focus()
      })
      return
    case 'cover':
      insertText = `\n:::cover 在这里写封面标题\n在这里写封面副标题，可以是多行内容\n:::\n`
      cursorOffset = 11 // 光标移到标题位置
      break
    case 'toc':
      insertText = '\n[TOC]\n'
      cursorOffset = insertText.length
      break
    case 'signature':
      insertText = '\n[签名]\n'
      cursorOffset = insertText.length
      break
    default:
      return
  }

  // 替换选中文本
  const newContent =
    mdContent.value.slice(0, start) +
    insertText +
    mdContent.value.slice(end)
  mdContent.value = newContent

  // 设置光标位置
  nextTick(() => {
    const pos = start + cursorOffset
    textarea.selectionStart = textarea.selectionEnd = pos
    textarea.focus()
  })

  // 同步预览（工具栏动作需实时反映到预览区）
  doRender()
}

// 从语法帮助插入
function onHelpInsert(text: string): void {
  editorRef.value?.insertAtCursor('\n' + text + '\n')
}

// ============================================================
// 拖拽调整大小
// ============================================================

let isResizing = false
let startX = 0
let startLeftWidth = 0

function startResize(e: MouseEvent): void {
  isResizing = true
  startX = e.clientX
  const editorSide = document.querySelector('.editor-side')
  if (editorSide) {
    startLeftWidth = editorSide.getBoundingClientRect().width
  }

  document.addEventListener('mousemove', onResize)
  document.addEventListener('mouseup', stopResize)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

function onResize(e: MouseEvent): void {
  if (!isResizing) return
  const deltaX = e.clientX - startX
  const newWidth = startLeftWidth + deltaX
  const minWidth = 280
  const maxWidth = window.innerWidth - 280

  const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth))

  const editorSide = document.querySelector('.editor-side') as HTMLElement
  if (editorSide) {
    editorSide.style.flex = `0 0 ${clampedWidth}px`
    editorSide.style.width = `${clampedWidth}px`
  }
}

function stopResize(): void {
  isResizing = false
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', stopResize)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

// ============================================================
// 初始化
// ============================================================

onMounted(() => {
  // 初始化默认文章的内容和标题
  const defaultItem = historyList.value.find(a => a.id === 'default')
  if (defaultItem) {
    defaultItem.content = mdContent.value
    defaultItem.title = extractTitle(mdContent.value)
  }
  nextTick(() => {
    doRender()
  })
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: #111827;
  background: #fff;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

.dark ::-webkit-scrollbar-thumb {
  background: #4b5563;
}

.dark ::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}
</style>

<style scoped>
.app-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--app-bg, #fff);
  min-height: 0;
}

.app-container.dark {
  --app-bg: #0f172a;
  --editor-border: #334155;
  --toolbar-bg: #0f172a;
  --toolbar-border: #334155;
}

.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
  position: relative;
}

.editor-side {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  position: relative;
  background: var(--editor-side-bg, #ffffff);
}

.editor-pane-header {
  padding-left: 18px !important;
  padding-right: 18px !important;
  min-height: 42px;
  display: flex;
  align-items: center;
  background: var(--pane-header-bg, #f8fafc);
  border-bottom: 1px solid var(--editor-border, #e5e7eb);
  flex-shrink: 0;
  gap: 8px;
}

.app-container.dark .editor-pane-header {
  --pane-header-bg: #1e293b;
  background: #1e293b;
}

.pane-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
}

.pane-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--pane-title-color, #6b7280);
  letter-spacing: 0.02em;
}

.app-container.dark .pane-title {
  color: #94a3b8;
}

.toolbar-wrapper {
  background: var(--toolbar-bg, #ffffff);
  border-bottom: 1px solid var(--toolbar-border, #e5e7eb);
  flex-shrink: 0;
  overflow: visible;
  position: relative;
}

.toolbar-wrapper :deep(.quick-toolbar) {
  border: none;
  background: transparent;
  padding: 0;
  display: flex;
  min-height: 42px;
}

/* 移动端：工具栏允许换行 */
@media (max-width: 640px) {
  .toolbar-wrapper :deep(.quick-toolbar) {
    min-height: auto;
    flex-wrap: wrap;
  }
}

/* 下拉菜单浮到最顶层，避免被编辑区（移动端 editor-side 的 z-index:1/2 或编辑器内部元素）遮挡 */
.toolbar-wrapper :deep(.dropdown-menu) {
  z-index: 99999;
}

/* 编辑区状态栏 */
.editor-status-bar {
  height: 28px;
  padding: 0 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--editor-status-bg, #f9fafb);
  border-top: 1px solid var(--editor-status-border, #e5e7eb);
  flex-shrink: 0;
  font-size: 12px;
  color: var(--editor-status-text, #6b7280);
}

.editor-status-bar .status-left,
.editor-status-bar .status-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.editor-status-bar .status-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.app-container.dark .editor-status-bar {
  background: #1e293b;
  border-color: #334155;
  color: #94a3b8;
}

.resize-handle {
  width: 4px;
  flex-shrink: 0;
  background: transparent;
  cursor: col-resize;
  transition: background 0.2s;
  position: relative;
  z-index: 5;
}

.resize-handle:hover {
  background: var(--resize-handle, #3b82f6);
}

.custom-color-dot .color-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

/* 面板遮罩 */
.panel-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.panel-drawer {
  width: 380px;
  max-width: 100%;
  height: 100%;
  background: var(--drawer-bg, #fff);
  display: flex;
  flex-direction: column;
  animation: slideIn 0.25s ease;
}

.panel-drawer.help-drawer {
  width: 460px;
  max-width: 100%;
}

@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

.panel-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--drawer-border, #e5e7eb);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.panel-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--drawer-title, #111827);
}

.close-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  font-size: 20px;
  color: var(--drawer-close, #9ca3af);
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: var(--drawer-close-hover, #f3f4f6);
  color: var(--drawer-title, #111827);
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 0 20px 20px;
  min-height: 0;
}

/* 暗黑模式 */
.dark.app-container {
  --app-bg: #0f172a;
  --editor-border: #334155;
  --toolbar-bg: #1e293b;
  --toolbar-border: #334155;
  --resize-handle: #3b82f6;
  --drawer-bg: #1e293b;
  --drawer-border: #334155;
  --drawer-title: #f1f5f9;
  --drawer-close: #64748b;
  --drawer-close-hover: #334155;
}

/* 响应式：平板 */
@media (max-width: 1024px) {
  .panel-drawer {
    width: 340px;
  }
  .panel-drawer.help-drawer {
    width: 400px;
  }
}

/* 响应式：移动端（仅 .mobile 类生效时切换布局） */
@media (max-width: 768px) {
  .app-container.mobile .main-content {
    flex-direction: row;
    padding-bottom: calc(60px + env(safe-area-inset-bottom, 0px));
  }

  /* 移动端：侧边栏完全隐藏 */
  .app-container.mobile .sidebar {
    display: none !important;
  }

  /* 移动端：编辑区占满宽度 */
  .app-container.mobile .editor-side {
    flex: 1;
    min-width: 0;
    border-right: none;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1;
  }

  .app-container.mobile[data-mobile-view="preview"] .editor-side {
    display: none;
  }

  /* 移动端：隐藏分隔条 */
  .app-container.mobile .resize-handle {
    display: none;
  }

  /* 移动端：预览区占满宽度，叠在编辑区上方 */
  .app-container.mobile .preview-pane {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 2;
  }

  .app-container.mobile[data-mobile-view="editor"] .preview-pane {
    display: none;
  }

  /* 移动端：隐藏编辑区状态栏 */
  .app-container.mobile .editor-status-bar {
    display: none;
  }

  .app-container.mobile .panel-drawer,
  .app-container.mobile .panel-drawer.help-drawer {
    width: 100%;
  }

  .app-container.mobile .panel-body {
    padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
  }
}
</style>
