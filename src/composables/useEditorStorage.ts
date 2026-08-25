/**
 * 编辑器内容持久化组合式函数
 *
 * 功能：
 * 1. 支持多种存储后端（localStorage / 本地文件夹）
 * 2. 自动保存（3秒防抖，复刻 WeMD）
 * 3. 保存状态管理（编辑中 / 保存中 / 已保存）
 * 4. 配置项持久化（主题、自定义颜色等）
 */

import { ref, computed } from 'vue'
import { LocalStorageAdapter } from '../storage/LocalStorageAdapter'
import { FileSystemAdapter } from '../storage/FileSystemAdapter'
import { IndexedDBAdapter } from '../storage/IndexedDBAdapter'
import type { StorageAdapter, FileItem } from '../storage/types'

const STORAGE_PREFIX = 'xumd-editor:'

// 存储模式持久化键（复刻 WeMD 的 wemd-storage-adapter）
const STORAGE_ADAPTER_KEY = `${STORAGE_PREFIX}storageAdapter`

export interface EditorConfig {
  themeId: string
  customColorEnabled: boolean
  customPrimaryColor: string
  authorName: string
}

export type { FileItem } from '../storage/types'

const defaultConfig: EditorConfig = {
  themeId: 'moyu-green',
  customColorEnabled: false,
  customPrimaryColor: '#8B5CF6',
  authorName: ''
}

// 相对时间格式化
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  if (diff < 60 * 1000) return '刚刚'
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}分钟前`
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}小时前`
  if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / (24 * 60 * 60 * 1000))}天前`
  const d = new Date(timestamp)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function useEditorStorage(key = 'default') {
  const configKey = `${STORAGE_PREFIX}config:${key}`
  const storageTypeKey = `${STORAGE_PREFIX}storageType:${key}`

  const articles = ref<FileItem[]>([])
  const currentArticleId = ref<string>('')
  const config = ref<EditorConfig>({ ...defaultConfig })
  const storageType = ref<'indexeddb' | 'localStorage' | 'filesystem'>('indexeddb')

  // 保存状态
  const saveStatus = ref<'idle' | 'editing' | 'saving' | 'saved'>('idle')
  const lastSavedAt = ref<number>(0)

  const saveStatusText = computed(() => {
    switch (saveStatus.value) {
      case 'saving':
        return '保存中...'
      case 'saved':
        if (lastSavedAt.value) {
          return `已保存 · ${formatRelativeTime(lastSavedAt.value)}`
        }
        return '已保存'
      case 'editing':
        return '编辑中'
      default:
        return '就绪'
    }
  })

  // 当前存储适配器
  let adapter: StorageAdapter = new LocalStorageAdapter(key)

  // 保存防抖计时器
  let saveTimer: ReturnType<typeof setTimeout> | null = null
  // 保存队列（避免并发写入）
  let isSaving = false
  let pendingSave = false

  // 解析初始存储模式（复刻 WeMD：优先读取已持久化的模式，否则默认浏览器存储 IndexedDB）
  function resolveInitialType(): 'indexeddb' | 'localStorage' | 'filesystem' {
    const persisted = localStorage.getItem(STORAGE_ADAPTER_KEY)
    if (persisted === 'indexeddb' || persisted === 'localStorage' || persisted === 'filesystem') {
      return persisted
    }
    // 兼容旧版 storageType 键
    const legacy = localStorage.getItem(storageTypeKey)
    if (legacy === 'filesystem') return 'filesystem'
    // 旧版默认是 localStorage，或首次运行：统一升级为 IndexedDB（并迁移已有数据）
    return 'indexeddb'
  }

  // 持久化当前存储模式（下次启动自动恢复，复刻 WeMD 的 restoreLastAdapter）
  function persistAdapterType(): void {
    try {
      localStorage.setItem(STORAGE_ADAPTER_KEY, storageType.value)
    } catch {
      /* ignore */
    }
  }

  // 从 localStorage 迁移已有文章到目标适配器（切换/升级时保留数据，不影响原数据）
  async function migrateFromLocalStorage(target: StorageAdapter): Promise<boolean> {
    try {
      const legacy = new LocalStorageAdapter(key)
      const files = await legacy.listFiles()
      if (files.length === 0) return false
      for (const f of files) {
        await target.writeFile(f)
      }
      return true
    } catch (e) {
      console.warn('[XuMD] 从 localStorage 迁移失败:', e)
      return false
    }
  }

  // 加载配置
  function loadConfig(): void {
    const savedConfig = localStorage.getItem(configKey)
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig)
        config.value = { ...defaultConfig, ...parsed }
      } catch (e) {
        console.warn('Failed to parse saved config:', e)
      }
    }
  }

  // 从当前适配器加载文章列表
  async function loadArticles(): Promise<void> {
    try {
      const files = await adapter.listFiles()
      articles.value = files
      if (files.length > 0) {
        // 优先恢复上次选中的文章
        const savedId = localStorage.getItem(`${STORAGE_PREFIX}currentId:${key}`)
        if (savedId && files.some(f => f.id === savedId)) {
          currentArticleId.value = savedId
        } else {
          currentArticleId.value = files[0].id
        }
      }
    } catch (e) {
      console.warn('Failed to load articles:', e)
      articles.value = []
    }
  }

  // 初始化 IndexedDB 存储（默认模式）：打开数据库，必要时从 localStorage 迁移
  async function initIndexedDB(migrate: boolean): Promise<void> {
    const idb = new IndexedDBAdapter()
    if (!(await idb.init())) {
      // IndexedDB 不可用，回退到 localStorage
      adapter = new LocalStorageAdapter(key)
      await adapter.init()
      storageType.value = 'localStorage'
      await loadArticles()
      if (articles.value.length === 0) await createDefaultArticle()
      persistAdapterType()
      return
    }
    adapter = idb
    storageType.value = 'indexeddb'
    await loadArticles()

    // 首次使用 IndexedDB 且为空：尝试把 localStorage 里的旧文章迁过来（不破坏原数据）
    if (articles.value.length === 0 && migrate) {
      await migrateFromLocalStorage(idb)
      await loadArticles()
    }
    if (articles.value.length === 0) {
      await createDefaultArticle()
    }
    persistAdapterType()
  }

  // 初始化
  async function init(): Promise<void> {
    loadConfig()
    const initialType = resolveInitialType()
    storageType.value = initialType

    if (initialType === 'filesystem') {
      const fsAdapter = new FileSystemAdapter()
      if (await fsAdapter.init()) {
        adapter = fsAdapter
      } else {
        // 初始化失败，回退到 IndexedDB
        await initIndexedDB(true)
        return
      }
      await loadArticles()
      if (articles.value.length === 0) await createDefaultArticle()
      persistAdapterType()
      return
    }

    if (initialType === 'indexeddb') {
      await initIndexedDB(true)
      return
    }

    // localStorage 模式
    adapter = new LocalStorageAdapter(key)
    await adapter.init()
    await loadArticles()
    if (articles.value.length === 0) await createDefaultArticle()
    persistAdapterType()
  }

  // 创建默认欢迎文章
  async function createDefaultArticle(): Promise<void> {
    const defaultMdContent = `:::cover XuMD 使用指南
专为公众号打造的 Markdown 编辑器
---
top: 原创教程
tag: 新手指南
:::

## 快速上手

:::tip 三分钟学会
照着这篇示例改一遍，就能掌握 XuMD 的核心用法。所有组件都可以直接复制使用。
:::

### 第一步：认识编辑器

左侧是 **Markdown 编辑区**，你可以在这里写作；右侧是**实时预览区**，随时查看排版效果。

> step 输入内容
> 在左侧编辑器中输入 Markdown 文本，支持所有常见语法。
>
> step 选择主题
> 点击顶部「文章主题」，选择你喜欢的排版风格。
>
> step 复制发布
> 点击「复制到公众号」，直接粘贴到公众号后台即可。

### 第二步：核心组件一览

XuMD 提供了丰富的排版组件，让你的文章不再单调。

---

## 卡片组件

### 提示与警告

:::tip 小技巧
绿色提示用于给出积极的建议和方法，语气轻松友好。
:::

:::warning 请注意
黄色警告用于提醒重要事项，避免读者踩坑。
:::

:::info 补充说明
蓝色信息用于提供背景知识和扩展阅读。
:::

:::faq 什么是公众号排版？
公众号排版是指将文章内容通过合理的字体、颜色、间距和组件搭配，让读者获得更好的阅读体验。好的排版能显著提升文章的专业感和可读性。
:::

### 引用与高亮

:::quote 好的排版，是对读者最基本的尊重。
:::

普通段落里可以使用 **加粗强调**、==高亮标记== 和 \`行内代码\`，让关键信息一目了然。

你还可以使用 [tag:自定义标签] 来标记分类或重点。

---

## 内容组件

### 代码块

\`\`\`javascript
function hello() {
  console.log("Hello, XuMD!");
}
hello();
\`\`\`

### 引用块

> 这是一段引用内容。
> 可以包含多行文字。
> - 支持列表
> - 支持嵌套

### 时间线

:::timeline
2024.01 - 项目启动，确定技术方向
2024.03 - 首个内测版本发布
2024.06 - 正式版上线，支持多主题
2024.09 - 新增图床功能和本地存储
:::

---

## 特殊标记

### 目录

[目录]

### 章节标题

/// 第一章 基础入门

章节内容从这里开始。章节标题是文章结构的骨架，合理使用可以让文章层次分明。

/// 第二章 进阶技巧

继续深入学习更多排版技巧。

---

## 表格示例

| 功能 | 说明 | 快捷键 |
|------|------|--------|
| 加粗 | 重点强调 | Ctrl+B |
| 高亮 | 关键标记 | Ctrl+H |
| 复制 | 导出公众号 | Ctrl+C |

### 列表

- 无序列表项一
- 无序列表项二
- 无序列表项三

1. 有序列表第一步
2. 有序列表第二步
3. 有序列表第三步

---

[签名 感谢阅读，欢迎关注我的公众号]
`
    const now = Date.now()
    const item: FileItem = {
      id: adapter.type === 'filesystem' ? '欢迎使用 XuMD.md' : 'default',
      title: '欢迎使用 XuMD',
      content: defaultMdContent,
      createdAt: now,
      updatedAt: now
    }
    await adapter.writeFile(item)
    articles.value = [item]
    currentArticleId.value = item.id
    saveCurrentId(item.id)
  }

  // 执行保存（串行化，避免并发）
  async function doSave(): Promise<void> {
    if (isSaving) {
      pendingSave = true
      return
    }
    isSaving = true
    saveStatus.value = 'saving'
    try {
      // 保存当前文章
      const current = articles.value.find(a => a.id === currentArticleId.value)
      if (current) {
        await adapter.writeFile(current)
      }
      lastSavedAt.value = Date.now()
      saveStatus.value = 'saved'
    } catch (e) {
      console.warn('Failed to save:', e)
      saveStatus.value = 'editing'
    } finally {
      isSaving = false
      if (pendingSave) {
        pendingSave = false
        doSave()
      }
    }
  }

  // 标记编辑中并安排防抖保存
  function scheduleSave(): void {
    saveStatus.value = 'editing'
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      doSave()
    }, 3000)
  }

  // 立即保存
  function saveNow(): void {
    if (saveTimer) {
      clearTimeout(saveTimer)
      saveTimer = null
    }
    doSave()
  }

  // 标记为编辑中（不触发保存，用于 UI 状态）
  function markEditing(): void {
    if (saveStatus.value === 'saving') return
    saveStatus.value = 'editing'
  }

  // 保存当前文章 ID
  function saveCurrentId(id: string): void {
    currentArticleId.value = id
    try {
      localStorage.setItem(`${STORAGE_PREFIX}currentId:${key}`, id)
    } catch (e) {
      console.warn('Failed to save current id:', e)
    }
  }

  // 保存配置
  function saveConfig(newConfig: Partial<EditorConfig>): void {
    config.value = { ...config.value, ...newConfig }
    try {
      localStorage.setItem(configKey, JSON.stringify(config.value))
    } catch (e) {
      console.warn('Failed to save config:', e)
    }
  }

  // 新建文章
  async function createArticle(title: string, content: string): Promise<FileItem> {
    // 先保存当前文章
    await doSave()
    const item = await adapter.createFile(title, content)
    articles.value.unshift(item)
    currentArticleId.value = item.id
    saveCurrentId(item.id)
    lastSavedAt.value = Date.now()
    saveStatus.value = 'saved'
    return item
  }

  // 删除文章
  async function deleteArticle(id: string): Promise<void> {
    await adapter.deleteFile(id)
    const index = articles.value.findIndex(a => a.id === id)
    if (index >= 0) {
      articles.value.splice(index, 1)
    }
    // 如果删除的是当前文章，切换到第一篇
    if (id === currentArticleId.value && articles.value.length > 0) {
      currentArticleId.value = articles.value[0].id
      saveCurrentId(articles.value[0].id)
    }
  }

  // 重命名文章
  async function renameArticle(oldId: string, newTitle: string): Promise<string> {
    const newId = await adapter.renameFile(oldId, newTitle)
    const item = articles.value.find(a => a.id === oldId)
    if (item) {
      item.title = newTitle
      if (newId !== oldId) {
        item.id = newId
      }
      item.updatedAt = Date.now()
    }
    // 如果重命名的是当前文章，更新 currentId
    if (oldId === currentArticleId.value && newId !== oldId) {
      currentArticleId.value = newId
      saveCurrentId(newId)
    }
    return newId
  }

  // 切换到文件系统存储
  async function switchToFileSystem(): Promise<boolean> {
    const fsAdapter = new FileSystemAdapter()
    const ok = await fsAdapter.pickFolder()
    if (!ok) return false

    // 保存当前文章到 localStorage 作为备份
    await doSave()

    // 切换适配器
    adapter = fsAdapter
    storageType.value = 'filesystem'
    persistAdapterType()

    // 加载文件夹中的文章
    await loadArticles()

    // 如果文件夹为空，把当前文章写入
    if (articles.value.length === 0) {
      // 这里不做迁移，用户从零开始
    }

    return true
  }

  // 切换到 localStorage 存储
  async function switchToLocalStorage(): Promise<void> {
    await doSave()
    adapter = new LocalStorageAdapter(key)
    await adapter.init()
    storageType.value = 'localStorage'
    persistAdapterType()
    await loadArticles()

    // 如果 localStorage 为空，创建默认文章
    if (articles.value.length === 0) {
      await createDefaultArticle()
    }
  }

  // 切换到 IndexedDB 存储（复刻 WeMD 默认浏览器存储模式）
  async function switchToIndexedDB(): Promise<void> {
    // 先保存当前文章到旧适配器（adapter 此刻仍是切换前的）
    await doSave()
    const idb = new IndexedDBAdapter()
    if (!(await idb.init())) {
      console.warn('[XuMD] 当前浏览器不支持 IndexedDB，保持原存储模式')
      return
    }
    // 迁移：若 IndexedDB 为空，把旧适配器的文章一并搬过来
    const existing = await idb.listFiles()
    if (existing.length === 0) {
      await migrateFromLocalStorage(idb)
    } else {
      // 确保当前文章最新内容已写入
      const current = articles.value.find((a) => a.id === currentArticleId.value)
      if (current) await idb.writeFile(current)
    }
    adapter = idb
    storageType.value = 'indexeddb'
    persistAdapterType()
    await loadArticles()
    if (articles.value.length === 0) await createDefaultArticle()
  }

  // 更新当前文章内容和元信息（不触发保存，由 scheduleSave/saveNow 控制）
  function updateCurrentContent(content: string, title: string, _theme: string): void {
    const current = articles.value.find(a => a.id === currentArticleId.value)
    if (!current) return
    current.content = content
    current.title = title
    current.updatedAt = Date.now()
    // 移动到列表头部
    const index = articles.value.findIndex(a => a.id === currentArticleId.value)
    if (index > 0) {
      const [item] = articles.value.splice(index, 1)
      articles.value.unshift(item)
    }
  }

  // 清空所有
  function clearAll(): void {
    articles.value = []
    currentArticleId.value = ''
    config.value = { ...defaultConfig }
    localStorage.removeItem(configKey)
    localStorage.removeItem(`${STORAGE_PREFIX}currentId:${key}`)
  }

  return {
    articles,
    currentArticleId,
    config,
    storageType,
    saveStatus,
    saveStatusText,
    lastSavedAt,
    markEditing,
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
    switchToIndexedDB,
    clearAll,
    init,
    formatRelativeTime
  }
}
