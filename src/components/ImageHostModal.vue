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
          :class="{ active: activeTab === t.type }"
          @click="activeTab = t.type"
        >
          {{ t.name }}
          <span v-if="imageHostType === t.type" class="tab-badge current">使用中</span>
        </button>
      </div>

      <div class="modal-body">
        <!-- 官方图床 -->
        <div v-if="activeTab === 'official'" class="config-panel">
          <div class="official-intro">
            <div class="intro-icon">☁</div>
            <div>
              <h3>官方托管服务</h3>
              <p>无需额外配置，直接用于公众号图片上传</p>
            </div>
          </div>
          <div class="feature-list">
            <div class="feature-item"><span>⚡</span><div><strong>高速访问</strong><small>基于全球边缘网络，加载流畅</small></div></div>
            <div class="feature-item"><span>🔒</span><div><strong>安全稳定</strong><small>无需配置 Key，HTTPS 加密传输</small></div></div>
            <div class="feature-item"><span>🖼</span><div><strong>开箱即用</strong><small>默认集成，专注内容创作</small></div></div>
          </div>
          <button v-if="imageHostType !== 'official'" class="apply-btn" @click="activate('official')">
            启用官方图床
          </button>
          <div v-else class="active-hint">✓ 当前已启用官方图床</div>
        </div>

        <!-- 七牛云 -->
        <div v-if="activeTab === 'qiniu'" class="config-panel">
          <div v-if="imageHostType === 'qiniu'" class="active-status">● 当前使用中</div>
          <div class="form-group">
            <label class="form-label">AccessKey</label>
            <input type="text" class="form-input" v-model="form.qiniu.accessKey" placeholder="从七牛云控制台获取" />
          </div>
          <div class="form-group">
            <label class="form-label">SecretKey</label>
            <input type="password" class="form-input" v-model="form.qiniu.secretKey" placeholder="从七牛云控制台获取" />
          </div>
          <div class="form-group">
            <label class="form-label">存储空间名称（Bucket）</label>
            <input type="text" class="form-input" v-model="form.qiniu.bucket" placeholder="your-bucket" />
          </div>
          <div class="form-group">
            <label class="form-label">存储区域</label>
            <select class="form-input" v-model="form.qiniu.region">
              <option value="z0">华东-浙江 (z0)</option>
              <option value="cn-east-2">华东-浙江2 (cn-east-2)</option>
              <option value="z1">华北-河北 (z1)</option>
              <option value="z2">华南-广东 (z2)</option>
              <option value="na0">北美-洛杉矶 (na0)</option>
              <option value="as0">亚太-新加坡 (as0)</option>
              <option value="ap-northeast-1">亚太-首尔 (ap-northeast-1)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">CDN 域名</label>
            <input type="text" class="form-input" v-model="form.qiniu.domain" placeholder="https://xxx.clouddn.com" />
          </div>
          <div class="config-footer">
            <a href="https://portal.qiniu.com/kodo/bucket" target="_blank" rel="noopener">七牛云控制台</a>
            <span v-if="testResult" :class="['test-result', testResult.status]">{{ testResult.message }}</span>
            <button class="btn-test" @click="testConnection">测试连接</button>
          </div>
          <button v-if="imageHostType !== 'qiniu'" class="apply-btn" @click="activate('qiniu')">启用七牛云图床</button>
          <div v-else class="active-hint">✓ 当前已启用七牛云</div>
        </div>

        <!-- 阿里云 OSS -->
        <div v-if="activeTab === 'aliyun'" class="config-panel">
          <div v-if="imageHostType === 'aliyun'" class="active-status">● 当前使用中</div>
          <div class="form-group">
            <label class="form-label">AccessKey ID</label>
            <input type="text" class="form-input" v-model="form.aliyun.accessKeyId" placeholder="从阿里云控制台获取" />
          </div>
          <div class="form-group">
            <label class="form-label">AccessKey Secret</label>
            <input type="password" class="form-input" v-model="form.aliyun.accessKeySecret" placeholder="从阿里云控制台获取" />
          </div>
          <div class="form-group">
            <label class="form-label">Bucket 名称</label>
            <input type="text" class="form-input" v-model="form.aliyun.bucket" placeholder="your-bucket" />
          </div>
          <div class="form-group">
            <label class="form-label">地域节点</label>
            <input type="text" class="form-input" v-model="form.aliyun.region" placeholder="oss-cn-hangzhou" />
            <small>例如：oss-cn-hangzhou（杭州）、oss-cn-beijing（北京）</small>
          </div>
          <div class="form-group">
            <label class="form-label">自定义域名（可选）</label>
            <input type="text" class="form-input" v-model="form.aliyun.endpoint" placeholder="https://cdn.example.com" />
          </div>
          <div class="config-footer">
            <a href="https://oss.console.aliyun.com/bucket" target="_blank" rel="noopener">阿里云 OSS 控制台</a>
            <span v-if="testResult" :class="['test-result', testResult.status]">{{ testResult.message }}</span>
            <button class="btn-test" @click="testConnection">测试连接</button>
          </div>
          <button v-if="imageHostType !== 'aliyun'" class="apply-btn" @click="activate('aliyun')">启用阿里云 OSS</button>
          <div v-else class="active-hint">✓ 当前已启用阿里云 OSS</div>
        </div>

        <!-- 腾讯云 COS -->
        <div v-if="activeTab === 'tencent'" class="config-panel">
          <div v-if="imageHostType === 'tencent'" class="active-status">● 当前使用中</div>
          <div class="form-group">
            <label class="form-label">SecretId</label>
            <input type="text" class="form-input" v-model="form.tencent.secretId" placeholder="从腾讯云控制台获取" />
          </div>
          <div class="form-group">
            <label class="form-label">SecretKey</label>
            <input type="password" class="form-input" v-model="form.tencent.secretKey" placeholder="从腾讯云控制台获取" />
          </div>
          <div class="form-group">
            <label class="form-label">存储桶名称（Bucket）</label>
            <input type="text" class="form-input" v-model="form.tencent.bucket" placeholder="your-bucket-1234567890" />
            <small>格式：bucketname-appid</small>
          </div>
          <div class="form-group">
            <label class="form-label">所属地域</label>
            <input type="text" class="form-input" v-model="form.tencent.region" placeholder="ap-guangzhou" />
            <small>例如：ap-guangzhou（广州）、ap-beijing（北京）</small>
          </div>
          <div class="form-group">
            <label class="form-label">自定义域名（可选）</label>
            <input type="text" class="form-input" v-model="form.tencent.endpoint" placeholder="https://cdn.example.com" />
          </div>
          <div class="config-footer">
            <a href="https://console.cloud.tencent.com/cos" target="_blank" rel="noopener">腾讯云 COS 控制台</a>
            <span v-if="testResult" :class="['test-result', testResult.status]">{{ testResult.message }}</span>
            <button class="btn-test" @click="testConnection">测试连接</button>
          </div>
          <button v-if="imageHostType !== 'tencent'" class="apply-btn" @click="activate('tencent')">启用腾讯云 COS</button>
          <div v-else class="active-hint">✓ 当前已启用腾讯云 COS</div>
        </div>

        <!-- S3 兼容 -->
        <div v-if="activeTab === 's3'" class="config-panel">
          <div v-if="imageHostType === 's3'" class="active-status">● 当前使用中</div>
          <div class="form-group">
            <label class="form-label">Endpoint（必填）</label>
            <input type="text" class="form-input" v-model="form.s3.endpoint" placeholder="https://s3.amazonaws.com 或 https://xxx.r2.cloudflarestorage.com" />
            <small>S3 服务地址，不同服务商格式不同</small>
          </div>
          <div class="form-group">
            <label class="form-label">Region（必填）</label>
            <input type="text" class="form-input" v-model="form.s3.region" placeholder="us-east-1 或 auto" />
            <small>存储区域，Cloudflare R2 可填 auto</small>
          </div>
          <div class="form-group">
            <label class="form-label">Access Key ID（必填）</label>
            <input type="text" class="form-input" v-model="form.s3.accessKeyId" placeholder="从服务商控制台获取" />
          </div>
          <div class="form-group">
            <label class="form-label">Secret Access Key（必填）</label>
            <input type="password" class="form-input" v-model="form.s3.secretAccessKey" placeholder="从服务商控制台获取" />
          </div>
          <div class="form-group">
            <label class="form-label">Bucket 名称（必填）</label>
            <input type="text" class="form-input" v-model="form.s3.bucket" placeholder="your-bucket" />
          </div>
          <div class="form-group">
            <label class="form-label">路径前缀（可选）</label>
            <input type="text" class="form-input" v-model="form.s3.pathPrefix" placeholder="images/wemd" />
            <small>图片存储的目录前缀</small>
          </div>
          <div class="form-group">
            <label class="form-label">自定义域名（可选）</label>
            <input type="text" class="form-input" v-model="form.s3.customDomain" placeholder="https://cdn.example.com" />
            <small>用于访问图片的 CDN 或自定义域名</small>
          </div>
          <div class="form-group">
            <label class="form-label checkbox-label">
              <input type="checkbox" v-model="form.s3.forcePathStyle" style="width:auto;margin:0 8px 0 0;" />
              <span>强制 Path Style（MinIO 等自建服务需要开启）</span>
            </label>
          </div>
          <div class="config-footer">
            <span v-if="testResult" :class="['test-result', testResult.status]">{{ testResult.message }}</span>
            <button class="btn-test" @click="testConnection">测试连接</button>
          </div>
          <button v-if="imageHostType !== 's3'" class="apply-btn" @click="activate('s3')">启用 S3 图床</button>
          <div v-else class="active-hint">✓ 当前已启用 S3 图床</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import {
  useImageHost,
  type HostConfigMap,
  type ImageHostType,
} from '../composables/useImageHost'

interface ImageHostDef {
  type: ImageHostType
  name: string
}

interface TestResultType {
  status: 'loading' | 'success' | 'error'
  message: string
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

const { imageHostType, configs, setHost } = useImageHost()

const imageHostTypes: ImageHostDef[] = [
  { type: 'official', name: '官方图床' },
  { type: 'qiniu', name: '七牛云' },
  { type: 'aliyun', name: '阿里云 OSS' },
  { type: 'tencent', name: '腾讯云 COS' },
  { type: 's3', name: 'S3 兼容' },
]

const activeTab = ref<ImageHostType>('official')
const testResult = ref<TestResultType | null>(null)

function deepClone(c: HostConfigMap): HostConfigMap {
  return JSON.parse(JSON.stringify(c)) as HostConfigMap
}

const form = reactive<HostConfigMap>(deepClone(configs))

function syncFormFromStore(): void {
  const clone = deepClone(configs)
  form.official = clone.official
  form.qiniu = clone.qiniu
  form.aliyun = clone.aliyun
  form.tencent = clone.tencent
  form.s3 = clone.s3
}

watch(
  () => props.visible,
  (v) => {
    if (v) {
      syncFormFromStore()
      if (
        props.currentType === 'official' ||
        props.currentType === 'qiniu' ||
        props.currentType === 'aliyun' ||
        props.currentType === 'tencent' ||
        props.currentType === 's3'
      ) {
        activeTab.value = props.currentType as ImageHostType
      } else {
        activeTab.value = 'official'
      }
      testResult.value = null
    }
  },
  { immediate: true },
)

function handleClose(): void {
  emit('update:visible', false)
}

async function runValidate(type: ImageHostType): Promise<boolean> {
  const { ImageHostManager } = await import('../services/image/ImageUploader')
  const manager = new ImageHostManager({
    type,
    config: form[type] as Record<string, unknown>,
  })
  return manager.validate()
}

async function activate(type: ImageHostType): Promise<void> {
  if (type !== 'official') {
    testResult.value = { status: 'loading', message: '正在验证配置…' }
    try {
      const valid = await runValidate(type)
      if (!valid) {
        testResult.value = {
          status: 'error',
          message: '无法启用：图床连接测试失败，请检查配置',
        }
        return
      }
    } catch (e) {
      testResult.value = {
        status: 'error',
        message: `无法启用：验证出错（${e instanceof Error ? e.message : String(e)}）`,
      }
      return
    }
  }

  setHost(type, form[type] as Record<string, unknown>)
  emit('change', type, form[type] as Record<string, unknown>)
  emit('update:visible', false)
}

async function testConnection(): Promise<void> {
  testResult.value = { status: 'loading', message: '正在测试连接…' }
  try {
    const ok = await runValidate(activeTab.value)
    testResult.value = ok
      ? { status: 'success', message: '配置有效' }
      : { status: 'error', message: '配置无效' }
  } catch (e) {
    testResult.value = {
      status: 'error',
      message: e instanceof Error ? e.message : '验证出错',
    }
  }
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
  width: 540px;
  max-width: 92vw;
  max-height: 86vh;
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

.tab-badge {
  font-size: 9px;
  padding: 1px 6px;
  border-radius: 8px;
  background: #10b981;
  color: #fff;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.config-panel {
  font-size: 13px;
}

.active-status {
  font-size: 12px;
  color: #10b981;
  margin-bottom: 12px;
  font-weight: 600;
}

.config-footer {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.config-footer a {
  font-size: 12px;
  color: #2563eb;
  text-decoration: none;
}

.config-footer a:hover {
  text-decoration: underline;
}

.btn-test {
  margin-left: auto;
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 6px;
  font-size: 12px;
  color: #374151;
  cursor: pointer;
}

.btn-test:hover {
  background: #f3f4f6;
}

.modal.dark .btn-test {
  background: #0f172a;
  border-color: #334155;
  color: #e2e8f0;
}

.test-result {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 6px;
}

.test-result.loading {
  background: #eff6ff;
  color: #1d4ed8;
}

.test-result.success {
  background: #ecfdf5;
  color: #065f46;
}

.test-result.error {
  background: #fef2f2;
  color: #b91c1c;
}

.modal.dark .test-result.loading {
  background: #1e3a8a;
  color: #bfdbfe;
}

.modal.dark .test-result.success {
  background: #064e3b;
  color: #6ee7b7;
}

.modal.dark .test-result.error {
  background: #7f1d1d;
  color: #fecaca;
}

.official-intro {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}

.intro-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  background: #eff6ff;
  border-radius: 12px;
  color: #2563eb;
}

.official-intro h3 {
  margin: 0 0 4px;
  font-size: 15px;
  color: #111827;
}

.modal.dark .official-intro h3 {
  color: #f1f5f9;
}

.official-intro p {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
}

.modal.dark .official-intro p {
  color: #94a3b8;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.feature-item span {
  font-size: 16px;
}

.feature-item strong {
  display: block;
  font-size: 13px;
  color: #111827;
}

.modal.dark .feature-item strong {
  color: #f1f5f9;
}

.feature-item small {
  font-size: 11px;
  color: #6b7280;
}

.modal.dark .feature-item small {
  color: #94a3b8;
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

.form-label.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
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

.form-group small {
  display: block;
  font-size: 11px;
  color: #9ca3af;
  margin-top: 4px;
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

.active-hint {
  margin-top: 16px;
  padding: 10px 12px;
  background: #ecfdf5;
  color: #065f46;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
}

.modal.dark .active-hint {
  background: #064e3b;
  color: #6ee7b7;
}
</style>
