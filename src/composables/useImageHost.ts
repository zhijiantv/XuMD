/**
 * 图床组合式函数（复刻 WeMD 的图床配置模型）
 *
 * WeMD 图床配置说明：
 *  - 微信公众号编辑器**不支持 base64 内联图片**，粘贴后会被剥离。
 *  - 因此本地图片必须经由图床转为公网直链，复制到公众号后才能显示且可被"替换图片"功能替换。
 *
 * 本模块复刻 WeMD 的 5 种图床：官方 / 七牛云 / 阿里云 OSS / 腾讯云 COS / S3 兼容。
 * 官方图床开箱即用（无需配置），其余四种为前端直传（零后端）。
 *
 * 存储方式（与 WeMD 完全一致）：
 *  - localStorage["imageHostConfigs"]：所有图床配置的集合
 *  - localStorage["imageHostConfig"]：当前启用的图床配置（{ type, config }）
 * uploadEditorImage 直接读取 imageHostConfig，因此两者保持一致即可。
 */

import { ref, reactive } from 'vue'
import type { ImageHostConfig } from '../services/image/ImageUploader'

export type ImageHostType = 'official' | 'qiniu' | 'aliyun' | 'tencent' | 's3'

export interface OfficialConfig {
  serverUrl?: string
}

export interface QiniuConfig {
  accessKey: string
  secretKey: string
  bucket: string
  region: string
  domain: string
}

export interface AliyunConfig {
  accessKeyId: string
  accessKeySecret: string
  bucket: string
  region: string
  endpoint: string
}

export interface TencentConfig {
  secretId: string
  secretKey: string
  bucket: string
  region: string
  endpoint: string
}

export interface S3Config {
  endpoint: string
  region: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
  pathPrefix: string
  customDomain: string
  forcePathStyle: boolean
}

export interface HostConfigMap {
  official: OfficialConfig
  qiniu: QiniuConfig
  aliyun: AliyunConfig
  tencent: TencentConfig
  s3: S3Config
}

const CONFIGS_KEY = 'imageHostConfigs'
const CURRENT_KEY = 'imageHostConfig'

function emptyConfigs(): HostConfigMap {
  return {
    official: {},
    qiniu: { accessKey: '', secretKey: '', bucket: '', region: 'z0', domain: '' },
    aliyun: { accessKeyId: '', accessKeySecret: '', bucket: '', region: '', endpoint: '' },
    tencent: { secretId: '', secretKey: '', bucket: '', region: '', endpoint: '' },
    s3: {
      endpoint: '',
      region: '',
      accessKeyId: '',
      secretAccessKey: '',
      bucket: '',
      pathPrefix: '',
      customDomain: '',
      forcePathStyle: false,
    },
  }
}

const ALL_TYPES: ImageHostType[] = ['official', 'qiniu', 'aliyun', 'tencent', 's3']

// ===== 模块级共享状态（编辑器与插入逻辑共用，单例） =====
const currentType = ref<ImageHostType>('official')
const configs = reactive<HostConfigMap>(emptyConfigs())

function loadPersistedConfig(): void {
  try {
    const saved = localStorage.getItem(CONFIGS_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<HostConfigMap>
      for (const t of ALL_TYPES) {
        const part = parsed[t]
        if (part) {
          // 逐字段合并，避免覆盖默认值里新增的字段
          Object.assign(configs[t], part)
        }
      }
    }
    const current = localStorage.getItem(CURRENT_KEY)
    if (current) {
      const c = JSON.parse(current) as ImageHostConfig
      if (c && ALL_TYPES.includes(c.type as ImageHostType)) {
        currentType.value = c.type as ImageHostType
      }
    }
  } catch (e) {
    console.warn('[XuMD] 读取图床配置失败:', e)
  }
}
loadPersistedConfig()

function persistConfig(): void {
  try {
    localStorage.setItem(CONFIGS_KEY, JSON.stringify(configs))
    localStorage.setItem(
      CURRENT_KEY,
      JSON.stringify({
        type: currentType.value,
        config: configs[currentType.value],
      }),
    )
  } catch (e) {
    console.warn('[XuMD] 保存图床配置失败:', e)
  }
}

export function useImageHost() {
  /** 获取当前启用的图床完整配置 */
  function getConfig(): ImageHostConfig {
    return {
      type: currentType.value,
      config: { ...configs[currentType.value] } as Record<string, unknown>,
    }
  }

  /** 获取指定图床的配置（用于编辑表单初始化） */
  function getHostConfig<T extends ImageHostType>(type: T): HostConfigMap[T] {
    return configs[type]
  }

  /**
   * 切换并保存当前图床
   * @param type 图床类型
   * @param config 该图床的配置（可选，合并写入）
   */
  function setHost(
    type: ImageHostType,
    config?: Record<string, unknown>,
  ): void {
    currentType.value = type
    if (config) {
      Object.assign(configs[type], config)
    }
    persistConfig()
  }

  /** 仅保存某个图床的配置，不切换当前图床 */
  function saveHostConfig(
    type: ImageHostType,
    config: Record<string, unknown>,
  ): void {
    Object.assign(configs[type], config)
    persistConfig()
  }

  return {
    imageHostType: currentType,
    configs,
    getConfig,
    getHostConfig,
    setHost,
    saveHostConfig,
  }
}
