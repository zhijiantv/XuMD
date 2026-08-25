/**
 * IndexedDB 存储适配器（复刻 WeMD 存储模式）
 *
 * 与 WeMD 一样，文章保存在浏览器 IndexedDB 中，而非 localStorage：
 * - 容量大（通常为数百 MB 起步），不会因为文章/Base64 图片过大而写入失败；
 * - 每篇文章独立读写，关闭页面也不会丢内容；
 * - 仅在「清除浏览器数据」时才会丢失。
 *
 * 存储结构复刻 WeMD：一个数据库，两个对象仓库（meta 存元信息，content 存正文）。
 * listFiles 会合并两者返回完整的 FileItem。
 */

import type { StorageAdapter, FileItem } from './types'

const DB_NAME = 'xumd-files'
const DB_VERSION = 2 // 升级版本以触发迁移
const META_STORE = 'meta'
const CONTENT_STORE = 'content'

interface MetaRecord {
  id: string
  title: string
  createdAt: number
  updatedAt: number
}

interface ContentRecord {
  id: string
  content: string
}

export class IndexedDBAdapter implements StorageAdapter {
  readonly type = 'indexeddb' as const
  readonly name = '浏览器存储'
  ready = false
  private db: IDBDatabase | null = null

  async init(): Promise<boolean> {
    try {
      this.db = await this.openDb()
      this.ready = true
      return true
    } catch (e) {
      console.warn('[XuMD] IndexedDB 初始化失败:', e)
      return false
    }
  }

  private openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(META_STORE)) {
          db.createObjectStore(META_STORE, { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains(CONTENT_STORE)) {
          db.createObjectStore(CONTENT_STORE, { keyPath: 'id' })
        }
      }
    })
  }

  private getStore(storeName: string, mode: IDBTransactionMode) {
    if (!this.db) throw new Error('IndexedDB 未初始化')
    return this.db.transaction(storeName, mode).objectStore(storeName)
  }

  async listFiles(): Promise<FileItem[]> {
    if (!this.db) return []
    const metas = await new Promise<MetaRecord[]>((resolve, reject) => {
      const req = this.getStore(META_STORE, 'readonly').getAll()
      req.onerror = () => reject(req.error)
      req.onsuccess = () => resolve((req.result as MetaRecord[]) || [])
    })
    const contents = await new Promise<ContentRecord[]>((resolve, reject) => {
      const req = this.getStore(CONTENT_STORE, 'readonly').getAll()
      req.onerror = () => reject(req.error)
      req.onsuccess = () => resolve((req.result as ContentRecord[]) || [])
    })
    const contentMap = new Map(contents.map((c) => [c.id, c.content]))
    const files: FileItem[] = metas.map((m) => ({
      id: m.id,
      title: m.title,
      content: contentMap.get(m.id) || '',
      createdAt: m.createdAt,
      updatedAt: m.updatedAt
    }))
    // 按编辑时间倒序排列（与 WeMD / 本地存储一致）
    files.sort((a, b) => b.updatedAt - a.updatedAt)
    return files
  }

  async readFile(id: string): Promise<FileItem | null> {
    if (!this.db) return null
    const meta = await new Promise<MetaRecord | undefined>((resolve, reject) => {
      const req = this.getStore(META_STORE, 'readonly').get(id)
      req.onerror = () => reject(req.error)
      req.onsuccess = () => resolve(req.result as MetaRecord | undefined)
    })
    if (!meta) return null
    const content = await new Promise<string>((resolve, reject) => {
      const req = this.getStore(CONTENT_STORE, 'readonly').get(id)
      req.onerror = () => reject(req.error)
      req.onsuccess = () =>
        resolve((req.result as ContentRecord | undefined)?.content || '')
    })
    return {
      id: meta.id,
      title: meta.title,
      content,
      createdAt: meta.createdAt,
      updatedAt: meta.updatedAt
    }
  }

  async writeFile(item: FileItem): Promise<void> {
    if (!this.db) throw new Error('IndexedDB 未初始化')
    const now = Date.now()
    const meta: MetaRecord = {
      id: item.id,
      title: item.title,
      createdAt: item.createdAt || now,
      updatedAt: item.updatedAt || now
    }
    const content: ContentRecord = { id: item.id, content: item.content }

    await new Promise<void>((resolve, reject) => {
      const tx = this.db!.transaction([META_STORE, CONTENT_STORE], 'readwrite')
      tx.objectStore(META_STORE).put(meta)
      tx.objectStore(CONTENT_STORE).put(content)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  }

  async deleteFile(id: string): Promise<void> {
    if (!this.db) return
    await new Promise<void>((resolve, reject) => {
      const tx = this.db!.transaction([META_STORE, CONTENT_STORE], 'readwrite')
      tx.objectStore(META_STORE).delete(id)
      tx.objectStore(CONTENT_STORE).delete(id)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  }

  async renameFile(oldId: string, newTitle: string): Promise<string> {
    if (!this.db) return oldId
    const existing = await this.readFile(oldId)
    if (!existing) return oldId
    await this.writeFile({
      ...existing,
      title: newTitle,
      updatedAt: Date.now()
    })
    return oldId
  }

  async createFile(title: string, content: string): Promise<FileItem> {
    const now = Date.now()
    const item: FileItem = {
      id: `article-${now}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      content,
      createdAt: now,
      updatedAt: now
    }
    await this.writeFile(item)
    return item
  }

  async exists(id: string): Promise<boolean> {
    if (!this.db) return false
    return new Promise<boolean>((resolve, reject) => {
      const req = this.getStore(META_STORE, 'readonly').getKey(id)
      req.onerror = () => reject(req.error)
      req.onsuccess = () => resolve(!!req.result)
    })
  }

  async teardown(): Promise<void> {
    this.db?.close()
    this.db = null
    this.ready = false
  }
}
