<template>
  <div v-if="visible" class="modal-overlay" @click.self="handleClose">
    <div class="modal" :class="{ dark: isDark }">
      <div class="modal-header">
        <h3 class="modal-title">存储模式</h3>
        <button class="modal-close" @click="handleClose">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="modal-body">
        <p class="modal-desc">选择文章的存储位置，切换后当前文章会自动保存。</p>

        <div class="storage-options">
          <div
            v-for="opt in storageOptions"
            :key="opt.type"
            class="storage-option"
            :class="{ active: currentType === opt.type, disabled: opt.disabled }"
            @click="selectOption(opt)"
          >
            <div class="option-icon">
              <svg v-html="opt.icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></svg>
            </div>
            <div class="option-info">
              <div class="option-name">{{ opt.name }}</div>
              <div class="option-desc">{{ opt.desc }}</div>
            </div>
            <div v-if="currentType === opt.type" class="option-check">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div v-else-if="opt.recommended" class="option-badge recommend">推荐</div>
            <div v-else-if="opt.type === 'filesystem' && !fsSupported" class="option-badge">不支持</div>
          </div>
        </div>

        <div v-if="currentType === 'filesystem'" class="fs-hint">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <span>已连接本地文件夹，文章实时同步到本地 .md 文件</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface StorageOption {
  type: string
  name: string
  desc: string
  icon: string
  disabled?: boolean
  recommended?: boolean
}

const props = defineProps<{
  visible: boolean
  isDark: boolean
  currentType: string
}>()

const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void
  (e: 'change', type: string): void
  (e: 'pickFolder'): void
}>()

const storageOptions: StorageOption[] = [
  {
    type: 'indexeddb',
    name: '浏览器存储（推荐）',
    desc: '文章保存在浏览器 IndexedDB 中，容量大、关闭网页不丢内容（复刻 WeMD 存储模式），清除浏览器数据会丢失。',
    icon: '<ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>',
    recommended: true
  },
  {
    type: 'localStorage',
    name: '浏览器本地存储（兼容旧版）',
    desc: '文章保存在浏览器 localStorage 中，容量较小，内容过大（如含大图）可能保存失败。仅用于兼容旧数据。',
    icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline>'
  },
  {
    type: 'filesystem',
    name: '本地文件夹',
    desc: '直接读写你授权的本地文件夹中的 Markdown 文件，数据完全在你电脑上。',
    icon: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>'
  }
]

const fsSupported = typeof (window as any).showDirectoryPicker === 'function'

function handleClose(): void {
  emit('update:visible', false)
}

function selectOption(opt: StorageOption): void {
  if (opt.type === props.currentType) return

  if (opt.type === 'filesystem') {
    if (!fsSupported) return
    // 文件系统模式需要先选择文件夹
    emit('pickFolder')
    return
  }

  emit('change', opt.type)
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal {
  width: 480px;
  max-width: 90vw;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  animation: slideUp 0.25s ease;
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.modal.dark {
  background: #1e293b;
  color: #e2e8f0;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal.dark .modal-header {
  border-bottom-color: #334155;
}

.modal-title {
  font-size: 15px;
  font-weight: 600;
  margin: 0;
  color: #111827;
}

.modal.dark .modal-title {
  color: #f1f5f9;
}

.modal-close {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 6px;
  color: #9ca3af;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.modal-close:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal.dark .modal-close:hover {
  background: #334155;
  color: #e2e8f0;
}

.modal-close svg {
  width: 16px;
  height: 16px;
}

.modal-body {
  padding: 20px;
}

.modal-desc {
  font-size: 12px;
  color: #6b7280;
  margin: 0 0 16px 0;
  line-height: 1.6;
}

.modal.dark .modal-desc {
  color: #94a3b8;
}

.storage-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.storage-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  position: relative;
}

.storage-option:hover {
  border-color: #10b981;
  background: #f0fdf4;
}

.modal.dark .storage-option {
  border-color: #334155;
  background: #0f172a;
}

.modal.dark .storage-option:hover {
  border-color: #10b981;
  background: #064e3b;
}

.storage-option.active {
  border-color: #10b981;
  background: #ecfdf5;
}

.modal.dark .storage-option.active {
  background: #064e3b;
}

.storage-option.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.storage-option.disabled:hover {
  border-color: #e5e7eb;
  background: transparent;
}

.modal.dark .storage-option.disabled:hover {
  border-color: #334155;
  background: #0f172a;
}

.option-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #dcfce7;
  color: #065f46;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.modal.dark .option-icon {
  background: #064e3b;
  color: #6ee7b7;
}

.option-icon svg {
  width: 18px;
  height: 18px;
}

.option-info {
  flex: 1;
  min-width: 0;
}

.option-name {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 3px;
}

.modal.dark .option-name {
  color: #f1f5f9;
}

.option-desc {
  font-size: 11px;
  color: #6b7280;
  line-height: 1.5;
}

.modal.dark .option-desc {
  color: #94a3b8;
}

.option-check {
  color: #10b981;
  flex-shrink: 0;
}

.option-check svg {
  width: 18px;
  height: 18px;
}

.option-badge {
  font-size: 10px;
  padding: 2px 8px;
  background: #f3f4f6;
  color: #9ca3af;
  border-radius: 10px;
  font-weight: 500;
}

.option-badge.recommend {
  background: #dcfce7;
  color: #065f46;
}

.modal.dark .option-badge.recommend {
  background: #064e3b;
  color: #6ee7b7;
}

.modal.dark .option-badge {
  background: #334155;
  color: #94a3b8;
}

.fs-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding: 10px 12px;
  background: #ecfdf5;
  border-radius: 6px;
  font-size: 11px;
  color: #065f46;
  line-height: 1.5;
}

.modal.dark .fs-hint {
  background: #064e3b;
  color: #6ee7b7;
}

.fs-hint svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}
</style>
