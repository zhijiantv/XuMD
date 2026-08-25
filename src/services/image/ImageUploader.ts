/**
 * 图床上传接口（复刻 WeMD）
 */

export interface ImageUploader {
  /** 图床名称 */
  name: string

  /** 上传图片 */
  upload(file: File): Promise<string>

  /** 配置图床（可选） */
  configure?(config: unknown): void

  /** 验证配置（可选） */
  validate?(): Promise<boolean>
}

/**
 * 图床配置
 */
export interface ImageHostConfig {
  type: 'official' | 'qiniu' | 'aliyun' | 'tencent' | 's3'
  config?: Record<string, unknown>
}

/**
 * 图床管理器
 * 使用动态导入实现按需加载，减少首屏加载体积（与 WeMD 一致）
 */
export class ImageHostManager {
  private uploaderPromise: Promise<ImageUploader>

  constructor(config: ImageHostConfig) {
    this.uploaderPromise = this.createUploader(config)
  }

  /**
   * 动态加载对应的图床上传器
   * 只有在用户选择特定图床时才会加载对应的 SDK
   */
  private async createUploader(
    config: ImageHostConfig,
  ): Promise<ImageUploader> {
    switch (config.type) {
      case 'official': {
        const { OfficialUploader } = await import('./uploaders/OfficialUploader')
        return new OfficialUploader(config.config as unknown as OfficialConfig | undefined)
      }
      case 'qiniu': {
        const { QiniuUploader } = await import('./uploaders/QiniuUploader')
        return new QiniuUploader(config.config as unknown as QiniuConfig)
      }
      case 'aliyun': {
        const { AliyunUploader } = await import('./uploaders/AliyunUploader')
        return new AliyunUploader(config.config as unknown as AliyunConfig)
      }
      case 'tencent': {
        const { TencentUploader } = await import('./uploaders/TencentUploader')
        return new TencentUploader(config.config as unknown as TencentConfig)
      }
      case 's3': {
        const { S3Uploader } = await import('./uploaders/S3Uploader')
        return new S3Uploader(config.config as unknown as S3Config)
      }
      default: {
        const { OfficialUploader } = await import('./uploaders/OfficialUploader')
        return new OfficialUploader(config.config as unknown as OfficialConfig | undefined)
      }
    }
  }

  async upload(file: File): Promise<string> {
    // 统一检查文件大小（最大 10MB）
    const MAX_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      throw new Error('图片大小不能超过 10MB')
    }
    const uploader = await this.uploaderPromise
    return await uploader.upload(file)
  }

  async validate(): Promise<boolean> {
    const uploader = await this.uploaderPromise
    if (uploader.validate) {
      return await uploader.validate()
    }
    return true
  }
}

import type { OfficialConfig } from './uploaders/OfficialUploader'
import type { QiniuConfig } from './uploaders/QiniuUploader'
import type { AliyunConfig } from './uploaders/AliyunUploader'
import type { TencentConfig } from './uploaders/TencentUploader'
import type { S3Config } from './uploaders/S3Uploader'
