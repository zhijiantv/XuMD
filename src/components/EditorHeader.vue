<template>
  <header class="editor-header" :class="{ dark: isDark, mobile: isMobile }">
    <div class="header-left">
      <div class="logo">
        <span class="logo-mark">
          <img :src="isDark ? '/logo-light.svg' : '/logo-dark.svg'" alt="XuMD" />
        </span>
        <span class="logo-text">XuMD</span>
      </div>

      <div class="header-menu">
        <button class="menu-item" @click="$emit('openStorage')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
          </svg>
          <span>存储模式</span>
        </button>
        <button class="menu-item" @click="$emit('openImageHost')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
          <span>图床设置</span>
        </button>
        <button class="menu-item" @click="$emit('openTheme')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="13.5" cy="6.5" r=".5"/>
            <circle cx="17.5" cy="10.5" r=".5"/>
            <circle cx="8.5" cy="7.5" r=".5"/>
            <circle cx="6.5" cy="12.5" r=".5"/>
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
          </svg>
          <span>文章主题</span>
        </button>
      </div>
    </div>

    <div class="header-right">
      <button class="header-icon-btn" :title="isDark ? '浅色模式' : '深色模式'" @click="$emit('toggleDark')">
        <svg v-if="isDark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      </button>

      <div v-if="!isMobile" class="header-divider"></div>

      <button v-if="!isMobile" class="header-btn-secondary" @click="$emit('copyHtml')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
        <span>复制 HTML</span>
      </button>

      <button v-if="!isMobile" class="header-btn-primary" @click="$emit('copyRichText')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
        </svg>
        <span>复制到公众号</span>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  isDark: boolean
  isMobile?: boolean
}>()

defineEmits<{
  (e: 'copyHtml'): void
  (e: 'copyRichText'): void
  (e: 'insertImage'): void
  (e: 'openStorage'): void
  (e: 'openImageHost'): void
  (e: 'openTheme'): void
  (e: 'openHelp'): void
  (e: 'toggleDark'): void
}>()
</script>

<style scoped>
.editor-header {
  height: 52px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--header-bg, #ffffff);
  border-bottom: 1px solid var(--header-border, #e5e7eb);
  flex-shrink: 0;
  position: relative;
  z-index: 10;
}

.editor-header.dark {
  --header-bg: #0f172a;
  --header-border: #1e293b;
  --header-text: #e2e8f0;
  --header-sub-text: #94a3b8;
  --header-btn-bg: #1e293b;
  --header-btn-hover: #334155;
  --header-btn-text: #e2e8f0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 6px;
}

.logo-mark {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #10b981;
}

.logo-mark img {
  width: 100%;
  height: 100%;
  display: block;
}

.logo-text {
  font-size: 15px;
  font-weight: 700;
  color: var(--header-text, #111827);
  letter-spacing: -0.02em;
}

.header-menu {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-left: 8px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 10px;
  border: none;
  background: transparent;
  border-radius: 6px;
  font-size: 12px;
  color: var(--header-sub-text, #6b7280);
  cursor: pointer;
  transition: all 0.15s;
}

.menu-item:hover {
  background: var(--header-btn-hover, #f3f4f6);
  color: var(--header-text, #374151);
}

.editor-header.dark .menu-item:hover {
  background: var(--header-btn-hover, #1e293b);
  color: #e2e8f0;
}

.menu-item svg {
  width: 14px;
  height: 14px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 6px;
  color: var(--header-sub-text, #6b7280);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.header-icon-btn:hover {
  background: var(--header-btn-hover, #f3f4f6);
  color: var(--header-text, #374151);
}

.editor-header.dark .header-icon-btn:hover {
  background: var(--header-btn-hover, #1e293b);
  color: #e2e8f0;
}

.header-icon-btn svg {
  width: 16px;
  height: 16px;
}

.header-divider {
  width: 1px;
  height: 20px;
  background: var(--header-border, #e5e7eb);
  margin: 0 4px;
}

.header-btn-secondary {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border: 1px solid var(--header-border, #d1d5db);
  background: var(--header-btn-bg, #fff);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--header-text, #374151);
  cursor: pointer;
  transition: all 0.15s;
}

.editor-header.dark .header-btn-secondary {
  background: #1e293b;
  border-color: #334155;
  color: #e2e8f0;
}

.header-btn-secondary:hover {
  background: var(--header-btn-hover, #f9fafb);
}

.editor-header.dark .header-btn-secondary:hover {
  background: #334155;
}

.header-btn-secondary svg {
  width: 14px;
  height: 14px;
}

.header-btn-primary {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 14px;
  border: none;
  background: #10b981;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  transition: all 0.15s;
}

.header-btn-primary:hover {
  background: #059669;
}

.header-btn-primary svg {
  width: 14px;
  height: 14px;
}

/* 移动端样式 */
@media (max-width: 768px) {
  .editor-header.mobile {
    height: 50px;
    padding: 0 12px;
  }

  .editor-header.mobile .header-menu {
    display: none;
  }

  .editor-header.mobile .logo-mark {
    width: 28px;
    height: 28px;
    font-size: 14px;
  }

  .editor-header.mobile .logo-text {
    font-size: 15px;
  }
}
</style>
