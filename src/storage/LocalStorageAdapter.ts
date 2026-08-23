/**
 * localStorage 存储适配器
 *
 * 将文章列表保存在浏览器 localStorage 中，简单可靠。
 */

import type { StorageAdapter, FileItem } from './types'

const STORAGE_PREFIX = 'xumd-editor:'

export class LocalStorageAdapter implements StorageAdapter {
  readonly type = 'localStorage'
  readonly name = '浏览器本地存储'
  ready = false
  private key: string

  constructor(key = 'default') {
    this.key = `${STORAGE_PREFIX}articles:${key}`
  }

  async init(): Promise<boolean> {
    this.ready = true
    return true
  }

  async listFiles(): Promise<FileItem[]> {
    const raw = localStorage.getItem(this.key)
    if (!raw) return []
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed.map((a: any) => ({
          id: a.id,
          title: a.title,
          content: a.content,
          createdAt: a.createdAt || Date.now(),
          updatedAt: a.updatedAt || Date.now()
        }))
      }
    } catch (e) {
      console.warn('Failed to parse localStorage articles:', e)
    }
    return []
  }

  private saveAll(files: FileItem[]): void {
    localStorage.setItem(this.key, JSON.stringify(files))
  }

  async readFile(id: string): Promise<FileItem | null> {
    const files = await this.listFiles()
    return files.find(f => f.id === id) || null
  }

  async writeFile(item: FileItem): Promise<void> {
    const files = await this.listFiles()
    const index = files.findIndex(f => f.id === item.id)
    if (index >= 0) {
      files[index] = item
    } else {
      files.unshift(item)
    }
    this.saveAll(files)
  }

  async deleteFile(id: string): Promise<void> {
    const files = await this.listFiles()
    const filtered = files.filter(f => f.id !== id)
    this.saveAll(filtered)
  }

  async renameFile(oldId: string, newTitle: string): Promise<string> {
    const files = await this.listFiles()
    const index = files.findIndex(f => f.id === oldId)
    if (index < 0) return oldId
    files[index].title = newTitle
    files[index].updatedAt = Date.now()
    this.saveAll(files)
    return oldId
  }

  async createFile(title: string, content: string): Promise<FileItem> {
    const now = Date.now()
    const item: FileItem = {
      id: `article-${now}`,
      title,
      content,
      createdAt: now,
      updatedAt: now
    }
    const files = await this.listFiles()
    files.unshift(item)
    this.saveAll(files)
    return item
  }
}
