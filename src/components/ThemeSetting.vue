<template>
  <div class="theme-setting">
    <div class="setting-section">
      <h4 class="section-title">选择主题</h4>
      <div class="theme-grid">
        <div
          v-for="theme in themeList"
          :key="theme.id"
          class="theme-card"
          :class="{ active: modelValue === theme.id }"
          @click="selectTheme(theme.id)"
        >
          <div class="theme-preview" :style="getPreviewStyle(theme)">
            <div class="preview-title-bar"></div>
            <div class="preview-content">
              <div class="preview-line short"></div>
              <div class="preview-line long"></div>
              <div class="preview-line medium"></div>
            </div>
          </div>
          <div class="theme-info">
            <span class="theme-name">{{ theme.name }}</span>
            <span
              v-if="modelValue === theme.id"
              class="theme-active"
            >✓ 使用中</span>
          </div>
        </div>
      </div>
    </div>

    <div class="setting-section">
      <h4 class="section-title">自定义颜色</h4>
      <div class="custom-color-row">
        <label class="switch-label">
          <span class="switch-text">启用自定义主色</span>
          <button
            class="switch-btn"
            :class="{ active: customColorEnabled }"
            @click="toggleCustomColor"
          >
            <span class="switch-thumb"></span>
          </button>
        </label>
      </div>

      <div v-if="customColorEnabled" class="color-picker-row">
        <span class="color-label">主色调</span>
        <div class="color-input-wrapper">
          <input
            type="color"
            :value="customPrimaryColor"
            @input="onColorInput"
            class="color-input"
          />
          <input
            type="text"
            :value="customPrimaryColor"
            @change="onColorTextChange"
            class="color-text"
            maxlength="7"
          />
        </div>
      </div>

      <div v-if="customColorEnabled" class="preset-colors">
        <span class="color-label">推荐配色</span>
        <div class="preset-grid">
          <button
            v-for="color in presetColors"
            :key="color"
            class="preset-color"
            :style="{ background: color }"
            :class="{ active: customPrimaryColor === color }"
            @click="selectPresetColor(color)"
            :title="color"
          ></button>
        </div>
      </div>
    </div>

    <div class="setting-section">
      <h4 class="section-title">作者信息</h4>
      <div class="author-input-row">
        <input
          type="text"
          :value="authorName"
          @input="onAuthorInput"
          placeholder="输入作者名称"
          class="author-input"
        />
      </div>
      <p class="section-hint">作者名称将显示在文章底部签名区</p>
    </div>

    <div class="setting-section">
      <h4 class="section-title">排版设置</h4>
      <div class="layout-options">
        <label class="option-label">
          <span class="option-text">首行缩进</span>
          <button
            class="switch-btn small"
            :class="{ active: firstLineIndent }"
            @click="$emit('update:firstLineIndent', !firstLineIndent)"
          >
            <span class="switch-thumb"></span>
          </button>
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getThemeList, getTheme } from '../xumd-gzh-render'

interface ThemeListItem {
  id: string
  name: string
  description: string
  primaryColor: string
}

const props = defineProps<{
  modelValue: string
  customColorEnabled: boolean
  customPrimaryColor: string
  authorName: string
  firstLineIndent?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'update:customColorEnabled', value: boolean): void
  (e: 'update:customPrimaryColor', value: string): void
  (e: 'update:authorName', value: string): void
  (e: 'update:firstLineIndent', value: boolean): void
}>()

const themeList = computed((): ThemeListItem[] => getThemeList())

// 预设颜色
const presetColors = [
  '#059669', // 翠绿
  '#DC2626', // 红色
  '#8B5CF6', // 紫色
  '#3B82F6', // 蓝色
  '#F59E0B', // 橙色
  '#EC4899', // 粉色
  '#14B8A6', // 青色
  '#6366F1', // 靛蓝
  '#84CC16', // 青柠
  '#F97316', // 橘色
  '#64748B', // 石板灰
  '#0F172A'  // 深靛蓝
]

function selectTheme(id: string): void {
  emit('update:modelValue', id)
}

function toggleCustomColor(): void {
  emit('update:customColorEnabled', !props.customColorEnabled)
}

function onColorInput(e: Event): void {
  const target = e.target as HTMLInputElement
  emit('update:customPrimaryColor', target.value)
}

function onColorTextChange(e: Event): void {
  const target = e.target as HTMLInputElement
  let value = target.value.trim()
  if (!value.startsWith('#')) {
    value = '#' + value
  }
  if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
    emit('update:customPrimaryColor', value)
  }
}

function selectPresetColor(color: string): void {
  emit('update:customPrimaryColor', color)
}

function onAuthorInput(e: Event): void {
  const target = e.target as HTMLInputElement
  emit('update:authorName', target.value)
}

function getPreviewStyle(themeItem: ThemeListItem): Record<string, string> {
  const theme = getTheme(themeItem.id)
  const tokens = theme?.tokens
  return {
    background: tokens?.white || '#ffffff',
    borderColor: tokens?.primary || '#059669'
  }
}
</script>

<style scoped>
.theme-setting {
  padding: 4px 0;
}

.setting-section {
  padding: 16px 0;
  border-bottom: 1px solid var(--section-border, #f3f4f6);
}

.setting-section:last-child {
  border-bottom: none;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--section-title, #111827);
  margin: 0 0 12px;
}

.section-hint {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--hint-color, #9ca3af);
}

/* 主题网格 */
.theme-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.theme-card {
  border: 2px solid var(--theme-card-border, #e5e7eb);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--theme-card-bg, #fff);
}

.theme-card:hover {
  border-color: var(--theme-card-hover, #3b82f6);
  transform: translateY(-1px);
}

.theme-card.active {
  border-color: var(--theme-card-active, #3b82f6);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
}

.theme-preview {
  height: 80px;
  padding: 10px;
  border-bottom: 1px solid var(--theme-card-border, #e5e7eb);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.preview-title-bar {
  height: 12px;
  width: 60%;
  background: var(--preview-title, #111827);
  border-radius: 2px;
  opacity: 0.8;
}

.preview-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  justify-content: center;
}

.preview-line {
  height: 4px;
  background: var(--preview-text, #6b7280);
  border-radius: 2px;
  opacity: 0.5;
}

.preview-line.short { width: 40%; }
.preview-line.medium { width: 70%; }
.preview-line.long { width: 100%; }

.theme-info {
  padding: 8px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.theme-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--theme-name, #374151);
}

.theme-active {
  font-size: 11px;
  color: var(--theme-active-text, #3b82f6);
  font-weight: 600;
}

/* 自定义颜色 */
.custom-color-row,
.color-picker-row,
.author-input-row,
.layout-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.switch-label,
.option-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  flex: 1;
  justify-content: space-between;
}

.switch-text,
.option-text,
.color-label {
  font-size: 13px;
  color: var(--setting-text, #374151);
}

.switch-btn {
  width: 40px;
  height: 22px;
  border-radius: 11px;
  border: none;
  background: var(--switch-bg, #d1d5db);
  cursor: pointer;
  position: relative;
  transition: background 0.2s ease;
  padding: 0;
}

.switch-btn.small {
  width: 34px;
  height: 18px;
  border-radius: 9px;
}

.switch-btn.active {
  background: var(--switch-active, #3b82f6);
}

.switch-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease;
}

.switch-btn.small .switch-thumb {
  width: 14px;
  height: 14px;
}

.switch-btn.active .switch-thumb {
  transform: translateX(18px);
}

.switch-btn.small.active .switch-thumb {
  transform: translateX(16px);
}

.color-picker-row {
  margin-top: 12px;
  padding: 12px;
  background: var(--picker-bg, #f9fafb);
  border-radius: 8px;
}

.color-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-input {
  width: 36px;
  height: 30px;
  border: 1px solid var(--input-border, #d1d5db);
  border-radius: 6px;
  cursor: pointer;
  padding: 2px;
  background: #fff;
}

.color-text {
  width: 90px;
  padding: 6px 10px;
  border: 1px solid var(--input-border, #d1d5db);
  border-radius: 6px;
  font-family: 'SF Mono', Consolas, Monaco, monospace;
  font-size: 13px;
  text-transform: uppercase;
  background: #fff;
  color: var(--input-text, #111827);
}

.color-text:focus {
  outline: none;
  border-color: var(--input-focus, #3b82f6);
}

.preset-colors {
  margin-top: 12px;
}

.preset-colors .color-label {
  display: block;
  margin-bottom: 8px;
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
}

.preset-color {
  width: 100%;
  aspect-ratio: 1;
  border: 2px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  padding: 0;
}

.preset-color:hover {
  transform: scale(1.1);
}

.preset-color.active {
  border-color: var(--preset-active, #111827);
  box-shadow: 0 0 0 2px #fff, 0 0 0 4px currentColor;
}

/* 作者输入 */
.author-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--input-border, #d1d5db);
  border-radius: 6px;
  font-size: 13px;
  background: #fff;
  color: var(--input-text, #111827);
}

.author-input:focus {
  outline: none;
  border-color: var(--input-focus, #3b82f6);
}

.author-input::placeholder {
  color: var(--input-placeholder, #9ca3af);
}

/* 暗黑模式 */
.dark .theme-setting {
  --section-border: #374151;
  --section-title: #f9fafb;
  --hint-color: #6b7280;
  --theme-card-border: #374151;
  --theme-card-bg: #1f2937;
  --theme-card-hover: #3b82f6;
  --theme-card-active: #3b82f6;
  --theme-name: #d1d5db;
  --theme-active-text: #60a5fa;
  --preview-title: #f9fafb;
  --preview-text: #9ca3af;
  --setting-text: #d1d5db;
  --switch-bg: #4b5563;
  --switch-active: #3b82f6;
  --picker-bg: #1f2937;
  --input-border: #4b5563;
  --input-text: #f9fafb;
  --input-focus: #3b82f6;
  --input-placeholder: #6b7280;
  --preset-active: #f9fafb;
}
</style>
