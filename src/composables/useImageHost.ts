/**
 * 图床上传组合式函数
 *
 * 背景：
 * 微信公众号编辑器**不支持 base64 内联图片**——粘贴后内联图会被剥离，导致不显示。
 * 同时公众号的"替换图片"功能只对已转存到微信图库 / 可公网访问的外链图片有效。
 * 因此本地图片必须经过图床转为公网直链，复制到公众号后才能显示且可被替换。
 *
 * 本模块提供两个真实可用的免费图床（前端直传，零后端）：
 *  - imgbb：POST https://api.imgbb.com/1/upload?key=API_KEY，字段 image，返回 data.url（直链）
 *  - smms ：POST https://sm.ms/api/v2/upload，header Authorization: API_KEY，字段 smfile，返回 data.url
 * 并保留 local（Base64 离线嵌入）作为无图床时的兜底。
 *
 * 上传失败（网络/CORS/key 错误）时回退为 base64，并在返回结果中标记 uploaded=false，
 * 由调用方决定是否提示用户（避免静默丢图）。
 */

import { ref } from 'vue'

export type ImageHostType = 'local' | 'imgbb' | 'smms'

export interface ImageHostConfig {
  /** ImgBB API Key */
  imgbbKey: string
  /** SM.MS API Key */
  smmsKey: string
}

export interface UploadResult {
  /** 最终用于 <img src> 的地址（外链或回退的 base64） */
  url: string
  /** 是否成功上传到图床拿到外链 */
  uploaded: boolean
  /** 失败原因（上传成功时为空） */
  error?: string
}

// ===== 模块级共享状态（编辑器与插入逻辑共用） =====
const imageHostType = ref<ImageHostType>('local')
const imageHostConfig = ref<ImageHostConfig>({ imgbbKey: '', smmsKey: '' })

// 从 localStorage 恢复配置
function loadPersistedConfig(): void {
  try {
    const saved = localStorage.getItem('xumd-image-host-configs')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed.imgbbKey) imageHostConfig.value.imgbbKey = parsed.imgbbKey
      if (parsed.smmsKey) imageHostConfig.value.smmsKey = parsed.smmsKey
    }
    const current = localStorage.getItem('xumd-image-host-current') as ImageHostType | null
    if (current && ['local', 'imgbb', 'smms'].includes(current)) {
      imageHostType.value = current
    }
  } catch (e) {
    console.warn('[XuMD] 读取图床配置失败:', e)
  }
}
loadPersistedConfig()

function persistConfig(): void {
  try {
    localStorage.setItem(
      'xumd-image-host-configs',
      JSON.stringify({
        imgbbKey: imageHostConfig.value.imgbbKey,
        smmsKey: imageHostConfig.value.smmsKey
      })
    )
    localStorage.setItem('xumd-image-host-current', imageHostType.value)
  } catch (e) {
    console.warn('[XuMD] 保存图床配置失败:', e)
  }
}

export function useImageHost() {
  /**
   * 上传图片到当前图床，返回可用于 <img src> 的地址。
   * @param dataUrl 本地图片的 base64 Data URL（data:image/...;base64,....）
   * @param fileName 文件名（用于图床命名）
   */
  async function upload(dataUrl: string, fileName = 'image.png'): Promise<UploadResult> {
    const type = imageHostType.value
    if (type === 'local') {
      return { url: dataUrl, uploaded: false }
    }
    try {
      if (type === 'imgbb') {
        return await uploadToImgbb(dataUrl, fileName)
      }
      if (type === 'smms') {
        return await uploadToSmms(dataUrl, fileName)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : '上传失败'
      console.warn(`[XuMD] 图床上传失败(${type}):`, msg)
      // 回退 base64，保证图片不丢
      return { url: dataUrl, uploaded: false, error: msg }
    }
    return { url: dataUrl, uploaded: false }
  }

  async function uploadToImgbb(dataUrl: string, fileName: string): Promise<UploadResult> {
    const key = imageHostConfig.value.imgbbKey.trim()
    if (!key) {
      return { url: dataUrl, uploaded: false, error: '未配置 ImgBB API Key' }
    }
    // ImgBB 接受 base64（不含 data: 前缀的裸 base64）或文件
    const base64Body = stripDataUrlPrefix(dataUrl)
    const form = new FormData()
    form.append('image', base64Body)
    form.append('name', fileName)

    const res = await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      body: form
    })
    const json = await res.json()
    if (json && json.success && json.data && json.data.url) {
      return { url: json.data.url as string, uploaded: true }
    }
    const errMsg = (json && json.error && json.error.message) || 'ImgBB 返回异常'
    return { url: dataUrl, uploaded: false, error: String(errMsg) }
  }

  async function uploadToSmms(dataUrl: string, fileName: string): Promise<UploadResult> {
    const key = imageHostConfig.value.smmsKey.trim()
    if (!key) {
      return { url: dataUrl, uploaded: false, error: '未配置 SM.MS API Key' }
    }
    const blob = await dataUrlToBlob(dataUrl)
    const form = new FormData()
    form.append('smfile', blob, fileName)
    form.append('format', 'json')

    const res = await fetch('https://sm.ms/api/v2/upload', {
      method: 'POST',
      headers: {
        Authorization: key
      },
      body: form
    })
    const json = await res.json()
    if (json && json.success && json.data && json.data.url) {
      return { url: json.data.url as string, uploaded: true }
    }
    const errMsg = (json && json.message) || 'SM.MS 返回异常'
    return { url: dataUrl, uploaded: false, error: String(errMsg) }
  }

  function setHost(type: ImageHostType, config?: Partial<ImageHostConfig>): void {
    imageHostType.value = type
    if (config) {
      if (config.imgbbKey !== undefined) imageHostConfig.value.imgbbKey = config.imgbbKey
      if (config.smmsKey !== undefined) imageHostConfig.value.smmsKey = config.smmsKey
    }
    persistConfig()
  }

  return {
    imageHostType,
    imageHostConfig,
    upload,
    setHost
  }
}

// ===== 工具函数 =====

/** 去掉 data:image/...;base64, 前缀，返回裸 base64（ImgBB 需要） */
function stripDataUrlPrefix(dataUrl: string): string {
  const idx = dataUrl.indexOf(',')
  if (dataUrl.startsWith('data:') && idx > -1) {
    return dataUrl.slice(idx + 1)
  }
  return dataUrl
}

/** base64 Data URL → Blob（SM.MS 用文件流） */
function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      const [meta, b64] = dataUrl.split(',')
      const mimeMatch = /data:([^;]+)/.exec(meta)
      const mime = mimeMatch ? mimeMatch[1] : 'image/png'
      const bin = atob(b64)
      const arr = new Uint8Array(bin.length)
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
      resolve(new Blob([arr], { type: mime }))
    } catch (e) {
      reject(e)
    }
  })
}
