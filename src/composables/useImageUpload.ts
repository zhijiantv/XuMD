/**
 * 图片上传组合式函数
 *
 * 说明：
 * 本项目为纯前端离线 Web，无后端。
 * - 图床为 local：读取本地图片 → 压缩 → 以 Base64 嵌入 Markdown（离线可用）。
 * - 图床为 imgbb / smms：压缩后先上传图床拿到公网直链再插入 Markdown。
 *
 * 为什么非 local 时要上传外链？
 * 微信公众号编辑器**不支持 base64 内联图片**（粘贴会被剥离，连"替换图片"入口都没有）；
 * 同时公众号的"替换图片"功能只对可公网访问的外链图片有效。因此只有把本地图换成
 * 图床外链，复制到公众号后才能正常显示、并能在公众号里直接替换。
 */

import { ref } from 'vue'
import { useImageHost } from './useImageHost'

export interface ImageUploadOptions {
  /** 最大宽度（px），超过则等比压缩 */
  maxWidth?: number
  /** 输出质量 0-1，仅对 JPEG/WebP 有效 */
  quality?: number
  /** 输出格式：保持原格式或强制 jpeg */
  outputFormat?: 'original' | 'jpeg'
}

const uploading = ref(false)
const uploadError = ref<string | null>(null)

export function useImageUpload() {
  const defaultOptions: Required<ImageUploadOptions> = {
    maxWidth: 1280,
    quality: 0.85,
    outputFormat: 'original'
  }

  const { upload, imageHostType } = useImageHost()

  /**
   * 处理文件选择，返回 Markdown 图片语法字符串
   *
   * - 图床为 local：压缩后以 Base64 内联（离线可用）。
   * - 图床为 imgbb / smms：压缩后上传图床拿外链再插入，
   *   保证复制到公众号后图片可显示且可被"替换图片"功能替换。
   * - 上传失败：回退 Base64 并在 uploadError 中提示，图片不丢。
   */
  async function handleFiles(
    files: FileList | File[],
    options: ImageUploadOptions = {}
  ): Promise<string[]> {
    const opts = { ...defaultOptions, ...options }
    uploading.value = true
    uploadError.value = null

    const fileArray = Array.from(files)
    const results: string[] = []
    let fallbackToBase64 = false

    try {
      for (const file of fileArray) {
        if (!file.type.startsWith('image/')) {
          console.warn(`Skipping non-image file: ${file.name}`)
          continue
        }

        const dataUrl = await processImage(file, opts)

        // 仅当使用图床时才上传；local 直接内联 base64
        let finalUrl = dataUrl
        if (imageHostType.value !== 'local') {
          const r = await upload(dataUrl, file.name || 'image.png')
          finalUrl = r.url
          if (!r.uploaded) {
            fallbackToBase64 = true
            console.warn('[XuMD] 图床上传失败，回退 Base64:', r.error)
          }
        }

        const mdSyntax = `![${file.name}](${finalUrl})`
        results.push(mdSyntax)
      }

      if (fallbackToBase64) {
        uploadError.value =
          '部分图片图床上传失败，已回退为本地图片（复制到公众号可能无法显示/替换，请检查图床配置或网络）'
      }
    } catch (e) {
      uploadError.value = e instanceof Error ? e.message : '图片处理失败'
      console.error('Image upload error:', e)
    } finally {
      uploading.value = false
    }

    return results
  }

  /**
   * 处理单张图片：读取 → 压缩 → 返回 base64
   */
  function processImage(file: File, options: Required<ImageUploadOptions>): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          try {
            const result = compressImage(img, file.type, options)
            resolve(result)
          } catch (err) {
            reject(err)
          }
        }
        img.onerror = () => reject(new Error('图片加载失败'))
        img.src = e.target?.result as string
      }
      reader.onerror = () => reject(new Error('文件读取失败'))
      reader.readAsDataURL(file)
    })
  }

  /**
   * 压缩图片到 canvas 并输出 base64
   */
  function compressImage(
    img: HTMLImageElement,
    originalType: string,
    options: Required<ImageUploadOptions>
  ): string {
    const { maxWidth, quality, outputFormat } = options

    // 计算目标尺寸
    let width = img.width
    let height = img.height

    if (width > maxWidth) {
      height = Math.round((height * maxWidth) / width)
      width = maxWidth
    }

    // 不需要压缩的情况：直接返回原图
    if (width >= img.width && outputFormat === 'original') {
      // 重新转 base64（避免重复压缩）
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas 不可用')
      ctx.drawImage(img, 0, 0)
      return canvas.toDataURL(originalType)
    }

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 不可用')

    // 绘制图片（使用平滑缩放）
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, 0, 0, width, height)

    // 决定输出格式
    let mimeType = originalType
    if (outputFormat === 'jpeg') {
      mimeType = 'image/jpeg'
    }
    // PNG 不支持 quality 参数，保持原样
    if (mimeType === 'image/png') {
      return canvas.toDataURL('image/png')
    }

    return canvas.toDataURL(mimeType || 'image/jpeg', quality)
  }

  /**
   * 从剪贴板读取图片
   */
  async function readImageFromClipboard(
    options: ImageUploadOptions = {}
  ): Promise<string | null> {
    try {
      if (!navigator.clipboard || !navigator.clipboard.read) return null

      const items = await navigator.clipboard.read()
      for (const item of items) {
        const imageType = item.types.find(t => t.startsWith('image/'))
        if (imageType) {
          const blob = await item.getType(imageType)
          const file = new File([blob], 'clipboard-image.png', { type: imageType })
          const results = await handleFiles([file], options)
          return results[0] || null
        }
      }
      return null
    } catch (e) {
      console.warn('Clipboard image read failed:', e)
      return null
    }
  }

  /**
   * 拖拽图片处理
   */
  async function handleDrop(
    event: DragEvent,
    options: ImageUploadOptions = {}
  ): Promise<string[]> {
    if (!event.dataTransfer?.files || event.dataTransfer.files.length === 0) {
      return []
    }
    return handleFiles(event.dataTransfer.files, options)
  }

  return {
    uploading,
    uploadError,
    handleFiles,
    readImageFromClipboard,
    handleDrop
  }
}
