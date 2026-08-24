<template>
  <div class="quick-toolbar" :class="{ dark: isDark }" ref="toolbarRef">
    <!-- 左侧工具组 -->
    <div class="toolbar-group">
      <button
        v-for="tool in mainTools"
        :key="tool.action"
        class="tool-btn"
        :title="tool.name"
        @click="handleInsert(tool.action)"
      >
        <span class="tool-icon" v-html="tool.iconSvg"></span>
      </button>
    </div>

    <div class="toolbar-divider"></div>

    <!-- 标题下拉 -->
    <div class="toolbar-dropdown">
      <button
        class="tool-btn dropdown-trigger"
        :class="{ active: activeMenu === 'heading' }"
        title="标题"
        @click="toggleMenu('heading', $event)"
      >
        <span class="tool-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 12h12"/>
            <path d="M6 20h12"/>
            <path d="M12 4v16"/>
          </svg>
        </span>
      </button>
      <div
        v-if="activeMenu === 'heading'"
        class="dropdown-menu"
        :class="{ 'align-right': menuPos.align === 'right' }"
        :style="{ top: menuPos.top + 'px', left: menuPos.left + 'px' }"
      >
        <button
          v-for="opt in headingOptions"
          :key="opt.action"
          class="dropdown-item"
          @click="onDropdownInsert(opt.action)"
        >
          <span class="dropdown-label">{{ opt.name }}</span>
        </button>
      </div>
    </div>

    <!-- 列表下拉 -->
    <div class="toolbar-dropdown">
      <button
        class="tool-btn dropdown-trigger"
        :class="{ active: activeMenu === 'list' }"
        title="列表"
        @click="toggleMenu('list', $event)"
      >
        <span class="tool-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="8" y1="6" x2="21" y2="6"/>
            <line x1="8" y1="12" x2="21" y2="12"/>
            <line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6" x2="3.01" y2="6"/>
            <line x1="3" y1="12" x2="3.01" y2="12"/>
            <line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
        </span>
      </button>
      <div
        v-if="activeMenu === 'list'"
        class="dropdown-menu"
        :class="{ 'align-right': menuPos.align === 'right' }"
        :style="{ top: menuPos.top + 'px', left: menuPos.left + 'px' }"
      >
        <button
          v-for="opt in listOptions"
          :key="opt.action"
          class="dropdown-item"
          @click="onDropdownInsert(opt.action)"
        >
          <span class="dropdown-label">{{ opt.name }}</span>
        </button>
      </div>
    </div>

    <div class="toolbar-divider"></div>

    <!-- 右侧工具组 -->
    <div class="toolbar-group">
      <button
        v-for="tool in rightTools"
        :key="tool.action"
        class="tool-btn"
        :title="tool.name"
        @click="handleInsert(tool.action)"
      >
        <span class="tool-icon" v-html="tool.iconSvg"></span>
      </button>
    </div>

    <!-- 更多工具下拉 -->
    <div class="toolbar-dropdown more-dropdown">
      <button
        class="tool-btn dropdown-trigger more-btn"
        :class="{ active: activeMenu === 'more' }"
        title="更多工具"
        @click="toggleMenu('more', $event)"
      >
        <span class="tool-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="5" cy="12" r="1.5"/>
            <circle cx="12" cy="12" r="1.5"/>
            <circle cx="19" cy="12" r="1.5"/>
          </svg>
        </span>
      </button>
      <div
        v-if="activeMenu === 'more'"
        class="dropdown-menu more-menu"
        :class="{ 'align-right': menuPos.align === 'right' }"
        :style="{ top: menuPos.top + 'px', left: menuPos.left + 'px' }"
      >
        <div class="dropdown-section-title">更多工具</div>
        <button
          v-for="tool in moreTools"
          :key="tool.action"
          class="dropdown-item"
          @click="onMoreInsert(tool.action)"
        >
          <span class="dropdown-icon" v-html="tool.iconSvg"></span>
          <span class="dropdown-label">{{ tool.name }}</span>
        </button>
      </div>
    </div>

    <!-- 占位撑开 -->
    <div class="toolbar-spacer"></div>

    <div class="toolbar-divider"></div>

    <!-- 撤销 / 重做 -->
    <button
      class="tool-btn"
      title="撤回 (Ctrl+Z)"
      :disabled="!canUndo"
      @click="$emit('undo')"
    >
      <span class="tool-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 7v6h6"/>
          <path d="M3 13a9 9 0 1 0 3-7.7L3 8"/>
        </svg>
      </span>
    </button>
    <button
      class="tool-btn"
      title="重做 (Ctrl+Shift+Z)"
      :disabled="!canRedo"
      @click="$emit('redo')"
    >
      <span class="tool-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 7v6h-6"/>
          <path d="M21 13a9 9 0 1 1-3-7.7L21 8"/>
        </svg>
      </span>
    </button>

    <div class="toolbar-spacer"></div>

    <!-- 帮助按钮（始终可见） -->
    <button
      class="tool-btn help-btn"
      title="组件库 / 返回"
      @click="$emit('openHelp')"
    >
      <span class="tool-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </span>
      <span class="help-text">组件库</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  isDark?: boolean
  canUndo?: boolean
  canRedo?: boolean
}>()

const emit = defineEmits<{
  (e: 'insert', action: string): void
  (e: 'openHelp'): void
  (e: 'undo'): void
  (e: 'redo'): void
}>()

// 保留对 props 的引用，避免未使用告警
void props

const toolbarRef = ref<HTMLElement | null>(null)
const activeMenu = ref<'' | 'heading' | 'list' | 'more'>('')
const menuPos = ref<{ top: number; left: number; align: 'left' | 'right' }>({
  top: 0,
  left: 0,
  align: 'left'
})

// 打开下拉菜单：计算触发按钮位置，用 fixed 定位避免被编辑区遮挡 / overflow 裁剪
function openMenu(name: 'heading' | 'list' | 'more', event: MouseEvent): void {
  const btn = (event.currentTarget as HTMLElement)
  const rect = btn.getBoundingClientRect()
  // 菜单显示在按钮正下方，留出 6px 间隙
  const top = rect.bottom + 6
  let left = rect.left
  let align: 'left' | 'right' = 'left'
  // 右侧溢出视口时改为右对齐
  const estWidth = 150
  if (left + estWidth > window.innerWidth - 8) {
    left = rect.right - estWidth
    align = 'right'
  }
  menuPos.value = { top, left, align }
  activeMenu.value = name
}

function closeAll(): void {
  activeMenu.value = ''
}

// 点击页面任意位置时关闭下拉：
// - 点击触发器或菜单内部（.toolbar-dropdown 范围内）不关闭，由 toggleMenu / 菜单项自行处理
// - 点击其它区域则关闭
function onDocMouseDown(e: MouseEvent): void {
  const t = e.target as Node
  // 点击落在某个下拉（触发器或菜单）内部时，不在此处关闭，交给 toggleMenu 切换逻辑
  if (toolbarRef.value && t instanceof Node && toolbarRef.value.contains(t)) {
    const dropdown = (t as HTMLElement).closest('.toolbar-dropdown')
    if (dropdown) return
  }
  if (activeMenu.value) closeAll()
}

// 页面滚动或窗口尺寸变化时关闭下拉，避免 fixed 菜单错位
function onScrollOrResize(): void {
  if (activeMenu.value) closeAll()
}

// 切换下拉：一次点击打开，再次点击同一触发器关闭
function toggleMenu(name: 'heading' | 'list' | 'more', event: MouseEvent): void {
  event.stopPropagation()
  if (activeMenu.value === name) {
    closeAll()
  } else {
    openMenu(name, event)
  }
}

onMounted(() => {
  document.addEventListener('mousedown', onDocMouseDown)
  window.addEventListener('scroll', onScrollOrResize, true)
  window.addEventListener('resize', onScrollOrResize)
})
onUnmounted(() => {
  document.removeEventListener('mousedown', onDocMouseDown)
  window.removeEventListener('scroll', onScrollOrResize, true)
  window.removeEventListener('resize', onScrollOrResize)
})

function handleInsert(action: string): void {
  emit('insert', action)
  closeAll()
}

function onDropdownInsert(action: string): void {
  emit('insert', action)
  closeAll()
}

function onMoreInsert(action: string): void {
  emit('insert', action)
  closeAll()
}

// SVG 图标
const iconBold = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>'
const iconItalic = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>'
const iconHighlight = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>'
const iconStrike = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.3 4.90002C15.4206 3.3737 12.9503 2.71477 10.57 3.06002C8.19 3.41002 6.05 4.76002 4.7 6.80002C3.35 8.84002 2.9 11.4 3.4 13.82C3.9 16.24 5.32 18.4 7.4 19.85C9.48 21.3 12.04 21.97 14.58 21.72C17.12 21.47 19.48 20.31 21.3 18.4"/><path d="M3 12H21"/></svg>'
const iconCode = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>'
const iconLink = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>'
const iconImage = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>'
const iconQuote = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c1.25 0 1.25 0 1.25 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/></svg>'
const iconCodeBlock = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="m10 9-3 3 3 3"/><path d="m14 9 3 3-3 3"/></svg>'
const iconHr = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>'

// 主工具栏（左侧显示）
const mainTools = [
  { name: '加粗', action: 'bold', iconSvg: iconBold },
  { name: '斜体', action: 'italic', iconSvg: iconItalic },
  { name: '高亮', action: 'highlight', iconSvg: iconHighlight },
  { name: '删除线', action: 'strikethrough', iconSvg: iconStrike },
  { name: '行内代码', action: 'inlineCode', iconSvg: iconCode },
]

// 右侧工具组
const rightTools = [
  { name: '引用', action: 'quote', iconSvg: iconQuote },
  { name: '代码块', action: 'codeBlock', iconSvg: iconCodeBlock },
  { name: '分割线', action: 'hr', iconSvg: iconHr },
]

// 更多工具（下拉中显示）
const moreTools = [
  { name: '链接', action: 'link', iconSvg: iconLink },
  { name: '图片', action: 'image', iconSvg: iconImage },
]

// 标题下拉选项
const headingOptions = [
  { name: '一级标题', action: 'h1' },
  { name: '二级标题', action: 'heading' },
  { name: '三级标题', action: 'h3' },
]

// 列表下拉选项
const listOptions = [
  { name: '无序列表', action: 'ul' },
  { name: '有序列表', action: 'ol' },
  { name: '任务列表', action: 'taskList' },
]
</script>

<style scoped>
.quick-toolbar {
  display: flex;
  align-items: center;
  min-height: 40px;
  padding: 4px 8px;
  background: var(--toolbar-bg, #ffffff);
  border-bottom: 1px solid var(--toolbar-border, #e5e7eb);
  flex-wrap: nowrap;
  gap: 2px;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.quick-toolbar::-webkit-scrollbar {
  display: none;
}

.quick-toolbar.dark {
  --toolbar-bg: #0f172a;
  --toolbar-border: #334155;
  --toolbar-text: #94a3b8;
  --toolbar-hover-bg: rgba(71, 85, 105, 0.5);
  --toolbar-hover-text: #f1f5f9;
  --dropdown-bg: #1e293b;
  --dropdown-border: #334155;
  --dropdown-text: #e2e8f0;
  --dropdown-hover-bg: rgba(71, 85, 105, 0.5);
  --dropdown-section-title: #64748b;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 1px;
}

.tool-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 4px;
  color: var(--toolbar-text, #6b7280);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.12s;
  flex-shrink: 0;
  padding: 0;
}

.tool-btn:hover {
  background: var(--toolbar-hover-bg, #f3f4f6);
  color: var(--toolbar-hover-text, #374151);
}

.quick-toolbar.dark .tool-btn:hover {
  background: var(--toolbar-hover-bg);
  color: var(--toolbar-hover-text);
}

.tool-btn.active {
  background: var(--toolbar-hover-bg, #e5e7eb);
  color: var(--toolbar-hover-text, #111827);
}

.quick-toolbar.dark .tool-btn.active {
  background: var(--toolbar-hover-bg);
  color: var(--toolbar-hover-text);
}

.tool-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.tool-btn:disabled:hover {
  background: transparent;
  color: var(--toolbar-text, #6b7280);
}

.quick-toolbar.dark .tool-btn:disabled:hover {
  background: transparent;
  color: var(--toolbar-text);
}

.tool-icon {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tool-icon :deep(svg) {
  width: 16px;
  height: 16px;
}

.toolbar-divider {
  width: 1px;
  height: 16px;
  background: var(--toolbar-border, #e5e7eb);
  margin: 0 4px;
  flex-shrink: 0;
}

.quick-toolbar.dark .toolbar-divider {
  background: var(--toolbar-border);
}

.toolbar-spacer {
  flex: 1;
  min-width: 8px;
}

.toolbar-dropdown {
  position: relative;
  flex-shrink: 0;
}

.dropdown-trigger {
  position: relative;
}

.dropdown-menu {
  position: fixed;
  min-width: 140px;
  background: var(--dropdown-bg, #fff);
  border: 1px solid var(--dropdown-border, #e5e7eb);
  border-radius: 6px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  z-index: 99999;
  padding: 4px;
}

.quick-toolbar.dark .dropdown-menu {
  background: var(--dropdown-bg);
  border-color: var(--dropdown-border);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.dropdown-item {
  width: 100%;
  padding: 6px 10px;
  border: none;
  background: transparent;
  border-radius: 4px;
  font-size: 12px;
  color: var(--dropdown-text, #374151);
  cursor: pointer;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.12s;
  white-space: nowrap;
}

.quick-toolbar.dark .dropdown-item {
  color: var(--dropdown-text);
}

.dropdown-item:hover {
  background: var(--dropdown-hover-bg, #f3f4f6);
}

.quick-toolbar.dark .dropdown-item:hover {
  background: var(--dropdown-hover-bg);
}

.dropdown-icon {
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--dropdown-text, #6b7280);
}

.dropdown-icon :deep(svg) {
  width: 14px;
  height: 14px;
}

.dropdown-label {
  flex: 1;
}

.dropdown-section-title {
  font-size: 10px;
  font-weight: 600;
  color: var(--dropdown-section-title, #9ca3af);
  padding: 6px 10px 4px;
  letter-spacing: 0.04em;
}

.quick-toolbar.dark .dropdown-section-title {
  color: var(--dropdown-section-title);
}

.more-menu {
  min-width: 130px;
}

/* 右对齐：JS 已把 left 设为按钮右侧 - 菜单宽度，这里仅作视觉确认 */
.dropdown-menu.align-right {
  /* left 由 :style 内联控制 */
}

/* 帮助按钮 */
.help-btn {
  width: auto;
  padding: 0 10px;
  gap: 4px;
  font-size: 11px;
  font-weight: 500;
  color: var(--toolbar-text, #6b7280);
}

.help-text {
  font-size: 11px;
}

.help-btn:hover {
  color: #10b981;
}

.more-btn {
  position: relative;
}

/* 移动端适配 */
@media (max-width: 640px) {
  .quick-toolbar {
    padding: 6px 8px;
    gap: 2px;
    /* 换行排列：所有按钮可见，不被父级 overflow:hidden 裁剪 */
    flex-wrap: wrap;
    overflow-x: visible;
    overflow-y: visible;
    min-height: auto;
  }

  .tool-btn {
    width: 32px;
    height: 32px;
  }

  .toolbar-divider {
    margin: 0 2px;
    height: 20px;
    align-self: center;
  }

  /* 占位撑开元素在移动端不占整行 */
  .toolbar-spacer {
    display: none;
  }

  .help-text {
    display: none;
  }

  .help-btn {
    padding: 0;
    width: 32px;
    height: 32px;
  }
}
</style>
