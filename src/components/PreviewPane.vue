<template>
  <div class="preview-pane" :class="{ dark: isDark }">
    <div class="pane-header">
      <span class="pane-title">实时预览</span>
      <span class="pane-subtitle">微信排版效果</span>
      <span class="pane-status">
        <span v-if="rendering" class="status-dot rendering"></span>
        <span v-else class="status-dot ready"></span>
        {{ rendering ? '渲染中...' : '已就绪' }}
      </span>
    </div>
    <div class="preview-container" ref="scrollContainer">
      <div
        class="preview-content"
        ref="previewRef"
        id="xumd-preview"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick, onBeforeUnmount } from 'vue'
import { generatePreviewCss } from '../xumd-gzh-render/css-inline-browser'
import { markComponentTypes, applyDarkMode } from '../utils/darkModePreview'
import type { ThemeTokens } from '../xumd-gzh-render/types'

const props = defineProps<{
  html: string
  tokens: ThemeTokens
  isDark: boolean
  syncScrollTarget?: HTMLElement | null
}>()

const emit = defineEmits<{
  (e: 'scroll', scrollTop: number, scrollHeight: number, clientHeight: number): void
}>()

const previewRef = ref<HTMLElement | null>(null)
const scrollContainer = ref<HTMLElement | null>(null)
const rendering = ref(false)
let renderTimer: ReturnType<typeof setTimeout> | null = null
let styleEl: HTMLStyleElement | null = null
let isSyncing = false

function updateDarkStyle(): void {
  applyDarkMode(previewRef.value as HTMLElement, props.isDark)
}

function renderPreview(): void {
  if (!previewRef.value) return
  rendering.value = true
  updatePreviewStyle()
  previewRef.value.innerHTML = props.html
  // 给预览内容添加组件类型标记并保存原始样式
  markComponentTypes(previewRef.value)
  // 如果当前是深色模式，立即应用深色样式
  if (props.isDark) {
    applyDarkMode(previewRef.value, true)
  }
  requestAnimationFrame(() => {
    rendering.value = false
  })
}


function updatePreviewStyle(): void {
  if (!previewRef.value) return
  if (!styleEl) {
    styleEl = document.createElement('style')
    styleEl.setAttribute('data-xumd-preview', '')
    document.head.appendChild(styleEl)
  }
  const css = generatePreviewCss(props.tokens)
  styleEl.textContent = css
}

function scheduleRender(): void {
  if (renderTimer) clearTimeout(renderTimer)
  renderTimer = setTimeout(() => {
    renderPreview()
  }, 150)
}

function scrollToRatio(ratio: number): void {
  if (!scrollContainer.value || isSyncing) return
  isSyncing = true
  const el = scrollContainer.value
  const maxScroll = el.scrollHeight - el.clientHeight
  el.scrollTop = maxScroll * ratio
  requestAnimationFrame(() => {
    isSyncing = false
  })
}

function onPreviewScroll(): void {
  if (isSyncing || !scrollContainer.value) return
  const el = scrollContainer.value
  emit('scroll', el.scrollTop, el.scrollHeight, el.clientHeight)
}

watch(
  () => props.html,
  () => {
    scheduleRender()
  }
)

watch(
  () => props.tokens,
  () => {
    updatePreviewStyle()
    renderPreview()
  },
  { deep: true }
)

watch(
  () => props.isDark,
  (newVal, oldVal) => {
    // 从深色切回浅色：直接重新渲染，彻底清除所有深色样式残留
    if (oldVal === true && newVal === false) {
      // 保存滚动位置
      const scrollTop = scrollContainer.value?.scrollTop ?? 0
      renderPreview()
      // 恢复滚动位置
      requestAnimationFrame(() => {
        if (scrollContainer.value) {
          scrollContainer.value.scrollTop = scrollTop
        }
      })
    } else {
      // 浅色切深色：应用深色样式
      updateDarkStyle()
    }
  }
)

onMounted(() => {
  nextTick(() => {
    updateDarkStyle()
    renderPreview()
    scrollContainer.value?.addEventListener('scroll', onPreviewScroll, { passive: true })
  })
})

onBeforeUnmount(() => {
  scrollContainer.value?.removeEventListener('scroll', onPreviewScroll)
})

defineExpose({
  scrollToRatio,
  getElement: () => previewRef.value
})
</script>

<style scoped>
.preview-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: var(--preview-pane-bg, #ffffff);
}

.preview-pane.dark {
  --preview-pane-bg: #242424;
  --preview-border: #3a3a3a;
  --pane-header-bg: #242424;
  --pane-title: #c3c3c3;
  --pane-subtitle-bg: #333333;
  --pane-subtitle-color: #8a8a8a;
  --pane-status: #8a8a8a;
  --preview-container-bg: #242424;
  --preview-content-bg: #242424;
}

.pane-header {
  min-height: 42px;
  padding: 0 18px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--pane-header-bg, #ffffff);
  border-bottom: 1px solid var(--preview-border, #e5e7eb);
  flex-shrink: 0;
}

.pane-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--pane-title, #6b7280);
  letter-spacing: 0.04em;
}

.pane-subtitle {
  font-size: 10px;
  color: var(--pane-subtitle-color, #9ca3af);
  padding: 2px 8px;
  background: var(--pane-subtitle-bg, #f3f4f6);
  border-radius: 5px;
  font-weight: 500;
}

.pane-status {
  margin-left: auto;
  font-size: 10px;
  color: var(--pane-status, #9ca3af);
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.ready {
  background: #10b981;
}

.status-dot.rendering {
  background: #f59e0b;
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* ============================================================ */
/* 预览容器 — 复刻 WeMD 风格（402px 固定宽度居中）                */
/* ============================================================ */

.preview-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-gutter: stable both-edges;
  padding: 0;
  background: var(--preview-container-bg, #ffffff);
}

.preview-content {
  box-sizing: border-box;
  width: 402px;
  flex-shrink: 0;
  margin: 0 auto;
  background: var(--preview-content-bg, #ffffff);
  padding: 44px 24px 80px;
  border-radius: 0;
  box-shadow: none;
  min-height: 100%;
  overflow: visible;
}

/* 确保内部 section 不超出宽度 */
.preview-content :deep(section) {
  max-width: 100% !important;
}

/* 图片自适应 */
.preview-content :deep(img) {
  max-width: 100% !important;
  height: auto !important;
  display: block;
}

/* 代码块不超出 */
.preview-content :deep(pre) {
  max-width: 100%;
  overflow-x: auto;
}

/* 段落重置：主题模板自带间距 */
.preview-content :deep(p) {
  margin: 0;
}

/* ============================================================ */
/* 深色模式 CSS 已移至 JS 全局注入（DARK_MODE_CSS）               */
/* 避免 scoped + :deep() 选择器与动态 class 配合失效问题          */
/* ============================================================ */

/* ============================================================ */
/* 响应式                                                         */
/* ============================================================ */
@media (max-width: 768px) {
  .preview-container {
    padding: 0;
  }

  .preview-content {
    width: 100%;
    padding: 28px 22px 72px;
  }
}
</style>
