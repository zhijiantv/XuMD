/**
 * 图片上传组合式函数（复刻 WeMD 上传流程）
 *
 * 本项目为纯前端离线 Web，无后端。
 * 图片经由图床转为公网直链后插入 Markdown —— 因为微信公众号编辑器
 * 不支持 base64 内联图片（粘贴会被剥离），且"替换图片"功能只对可公网
 * 访问的外链图片有效。官方图床开箱即用，七牛/阿里/腾讯/S3 为前端直传。
 *
 * 上传流程：读取 File → 超过 2MB 自动压缩（autoCompressImage）→ 上传到
 * 当前图床（uploadEditorImage）→ 返回直链 → 插入 Markdown。
 */

import { ref } from 'vue'
import {
  uploadEditorImage,
  type UploadEditorImageResult,
} from '../services/image/imageUploadFlow'
import type { PrepareImageForUploadOptions } from '../services/image/autoCompressImage'
import { useImageHost } from './useImageHost'

export interface ImageUploadOptions {
  /** 压缩选项（透传给 prepareImageForUpload） */
  compressionOptions?: PrepareImageForUploadOptions
}

const uploading = ref(false)
const uploadError = ref<string | null>(null)

export function useImageUpload() {
  const { imageHostType } = useImageHost()

  /**
   * 处理文件选择，返回 Markdown 图片语法字符串数组
   * @param files 用户选择的图片文件（来自 input / 拖拽 / 剪贴板）
   * @param options 可选压缩选项
   */
  async function handleFiles(
    files: FileList | File[],
    options: ImageUploadOptions = {},
  ): Promise<string[]> {
    const fileArray = Array.from(files).filter((f) =>
      f.type.startsWith('image/'),
    )
    if (fileArray.length === 0) return []

    uploading.value = true
    uploadError.value = null

    const results: string[] = []
    const failed: string[] = []

    try {
      for (const file of fileArray) {
        try {
          const result: UploadEditorImageResult = await uploadEditorImage(
            file,
            { compressionOptions: options.compressionOptions },
          )
          const alt = (file.name || 'image').replace(/\.[^/.]+$/, '')
          const mdSyntax = `![${alt}](${result.url})`
          results.push(mdSyntax)

          if (result.compressed) {
            console.info(
              `[XuMD] 图片已自动压缩: ${(result.originalSize / 1024).toFixed(0)}KB → ${(result.finalSize / 1024).toFixed(0)}KB`,
            )
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : '上传失败'
          console.warn(`[XuMD] 图片上传失败(${imageHostType.value}):`, msg)
          failed.push(file.name || '图片')
        }
      }

      if (failed.length > 0) {
        uploadError.value = `以下图片上传失败，未插入：${failed.join('、')}（请检查图床配置或网络）`
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
   * 从剪贴板读取图片并插入
   */
  async function readImageFromClipboard(
    options: ImageUploadOptions = {},
  ): Promise<string | null> {
    try {
      if (!navigator.clipboard || !navigator.clipboard.read) return null

      const items = await navigator.clipboard.read()
      for (const item of items) {
        const imageType = item.types.find((t) => t.startsWith('image/'))
        if (imageType) {
          const blob = await item.getType(imageType)
          const file = new File([blob], 'clipboard-image.png', {
            type: imageType,
          })
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
    options: ImageUploadOptions = {},
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
    handleDrop,
  }
}
