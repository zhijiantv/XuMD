/**
 * 本地文件夹存储适配器
 *
 * 使用浏览器 File System Access API 直接读写用户授权的本地文件夹中的 Markdown 文件。
 * 目录句柄持久化到 IndexedDB，下次打开可自动恢复。
 */

import type { StorageAdapter, FileItem } from './types'

// IndexedDB 中保存目录句柄的库名和表名
const DB_NAME = 'xumd-fs-handles'
const STORE_NAME = 'handles'
const HANDLE_KEY = 'root-handle'

// 从 markdown 内容中提取标题（第一个 # 开头的行）
function extractTitle(content: string): string {
  const match = content.match(/^#\s+(.+)$/m)
  if (match) return match[1].trim()
  // 没有标题则取第一行非空行
  const firstLine = content.split('\n').find(l => l.trim())
  return firstLine?.trim().substring(0, 50) || '未命名文章'
}

// 标题转安全文件名（替换非法字符）
function titleToFilename(title: string): string {
  const safe = title.replace(/[\\/:*?"<>|]/g, '_').trim()
  return (safe || '未命名文章') + '.md'
}

// 打开 IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

// 保存目录句柄到 IndexedDB
async function saveHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(handle, HANDLE_KEY)
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

// 从 IndexedDB 读取目录句柄
async function loadHandle(): Promise<FileSystemDirectoryHandle | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).get(HANDLE_KEY)
    req.onsuccess = () => { db.close(); resolve(req.result || null) }
    req.onerror = () => { db.close(); reject(req.error) }
  })
}

// 清除保存的目录句柄
async function clearHandle(): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(HANDLE_KEY)
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

export class FileSystemAdapter implements StorageAdapter {
  readonly type = 'filesystem'
  readonly name = '本地文件夹'
  ready = false
  private rootHandle: FileSystemDirectoryHandle | null = null

  /**
   * 初始化：尝试从 IndexedDB 恢复已授权的目录句柄
   * 如果没有保存的句柄，需要用户调用 pickFolder() 手动选择
   */
  async init(): Promise<boolean> {
    try {
      const handle = await loadHandle()
      if (handle) {
        // 验证句柄是否还有权限
        const opts: any = { mode: 'readwrite' }
        const permission = await (handle as any).requestPermission?.(opts)
        if (permission === 'granted') {
          this.rootHandle = handle
          this.ready = true
          return true
        }
      }
    } catch (e) {
      console.warn('Failed to restore filesystem handle:', e)
    }
    return false
  }

  /**
   * 弹出文件夹选择器，让用户授权一个文件夹
   */
  async pickFolder(): Promise<boolean> {
    try {
      const handle = await (window as any).showDirectoryPicker({
        mode: 'readwrite'
      })
      this.rootHandle = handle
      await saveHandle(handle)
      this.ready = true
      return true
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        console.warn('Failed to pick folder:', e)
      }
      return false
    }
  }

  // 递归扫描文件夹中的 .md 文件
  private async scanMdFiles(
    dirHandle: FileSystemDirectoryHandle,
    basePath = ''
  ): Promise<{ path: string; handle: FileSystemFileHandle }[]> {
    const results: { path: string; handle: FileSystemFileHandle }[] = []
    const dirAny = dirHandle as any
    if (!dirAny.entries) return results

    for await (const [name, handle] of dirAny.entries()) {
      const fullPath = basePath ? `${basePath}/${name}` : name
      if (handle.kind === 'file' && name.endsWith('.md')) {
        results.push({ path: fullPath, handle: handle as FileSystemFileHandle })
      } else if (handle.kind === 'directory') {
        // 跳过隐藏文件夹和 node_modules
        if (!name.startsWith('.') && name !== 'node_modules') {
          const subResults = await this.scanMdFiles(
            handle as FileSystemDirectoryHandle,
            fullPath
          )
          results.push(...subResults)
        }
      }
    }
    return results
  }

  async listFiles(): Promise<FileItem[]> {
    if (!this.rootHandle) return []
    const files: FileItem[] = []

    try {
      const mdFiles = await this.scanMdFiles(this.rootHandle)
      for (const { path, handle } of mdFiles) {
        try {
          const file = await handle.getFile()
          const content = await file.text()
          const title = extractTitle(content)
          files.push({
            id: path,
            title,
            content,
            createdAt: file.lastModified,
            updatedAt: file.lastModified
          })
        } catch (e) {
          console.warn(`Failed to read file ${path}:`, e)
        }
      }
    } catch (e) {
      console.warn('Failed to scan files:', e)
    }

    // 按修改时间倒序排列
    files.sort((a, b) => b.updatedAt - a.updatedAt)
    return files
  }

  async readFile(id: string): Promise<FileItem | null> {
    if (!this.rootHandle) return null
    try {
      const handle = await this.getFileHandle(id, false)
      if (!handle) return null
      const file = await handle.getFile()
      const content = await file.text()
      return {
        id,
        title: extractTitle(content),
        content,
        createdAt: file.lastModified,
        updatedAt: file.lastModified
      }
    } catch (e) {
      console.warn(`Failed to read file ${id}:`, e)
      return null
    }
  }

  // 根据路径获取文件句柄（支持子目录）
  private async getFileHandle(
    path: string,
    create: boolean
  ): Promise<FileSystemFileHandle | null> {
    if (!this.rootHandle) return null
    const parts = path.split('/')
    let currentDir: FileSystemDirectoryHandle = this.rootHandle

    // 处理目录部分
    for (let i = 0; i < parts.length - 1; i++) {
      try {
        currentDir = await currentDir.getDirectoryHandle(parts[i], { create })
      } catch {
        return null
      }
    }

    const fileName = parts[parts.length - 1]
    try {
      return await currentDir.getFileHandle(fileName, { create })
    } catch {
      return null
    }
  }

  async writeFile(item: FileItem): Promise<void> {
    if (!this.rootHandle) return
    try {
      const handle = await this.getFileHandle(item.id, true)
      if (!handle) return
      const writable = await (handle as any).createWritable()
      await writable.write(item.content)
      await writable.close()
    } catch (e) {
      console.warn(`Failed to write file ${item.id}:`, e)
      throw e
    }
  }

  async deleteFile(id: string): Promise<void> {
    if (!this.rootHandle) return
    const parts = id.split('/')
    let currentDir: FileSystemDirectoryHandle = this.rootHandle

    for (let i = 0; i < parts.length - 1; i++) {
      try {
        currentDir = await currentDir.getDirectoryHandle(parts[i])
      } catch {
        return
      }
    }

    const fileName = parts[parts.length - 1]
    try {
      await currentDir.removeEntry(fileName)
    } catch (e) {
      console.warn(`Failed to delete file ${id}:`, e)
    }
  }

  async renameFile(oldId: string, newTitle: string): Promise<string> {
    if (!this.rootHandle) return oldId

    // 读取旧文件内容
    const oldFile = await this.readFile(oldId)
    if (!oldFile) return oldId

    // 计算新文件名（在同一目录下）
    const parts = oldId.split('/')
    const dirPath = parts.slice(0, -1).join('/')
    const newFilename = titleToFilename(newTitle)
    const newId = dirPath ? `${dirPath}/${newFilename}` : newFilename

    if (newId === oldId) return oldId

    try {
      // 写入新文件
      await this.writeFile({
        ...oldFile,
        id: newId,
        title: newTitle,
        updatedAt: Date.now()
      })
      // 删除旧文件
      await this.deleteFile(oldId)
      return newId
    } catch (e) {
      console.warn('Failed to rename file:', e)
      return oldId
    }
  }

  async createFile(title: string, content: string): Promise<FileItem> {
    if (!this.rootHandle) {
      throw new Error('No root folder selected')
    }
    const now = Date.now()
    const filename = titleToFilename(title)
    const item: FileItem = {
      id: filename,
      title,
      content,
      createdAt: now,
      updatedAt: now
    }
    await this.writeFile(item)
    return item
  }

  // 断开连接（清除保存的句柄）
  async teardown(): Promise<void> {
    this.rootHandle = null
    this.ready = false
    await clearHandle()
  }
}

// 检测浏览器是否支持 File System Access API
export function supportsFileSystem(): boolean {
  return typeof (window as any).showDirectoryPicker === 'function'
}
