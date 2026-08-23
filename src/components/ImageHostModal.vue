<template>
  <div v-if="visible" class="modal-overlay" @click.self="handleClose">
    <div class="modal" :class="{ dark: isDark }">
      <div class="modal-header">
        <h3 class="modal-title">图床设置</h3>
        <button class="modal-close" @click="handleClose">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="modal-tabs">
        <button
          v-for="t in imageHostTypes"
          :key="t.type"
          class="tab-btn"
          :class="{ active: activeTab === t.type, disabled: t.disabled }"
          @click="switchTab(t)"
        >
          {{ t.name }}
          <span v-if="t.disabled" class="tab-badge">敬请期待</span>
          <span v-else-if="currentType === t.type && activeTab === t.type" class="tab-badge current">当前</span>
        </button>
      </div>

      <div class="modal-body">
        <!-- 本地 base64 -->
        <div v-if="activeTab === 'local'" class="config-panel">
          <p class="config-desc">
            图片以 Base64 编码直接嵌入 Markdown 中，无需上传，离线可用。
          </p>
          <div class="config-tip">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <span>优点：完全离线、无需配置、隐私安全</span>
          </div>
          <div class="config-tip warn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <span>缺点：图片体积会增大约 33%，文章文件较大</span>
          </div>
          <button class="apply-btn" @click="applyHost('local')">
            {{ currentType === 'local' ? '当前使用中' : '使用此图床' }}
          </button>
        </div>

        <!-- 七牛云 -->
        <div v-if="activeTab === 'qiniu'" class="config-panel">
          <p class="config-desc">配置七牛云对象存储，上传图片到你的七牛云空间。</p>
          <div class="form-group">
            <label class="form-label">AccessKey</label>
            <input type="text" class="form-input" v-model="configs.qiniu.accessKey" placeholder="请输入 AccessKey" />
          </div>
          <div class="form-group">
            <label class="form-label">SecretKey</label>
            <input type="password" class="form-input" v-model="configs.qiniu.secretKey" placeholder="请输入 SecretKey" />
          </div>
          <div class="form-group">
            <label class="form-label">Bucket（存储空间）</label>
            <input type="text" class="form-input" v-model="configs.qiniu.bucket" placeholder="请输入 Bucket 名称" />
          </div>
          <div class="form-group">
            <label class="form-label">存储区域</label>
            <select class="form-input" v-model="configs.qiniu.region">
              <option value="z0">华东-浙江</option>
              <option value="z1">华北-河北</option>
              <option value="z2">华南-广东</option>
              <option value="na0">北美-洛杉矶</option>
              <option value="as0">东南亚-新加坡</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">CDN 域名</label>
            <input type="text" class="form-input" v-model="configs.qiniu.domain" placeholder="https://example.com" />
          </div>
          <button class="apply-btn" @click="applyHost('qiniu')">保存并使用</button>
        </div>

        <!-- 阿里云 OSS -->
        <div v-if="activeTab === 'aliyun'" class="config-panel">
          <p class="config-desc">配置阿里云对象存储 OSS，上传图片到你的 OSS 存储空间。</p>
          <div class="form-group">
            <label class="form-label">AccessKey ID</label>
            <input type="text" class="form-input" v-model="configs.aliyun.accessKeyId" placeholder="请输入 AccessKey ID" />
          </div>
          <div class="form-group">
            <label class="form-label">AccessKey Secret</label>
            <input type="password" class="form-input" v-model="configs.aliyun.accessKeySecret" placeholder="请输入 AccessKey Secret" />
          </div>
          <div class="form-group">
            <label class="form-label">Bucket（存储空间）</label>
            <input type="text" class="form-input" v-model="configs.aliyun.bucket" placeholder="请输入 Bucket 名称" />
          </div>
          <div class="form-group">
            <label class="form-label">地域节点（Endpoint）</label>
            <input type="text" class="form-input" v-model="configs.aliyun.endpoint" placeholder="oss-cn-hangzhou.aliyuncs.com" />
          </div>
          <div class="form-group">
            <label class="form-label">自定义域名</label>
            <input type="text" class="form-input" v-model="configs.aliyun.domain" placeholder="https://img.example.com" />
          </div>
          <button class="apply-btn" @click="applyHost('aliyun')">保存并使用</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'

interface ImageHostType {
  type: string
  name: string
  disabled?: boolean
}

const props = defineProps<{
  visible: boolean
  isDark: boolean
  currentType: string
}>()

const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void
  (e: 'change', type: string, config: Record<string, unknown>): void
}>()

const imageHostTypes: ImageHostType[] = [
  { type: 'local', name: '本地 Base64' },
  { type: 'qiniu', name: '七牛云' },
  { type: 'aliyun', name: '阿里云 OSS' }
]

const activeTab = ref('local')

// 各图床配置
const configs = reactive({
  local: {},
  qiniu: {
    accessKey: '',
    secretKey: '',
    bucket: '',
    region: 'z0',
    domain: ''
  },
  aliyun: {
    accessKeyId: '',
    accessKeySecret: '',
    bucket: '',
    endpoint: '',
    domain: ''
  }
})

// 从 localStorage 加载配置
function loadConfigs(): void {
  try {
    const saved = localStorage.getItem('xumd-image-host-configs')
    if (saved) {
      const parsed = JSON.parse(saved)
      Object.assign(configs.qiniu, parsed.qiniu || {})
      Object.assign(configs.aliyun, parsed.aliyun || {})
    }
    const current = localStorage.getItem('xumd-image-host-current')
    if (current) {
      activeTab.value = current
    }
  } catch (e) {
    console.warn('Failed to load image host configs:', e)
  }
}

watch(() => props.visible, (v) => {
  if (v) {
    loadConfigs()
    activeTab.value = props.currentType
  }
}, { immediate: true })

function handleClose(): void {
  emit('update:visible', false)
}

function switchTab(t: ImageHostType): void {
  if (t.disabled) return
  activeTab.value = t.type
}

function applyHost(type: string): void {
  // 保存配置到 localStorage
  try {
    localStorage.setItem('xumd-image-host-configs', JSON.stringify({
      qiniu: configs.qiniu,
      aliyun: configs.aliyun
    }))
    localStorage.setItem('xumd-image-host-current', type)
  } catch (e) {
    console.warn('Failed to save image host config:', e)
  }
  emit('change', type, configs[type as keyof typeof configs] as Record<string, unknown>)
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
  width: 520px;
  max-width: 90vw;
  max-height: 85vh;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  display: flex;
  flex-direction: column;
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
  flex-shrink: 0;
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

.modal-tabs {
  display: flex;
  gap: 4px;
  padding: 10px 16px;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
  overflow-x: auto;
}

.modal.dark .modal-tabs {
  border-bottom-color: #334155;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: none;
  background: transparent;
  border-radius: 6px;
  font-size: 12px;
  color: #6b7280;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}

.tab-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal.dark .tab-btn:hover {
  background: #334155;
  color: #e2e8f0;
}

.tab-btn.active {
  background: #ecfdf5;
  color: #065f46;
  font-weight: 600;
}

.modal.dark .tab-btn.active {
  background: #064e3b;
  color: #6ee7b7;
}

.tab-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tab-badge {
  font-size: 9px;
  padding: 1px 6px;
  border-radius: 8px;
  background: #e5e7eb;
  color: #6b7280;
  font-weight: 500;
}

.modal.dark .tab-badge {
  background: #334155;
  color: #94a3b8;
}

.tab-badge.current {
  background: #10b981;
  color: #fff;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.config-desc {
  font-size: 12px;
  color: #6b7280;
  margin: 0 0 16px 0;
  line-height: 1.6;
}

.modal.dark .config-desc {
  color: #94a3b8;
}

.config-tip {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  background: #ecfdf5;
  border-radius: 6px;
  margin-bottom: 8px;
  font-size: 11px;
  color: #065f46;
  line-height: 1.5;
}

.modal.dark .config-tip {
  background: #064e3b;
  color: #6ee7b7;
}

.config-tip.warn {
  background: #fffbeb;
  color: #92400e;
}

.modal.dark .config-tip.warn {
  background: #451a03;
  color: #fcd34d;
}

.config-tip svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  margin-top: 1px;
}

.form-group {
  margin-bottom: 14px;
}

.form-label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 5px;
}

.modal.dark .form-label {
  color: #cbd5e1;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 12px;
  color: #111827;
  background: #fff;
  box-sizing: border-box;
  outline: none;
  transition: all 0.15s;
}

.modal.dark .form-input {
  background: #0f172a;
  border-color: #334155;
  color: #e2e8f0;
}

.form-input:focus {
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.form-input::placeholder {
  color: #9ca3af;
}

.apply-btn {
  width: 100%;
  margin-top: 16px;
  padding: 10px 16px;
  border: none;
  background: #10b981;
  color: #fff;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.apply-btn:hover {
  background: #059669;
}
</style>
