<template>
  <div
    class="editor-pane"
    :class="{ dark: isDark, dragover: isDragging }"
    @dragover.prevent="onDragOver"
    @drop.prevent="onDrop"
  >
    <div class="editor-wrapper">
      <div class="line-numbers" ref="lineNumbersRef">
        <div
          v-for="n in lineCount"
          :key="n"
          class="line-num"
          :class="{ 'line-active': n === cursorLine }"
        >{{ n }}</div>
      </div>
      <textarea
        ref="textareaRef"
        class="md-textarea"
        :value="modelValue"
        @input="onInput"
        @keydown="onKeydown"
        @scroll="onTextareaScroll"
        @paste="onPaste"
        spellcheck="false"
        :placeholder="placeholderText"
      ></textarea>
    </div>

    <!-- 隐藏的文件 input -->
    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      multiple
      style="display: none"
      @change="onFileChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useImageUpload } from '../composables/useImageUpload'

const props = defineProps<{
  modelValue: string
  isDark?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'insertText', text: string): void
  (e: 'scroll', scrollTop: number, scrollHeight: number, clientHeight: number): void
}>()

const textareaRef = ref<HTMLTextAreaElement | null>(null)
const lineNumbersRef = ref<HTMLDivElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const cursorLine = ref(1)
const isDragging = ref(false)

const { handleFiles, handleDrop } = useImageUpload()

const placeholderText = `在这里写 Markdown...

支持语法：
# 标题
**加粗**  ==高亮==
:::tip 提示标题
提示内容
:::
- 无序列表
1. 有序列表
> 引用
\`代码\`
`

const lineCount = computed(() => {
  return props.modelValue ? props.modelValue.split('\n').length : 1
})

const charCount = computed(() => {
  return props.modelValue ? props.modelValue.length : 0
})
// 暴露给外部使用
void charCount

// ============================================================
// 输入处理
// ============================================================

function onInput(e: Event): void {
  const target = e.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
  updateCursorLine(target)
}

function onKeydown(e: KeyboardEvent): void {
  const textarea = textareaRef.value
  if (!textarea) return

  // Tab 键：插入两个空格
  if (e.key === 'Tab') {
    e.preventDefault()
    insertAtCursor('  ')
    return
  }

  // Enter 键：自动缩进
  if (e.key === 'Enter') {
    const start = textarea.selectionStart
    const value = textarea.value
    const lineStart = value.lastIndexOf('\n', start - 1) + 1
    const currentLine = value.slice(lineStart, start)

    // 匹配列表前缀
    const listMatch = currentLine.match(/^(\s*)([-*+]|\d+\.)\s/)
    if (listMatch) {
      e.preventDefault()
      const indent = listMatch[1] + listMatch[2] + ' '
      insertAtCursor('\n' + indent)
      return
    }

    // 匹配引用前缀
    const quoteMatch = currentLine.match(/^(\s*)>\s/)
    if (quoteMatch) {
      e.preventDefault()
      insertAtCursor('\n' + quoteMatch[1] + '> ')
      return
    }
  }

  // Ctrl/Cmd + S：保存（这里只是提示，实际已自动保存）
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    // 内容已自动保存
    return
  }
}

function insertAtCursor(text: string): void {
  const textarea = textareaRef.value
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const value = textarea.value

  const newValue = value.slice(0, start) + text + value.slice(end)
  emit('update:modelValue', newValue)

  // 更新光标位置
  nextTick(() => {
    textarea.selectionStart = textarea.selectionEnd = start + text.length
    textarea.focus()
    updateCursorLine(textarea)
  })
}

function updateCursorLine(textarea: HTMLTextAreaElement): void {
  const pos = textarea.selectionStart
  const text = textarea.value.slice(0, pos)
  cursorLine.value = text.split('\n').length
}

// ============================================================
// 滚动同步
// ============================================================

let isSyncingScroll = false

function syncScroll(): void {
  const textarea = textareaRef.value
  const lineNumbers = lineNumbersRef.value
  if (!textarea || !lineNumbers) return
  lineNumbers.scrollTop = textarea.scrollTop
}

function onTextareaScroll(): void {
  syncScroll()
  if (isSyncingScroll) return
  const textarea = textareaRef.value
  if (!textarea) return
  emit('scroll', textarea.scrollTop, textarea.scrollHeight, textarea.clientHeight)
}

// 由外部控制滚动到指定比例
function scrollToRatio(ratio: number): void {
  const textarea = textareaRef.value
  if (!textarea || isSyncingScroll) return
  isSyncingScroll = true
  const maxScroll = textarea.scrollHeight - textarea.clientHeight
  textarea.scrollTop = Math.max(0, Math.min(1, ratio)) * maxScroll
  syncScroll()
  requestAnimationFrame(() => {
    isSyncingScroll = false
  })
}

// ============================================================
// 图片上传相关
// ============================================================

function triggerFileInput(): void {
  fileInputRef.value?.click()
}

async function onFileChange(e: Event): Promise<void> {
  const target = e.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return
  await insertImagesFromFiles(target.files)
  target.value = '' // 重置，允许重复选择同一文件
}

async function onDrop(e: DragEvent): Promise<void> {
  isDragging.value = false
  const mdImages = await handleDrop(e)
  if (mdImages.length > 0) {
    insertAtCursor('\n' + mdImages.join('\n') + '\n')
  }
}

function onDragOver(e: DragEvent): void {
  isDragging.value = true
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'copy'
  }
}

async function onPaste(e: ClipboardEvent): Promise<void> {
  const items = e.clipboardData?.items
  if (!items) return

  const imageFiles: File[] = []
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) imageFiles.push(file)
    }
  }

  if (imageFiles.length > 0) {
    e.preventDefault()
    await insertImagesFromFiles(imageFiles)
  }
}

async function insertImagesFromFiles(files: FileList | File[]): Promise<void> {
  const mdImages = await handleFiles(files)
  if (mdImages.length > 0) {
    insertAtCursor('\n' + mdImages.join('\n') + '\n')
  }
}

// ============================================================
// 暴露方法给父组件
// ============================================================

defineExpose({
  insertAtCursor,
  triggerFileInput,
  focus: () => textareaRef.value?.focus(),
  getTextarea: () => textareaRef.value,
  scrollToRatio
})

onMounted(() => {
  if (textareaRef.value) {
    updateCursorLine(textareaRef.value)
    textareaRef.value.addEventListener('scroll', onTextareaScroll, { passive: true })
  }
})

onBeforeUnmount(() => {
  textareaRef.value?.removeEventListener('scroll', onTextareaScroll)
})
</script>

<style scoped>
.editor-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  background: var(--editor-bg, #fff);
  position: relative;
  overflow: hidden;
}

.editor-pane.dark {
  --editor-bg: #0f172a;
  --editor-text: #e5e7eb;
  --editor-placeholder: #475569;
  --line-number-bg: #1e293b;
  --line-number-color: #64748b;
  --line-number-active: #e5e7eb;
  --editor-border: #334155;
}

.editor-wrapper {
  flex: 1;
  display: flex;
  min-height: 0;
  position: relative;
  overflow: hidden;
}

.line-numbers {
  width: 48px;
  flex-shrink: 0;
  padding: 12px 0;
  text-align: right;
  overflow: hidden;
  background: var(--line-number-bg, #f9fafb);
  border-right: 1px solid var(--editor-border, #e5e7eb);
  color: var(--line-number-color, #9ca3af);
  font-family: 'SF Mono', Consolas, Monaco, monospace;
  font-size: 12px;
  line-height: 1.6;
  user-select: none;
}

.line-num {
  padding: 0 10px 0 0;
  height: 19.2px; /* 12px * 1.6 */
}

.line-active {
  color: var(--line-number-active, #374151);
  font-weight: 600;
}

.md-textarea {
  flex: 1;
  width: 100%;
  min-height: 0;
  padding: 12px 16px;
  border: none;
  outline: none;
  resize: none;
  background: var(--editor-bg, #fff);
  color: var(--editor-text, #111827);
  font-family: 'SF Mono', Consolas, Monaco, 'Microsoft YaHei', monospace;
  font-size: 13px;
  line-height: 1.6;
  tab-size: 2;
  overflow-y: auto;
}

.md-textarea::placeholder {
  color: var(--editor-placeholder, #d1d5db);
}

/* 拖拽提示 */
.editor-pane.dragover::after {
  content: '松开鼠标插入图片';
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(59, 130, 246, 0.1);
  border: 2px dashed #3b82f6;
  color: #3b82f6;
  font-size: 16px;
  font-weight: 600;
  z-index: 10;
  pointer-events: none;
}
</style>
