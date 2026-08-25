/**
 * 存储适配器接口
 *
 * 定义统一的文章存储接口，支持多种存储后端：
 * - localStorage：浏览器本地存储（默认）
 * - filesystem：本地文件夹（File System Access API）
 */

export interface FileItem {
  id: string          // 唯一标识，文件系统中为相对路径
  title: string       // 标题（从 markdown 第一个 # 提取，或文件名）
  content: string     // markdown 内容
  createdAt: number   // 创建时间戳
  updatedAt: number   // 修改时间戳
}

export interface StorageAdapter {
  readonly type: 'indexeddb' | 'localStorage' | 'filesystem'
  readonly name: string
  readonly ready: boolean

  // 初始化
  init(): Promise<boolean>

  // 列出所有文章
  listFiles(): Promise<FileItem[]>

  // 读取单篇文章
  readFile(id: string): Promise<FileItem | null>

  // 写入/更新文章
  writeFile(item: FileItem): Promise<void>

  // 删除文章
  deleteFile(id: string): Promise<void>

  // 重命名文章
  renameFile(oldId: string, newTitle: string): Promise<string>  // 返回新 id

  // 新建文章
  createFile(title: string, content: string): Promise<FileItem>

  // 清理资源
  teardown?(): Promise<void>
}
