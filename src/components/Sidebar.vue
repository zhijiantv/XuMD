<template>
  <aside class="sidebar" :class="{ dark: isDark, collapsed: isCollapsed }">
    <!-- 折叠状态的顶栏 -->
    <div class="sidebar-collapsed-header" v-if="isCollapsed">
      <button class="collapse-toggle" title="展开侧边栏" @click="toggleCollapse">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="13 17 18 12 13 7"></polyline>
          <polyline points="6 17 11 12 6 7"></polyline>
        </svg>
      </button>
    </div>

    <template v-else>
      <div class="sidebar-top">
        <button class="new-article-btn" @click="handleNewArticle">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>新建文章</span>
        </button>
        <button class="collapse-toggle collapse-toggle-right" title="隐藏侧边栏" @click="toggleCollapse">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="11 17 6 12 11 7"></polyline>
            <polyline points="18 17 13 12 18 7"></polyline>
          </svg>
        </button>
      </div>

      <div class="history-section">
        <div class="history-header">
          <span class="history-title">历史记录</span>
          <span class="history-count">{{ history.length }}</span>
        </div>

        <div class="history-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            v-model="searchQuery"
            placeholder="搜索..."
            class="search-input"
          />
        </div>

        <div class="history-list">
          <div
            v-for="item in filteredHistory"
            :key="item.id"
            class="history-item"
            :class="{ active: item.id === currentId, renaming: renamingId === item.id }"
            @click="handleSelect(item)"
          >
            <div class="history-item-main">
              <div class="history-time">{{ formatTime(item.updatedAt) }}</div>
              <div class="history-title-text" v-if="renamingId !== item.id">{{ item.title }}</div>
              <input
                v-else
                ref="renameInputRef"
                type="text"
                class="rename-input"
                :value="item.title"
                @click.stop
                @keyup.enter="confirmRename(item)"
                @keyup.esc="cancelRename"
                @blur="confirmRename(item)"
              />
              <div class="history-theme">{{ item.theme }}</div>
            </div>
            <div class="history-actions">
              <button
                class="action-btn"
                title="重命名"
                @click.stop="startRename(item)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                </svg>
              </button>
              <button
                class="action-btn delete-btn"
                title="删除"
                @click.stop="handleDelete(item)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </div>

          <div v-if="filteredHistory.length === 0" class="history-empty">
            暂无历史记录
          </div>
        </div>
      </div>

      <div class="sidebar-footer">
        <div class="footer-brand">
          <span class="footer-logo">XuMD</span>
          <span class="footer-version">v1.0.0</span>
        </div>
        <div class="footer-actions">
          <button class="footer-icon-btn" title="设置" @click="$emit('openSettings')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"></path>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
          <button class="footer-icon-btn" title="帮助" @click="$emit('openHelp')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </button>
          <button class="footer-icon-btn" title="GitHub" @click="openGitHub">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
            </svg>
          </button>
        </div>
      </div>
    </template>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'

export interface HistoryItem {
  id: string
  title: string
  theme: string
  content: string
  createdAt: number
  updatedAt: number
}

const props = defineProps<{
  isDark: boolean
  history: HistoryItem[]
  currentId: string
}>()

const emit = defineEmits<{
  (e: 'newArticle', item: HistoryItem): void
  (e: 'select', item: HistoryItem): void
  (e: 'delete', item: HistoryItem): void
  (e: 'rename', item: HistoryItem, newTitle: string): void
  (e: 'openSettings'): void
  (e: 'openHelp'): void
  (e: 'toggleCollapse'): void
}>()

const searchQuery = ref('')
const isCollapsed = ref(false)
const renamingId = ref<string | null>(null)
const renameInputRef = ref<HTMLInputElement | null>(null)
const renameOrigTitle = ref('')

// 相对时间格式化
function formatTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  if (diff < 60 * 1000) return '刚刚'
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}分钟前`
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}小时前`
  if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / (24 * 60 * 60 * 1000))}天前`
  const d = new Date(timestamp)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const filteredHistory = computed(() => {
  if (!searchQuery.value.trim()) return props.history
  const query = searchQuery.value.toLowerCase()
  return props.history.filter(item =>
    item.title.toLowerCase().includes(query)
  )
})

function toggleCollapse(): void {
  isCollapsed.value = !isCollapsed.value
  emit('toggleCollapse')
}

function handleNewArticle(): void {
  const now = Date.now()
  const newItem: HistoryItem = {
    id: 'article-' + now,
    title: '未命名文章',
    theme: '新墨绿·新绿',
    content: '# 新文章\n\n开始写作...\n',
    createdAt: now,
    updatedAt: now
  }
  emit('newArticle', newItem)
}

function handleSelect(item: HistoryItem): void {
  // 如果点击的是当前文章，不做任何操作
  if (item.id === props.currentId) return
  emit('select', item)
}

function handleDelete(item: HistoryItem): void {
  if (props.history.length <= 1) {
    alert('至少保留一篇文章')
    return
  }
  if (confirm(`确定要删除 "${item.title}" 吗？`)) {
    emit('delete', item)
  }
}

function startRename(item: HistoryItem): void {
  renamingId.value = item.id
  renameOrigTitle.value = item.title
  nextTick(() => {
    const inputs = document.querySelectorAll('.rename-input')
    // 找到对应项的输入框并聚焦
    if (inputs.length > 0) {
      const input = inputs[inputs.length - 1] as HTMLInputElement
      input.focus()
      input.select()
    }
  })
}

function confirmRename(item: HistoryItem): void {
  if (renamingId.value !== item.id) return
  const input = document.querySelector('.renaming .rename-input') as HTMLInputElement
  const newTitle = input?.value?.trim() || ''
  if (newTitle && newTitle !== renameOrigTitle.value) {
    emit('rename', item, newTitle)
  }
  renamingId.value = null
  renameOrigTitle.value = ''
}

function cancelRename(): void {
  renamingId.value = null
  renameOrigTitle.value = ''
}

function openGitHub(): void {
  window.open('https://github.com/zhijiantv/XuMD', '_blank')
}
</script>

<style scoped>
.sidebar {
  width: 220px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  --sidebar-bg: #f8fafc;
  --sidebar-border: #e5e7eb;
  --sidebar-text: #111827;
  --sidebar-sub-text: #6b7280;
  --sidebar-hover: #e5e7eb;
  --sidebar-active: #dcfce7;
  --sidebar-active-text: #065f46;
  --sidebar-search-bg: #fff;
  --sidebar-search-border: #e5e7eb;
  --sidebar-item-bg-hover: #f1f5f9;
  background: var(--sidebar-bg);
  border-right: 1px solid var(--sidebar-border);
  transition: width 0.2s ease;
  min-height: 0;
}

.sidebar.collapsed {
  width: 48px;
  align-items: center;
  padding-top: 12px;
}

.sidebar.dark {
  --sidebar-bg: #0f172a;
  --sidebar-border: #1e293b;
  --sidebar-text: #d1d5db;
  --sidebar-sub-text: #6b7280;
  --sidebar-hover: #1e293b;
  --sidebar-active: #064e3b;
  --sidebar-active-text: #6ee7b7;
  --sidebar-search-bg: #1e293b;
  --sidebar-search-border: #334155;
  --sidebar-item-bg-hover: #1e293b;
}

.sidebar-collapsed-header {
  display: flex;
  justify-content: center;
  padding: 8px 0;
}

.collapse-toggle {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 6px;
  color: var(--sidebar-sub-text, #6b7280);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.collapse-toggle:hover {
  background: var(--sidebar-hover, #e5e7eb);
  color: var(--sidebar-text, #374151);
}

.sidebar.dark .collapse-toggle:hover {
  background: var(--sidebar-hover, #1e293b);
  color: #e2e8f0;
}

.collapse-toggle svg {
  width: 16px;
  height: 16px;
}

.sidebar-top {
  padding: 14px 12px 12px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.new-article-btn {
  flex: 1;
  padding: 9px 14px;
  background: #10b981;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;
}

.new-article-btn:hover {
  background: #059669;
}

.new-article-btn svg {
  width: 16px;
  height: 16px;
}

.collapse-toggle-right {
  width: 28px;
  height: 34px;
  flex-shrink: 0;
}

.history-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 0 12px;
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  flex-shrink: 0;
}

.history-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--sidebar-sub-text, #6b7280);
  letter-spacing: 0.04em;
}

.history-count {
  font-size: 10px;
  color: var(--sidebar-sub-text, #9ca3af);
  background: var(--sidebar-hover, #e5e7eb);
  padding: 1px 6px;
  border-radius: 10px;
}

.sidebar.dark .history-count {
  background: #1e293b;
  color: #64748b;
}

.history-search {
  position: relative;
  margin-bottom: 10px;
  flex-shrink: 0;
}

.history-search svg {
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 14px;
  height: 14px;
  color: var(--sidebar-sub-text, #9ca3af);
}

.search-input {
  width: 100%;
  height: 30px;
  padding: 0 10px 0 28px;
  border: 1px solid var(--sidebar-search-border, #e5e7eb);
  border-radius: 6px;
  font-size: 12px;
  background: var(--sidebar-search-bg, #fff);
  color: var(--sidebar-text, #374151);
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.sidebar.dark .search-input {
  color: #e2e8f0;
}

.search-input::placeholder {
  color: var(--sidebar-sub-text, #9ca3af);
}

.search-input:focus {
  border-color: #10b981;
}

.history-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.history-item {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
}

.history-item:hover {
  background: var(--sidebar-item-bg-hover, #f1f5f9);
}

.sidebar.dark .history-item:hover {
  background: var(--sidebar-item-bg-hover, #1e293b);
}

.history-item.active {
  background: #d1fae5;
}

.sidebar.dark .history-item.active {
  background: var(--sidebar-active, #064e3b);
}

.history-item-main {
  flex: 1;
  min-width: 0;
}

.history-time {
  font-size: 10px;
  color: var(--sidebar-sub-text, #9ca3af);
  margin-bottom: 3px;
}

.history-title-text {
  font-size: 12px;
  font-weight: 600;
  color: var(--sidebar-text, #111827);
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar.dark .history-title-text {
  color: #e2e8f0;
}

.history-item.active .history-title-text {
  color: #065f46;
}

.sidebar.dark .history-item.active .history-title-text {
  color: var(--sidebar-active-text, #6ee7b7);
}

.history-theme {
  font-size: 10px;
  color: var(--sidebar-sub-text, #6b7280);
}

/* 重命名输入框 */
.rename-input {
  width: 100%;
  font-size: 12px;
  font-weight: 600;
  color: var(--sidebar-text, #111827);
  padding: 2px 6px;
  margin-bottom: 2px;
  border: 1px solid #3b82f6;
  border-radius: 4px;
  outline: none;
  background: #fff;
  box-sizing: border-box;
}

.sidebar.dark .rename-input {
  color: #e2e8f0;
  background: #1e293b;
  border-color: #3b82f6;
}

.history-item.active .history-theme {
  color: #059669;
}

.sidebar.dark .history-item.active .history-theme {
  color: #34d399;
}

.history-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.15s;
  flex-shrink: 0;
}

.history-item:hover .history-actions {
  opacity: 1;
}

.action-btn {
  width: 22px;
  height: 22px;
  border: none;
  background: transparent;
  border-radius: 4px;
  color: var(--sidebar-sub-text, #9ca3af);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.action-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: var(--sidebar-text, #374151);
}

.sidebar.dark .action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #e2e8f0;
}

.action-btn.delete-btn:hover {
  color: #ef4444;
}

.action-btn svg {
  width: 13px;
  height: 13px;
}

.history-empty {
  text-align: center;
  color: var(--sidebar-sub-text, #9ca3af);
  font-size: 12px;
  padding: 30px 0;
}

.sidebar-footer {
  padding: 10px 12px;
  border-top: 1px solid var(--sidebar-border, #e5e7eb);
  flex-shrink: 0;
}

.footer-brand {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 8px;
}

.footer-logo {
  font-size: 12px;
  font-weight: 700;
  color: var(--sidebar-text, #111827);
}

.sidebar.dark .footer-logo {
  color: #e2e8f0;
}

.footer-version {
  font-size: 10px;
  color: var(--sidebar-sub-text, #9ca3af);
}

.footer-actions {
  display: flex;
  align-items: center;
  gap: 2px;
}

.footer-icon-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 6px;
  color: var(--sidebar-sub-text, #6b7280);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.footer-icon-btn:hover {
  background: var(--sidebar-hover, #e5e7eb);
  color: var(--sidebar-text, #374151);
}

.sidebar.dark .footer-icon-btn:hover {
  background: var(--sidebar-hover, #1e293b);
  color: #e2e8f0;
}

.footer-icon-btn svg {
  width: 16px;
  height: 16px;
}
</style>
