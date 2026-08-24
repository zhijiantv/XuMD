<template>
  <div class="mobile-toolbar" :class="{ dark: isDark }">
    <!-- 左侧：编辑/预览 Tab 切换 -->
    <div class="mobile-toolbar-tabs">
      <button
        class="mobile-tab"
        :class="{ active: activeView === 'editor' }"
        @click="$emit('view-change', 'editor')"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 20h9"/>
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
        </svg>
        <span>编辑</span>
      </button>
      <button
        class="mobile-tab"
        :class="{ active: activeView === 'preview' }"
        @click="$emit('view-change', 'preview')"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        <span>预览</span>
      </button>
    </div>

    <!-- 右侧：操作按钮 -->
    <div class="mobile-toolbar-actions">
      <button class="mobile-action-btn primary" @click="showCopyWarn = true" title="复制到公众号">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
      </button>
      <button class="mobile-action-btn" @click="showMenu = !showMenu" title="更多">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="1"/>
          <circle cx="19" cy="12" r="1"/>
          <circle cx="5" cy="12" r="1"/>
        </svg>
      </button>
    </div>

    <!-- 更多菜单 -->
    <div v-if="showMenu" class="mobile-menu-overlay" @click.self="showMenu = false">
      <div class="mobile-menu-panel">
        <button class="mobile-menu-item" @click="handleCopyHtml">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="16 18 22 12 16 6"/>
            <polyline points="8 6 2 12 8 18"/>
          </svg>
          <span>复制 HTML</span>
        </button>
        <button class="mobile-menu-item" @click="handleOpenTheme">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="13.5" cy="6.5" r=".5"/>
            <circle cx="17.5" cy="10.5" r=".5"/>
            <circle cx="8.5" cy="7.5" r=".5"/>
            <circle cx="6.5" cy="12.5" r=".5"/>
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
          </svg>
          <span>主题管理</span>
        </button>
        <button class="mobile-menu-item" @click="handleOpenStorage">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
          <span>存储模式</span>
        </button>
        <button class="mobile-menu-item" @click="handleOpenImageHost">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          <span>图床设置</span>
        </button>
      </div>
    </div>

    <!-- 移动端复制警告弹窗：仅在移动端点击"复制到公众号"时出现，
         确认后才执行真正的复制（emit copy-wechat），电脑端不受影响 -->
    <div v-if="showCopyWarn" class="copy-warn-overlay" @click.self="showCopyWarn = false">
      <div class="copy-warn-modal">
        <div class="copy-warn-icon">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <p class="copy-warn-text">
          移动端复制到公众号助手会丢失样式，<br />推荐在 PC 端操作
        </p>
        <div class="copy-warn-actions">
          <button class="copy-warn-btn cancel" @click="showCopyWarn = false">取消</button>
          <button class="copy-warn-btn confirm" @click="confirmCopy">仍要复制</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  isDark?: boolean
  activeView: 'editor' | 'preview'
}>()

const emit = defineEmits<{
  'view-change': [view: 'editor' | 'preview']
  'copy-wechat': []
  'copy-html': []
  'open-theme': []
  'open-storage': []
  'open-image-host': []
}>()

const showMenu = ref(false)
// 移动端"复制到公众号"警告弹窗状态
const showCopyWarn = ref(false)

function handleCopyHtml() {
  showMenu.value = false
  emit('copy-html')
}

// 弹窗中点击"仍要复制"才真正触发复制（emit 给父组件执行）
function confirmCopy() {
  showCopyWarn.value = false
  emit('copy-wechat')
}

function handleOpenTheme() {
  showMenu.value = false
  emit('open-theme')
}

function handleOpenStorage() {
  showMenu.value = false
  emit('open-storage')
}

function handleOpenImageHost() {
  showMenu.value = false
  emit('open-image-host')
}
</script>

<style scoped>
.mobile-toolbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  padding-bottom: env(safe-area-inset-bottom, 0px);
  background: #ffffff;
  border-top: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  z-index: 200;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.mobile-toolbar.dark {
  background: #1e293b;
  border-color: #334155;
}

.mobile-toolbar-tabs {
  display: flex;
  align-items: center;
  background: #f1f5f9;
  border-radius: 12px;
  padding: 4px;
  gap: 4px;
}

.mobile-toolbar.dark .mobile-toolbar-tabs {
  background: #334155;
}

.mobile-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  background: transparent;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mobile-tab.active {
  background: #ffffff;
  color: #0f172a;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.mobile-toolbar.dark .mobile-tab {
  color: #94a3b8;
}

.mobile-toolbar.dark .mobile-tab.active {
  background: #0f172a;
  color: #f1f5f9;
}

.mobile-toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mobile-action-btn {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: none;
  background: #f1f5f9;
  color: #475569;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mobile-action-btn:active {
  transform: scale(0.95);
}

.mobile-toolbar.dark .mobile-action-btn {
  background: #334155;
  color: #cbd5e1;
}

.mobile-action-btn.primary {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #ffffff;
}

.mobile-toolbar.dark .mobile-action-btn.primary {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #ffffff;
}

/* 更多菜单 */
.mobile-menu-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 300;
  display: flex;
  align-items: flex-end;
  animation: fadeIn 0.2s ease;
}

.mobile-menu-panel {
  width: 100%;
  background: #ffffff;
  border-radius: 16px 16px 0 0;
  padding: 12px 0;
  padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
  animation: slideUp 0.25s ease;
}

.mobile-toolbar.dark .mobile-menu-panel {
  background: #1e293b;
}

.mobile-menu-item {
  width: 100%;
  padding: 14px 20px;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 15px;
  color: #1e293b;
  cursor: pointer;
  transition: background 0.15s ease;
}

.mobile-toolbar.dark .mobile-menu-item {
  color: #e2e8f0;
}

.mobile-menu-item:active {
  background: #f1f5f9;
}

.mobile-toolbar.dark .mobile-menu-item:active {
  background: #334155;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

/* 复制警告弹窗 */
.copy-warn-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 400;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 32px;
  animation: fadeIn 0.2s ease;
}

.copy-warn-modal {
  width: 100%;
  max-width: 320px;
  background: #ffffff;
  border-radius: 16px;
  padding: 24px 20px 20px;
  text-align: center;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
  animation: popIn 0.22s ease;
}

.mobile-toolbar.dark .copy-warn-modal {
  background: #1e293b;
}

.copy-warn-icon {
  width: 54px;
  height: 54px;
  margin: 0 auto 14px;
  border-radius: 50%;
  background: #fef3c7;
  color: #f59e0b;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mobile-toolbar.dark .copy-warn-icon {
  background: #4d3b16;
  color: #fbbf24;
}

.copy-warn-text {
  margin: 0 0 20px;
  font-size: 14px;
  line-height: 1.7;
  color: #475569;
}

.mobile-toolbar.dark .copy-warn-text {
  color: #cbd5e1;
}

.copy-warn-actions {
  display: flex;
  gap: 12px;
}

.copy-warn-btn {
  flex: 1;
  height: 44px;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.copy-warn-btn:active {
  transform: scale(0.97);
}

.copy-warn-btn.cancel {
  background: #f1f5f9;
  color: #64748b;
}

.mobile-toolbar.dark .copy-warn-btn.cancel {
  background: #334155;
  color: #94a3b8;
}

.copy-warn-btn.confirm {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #ffffff;
}

@keyframes popIn {
  from { opacity: 0; transform: scale(0.85); }
  to { opacity: 1; transform: scale(1); }
}
</style>
