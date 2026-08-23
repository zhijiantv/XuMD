/**
 * 剪贴板复制组合式函数
 *
 * 公众号编辑器粘贴兼容性说明：
 * - navigator.clipboard.write() 保留文字内容，是公众号兼容的主方案
 * - execCommand('copy') 作为降级方案
 *
 * 复制策略（按优先级）：
 * 1. Clipboard API (navigator.clipboard.write + ClipboardItem) — 同时写入 text/html 和 text/plain
 * 2. execCommand('copy') + DOM selection — 富文本降级方案
 * 3. 纯文本 — 最终保底（仅当前两者都失败时）
 */

import { ref } from 'vue'

const copyState = ref<'idle' | 'success' | 'error'>('idle')
let copyTimer: ReturnType<typeof setTimeout> | null = null

export function useClipboard() {
  async function copyText(text: string): Promise<boolean> {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
      } else {
        copyTextFallback(text)
      }
      copyState.value = 'success'
      resetState()
      return true
    } catch (e) {
      console.warn('[XuMD] copyText failed:', e)
      copyState.value = 'error'
      resetState()
      return false
    }
  }

  /**
   * 复制 HTML 到剪贴板（富文本）— 公众号专用
   *
   * 复制策略（按优先级）：
   * 1. Clipboard API (navigator.clipboard.write + ClipboardItem) — 同时写入 text/html 和 text/plain
   * 2. execCommand('copy') + DOM selection — 富文本降级方案
   * 3. 纯文本 — 最终保底（仅当前两者都失败时）
   */
  async function copyHtml(html: string): Promise<boolean> {
    // ===== 主方案：Clipboard API =====
    if (navigator.clipboard && window.ClipboardItem && window.isSecureContext) {
      try {
        const htmlBlob = new Blob([html], { type: 'text/html' })
        const textBlob = new Blob([stripHtmlTags(html)], { type: 'text/plain' })
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': htmlBlob,
            'text/plain': textBlob
          })
        ])
        copyState.value = 'success'
        resetState()
        return true
      } catch (e) {
        console.warn('[XuMD] Clipboard API failed, trying execCommand:', e)
      }
    }

    // ===== 降级：execCommand =====
    try {
      const result = copyHtmlExecCommand(html)
      if (result) {
        copyState.value = 'success'
        resetState()
        return true
      }
    } catch (e) {
      console.warn('[XuMD] execCommand also failed:', e)
    }

    // ===== 最终保底：纯文本 =====
    return copyText(html)
  }

  function copyHtmlExecCommand(html: string): boolean {
    const container = document.createElement('div')
    container.innerHTML = html
    container.style.cssText = [
      'position:fixed',
      'top:-9999px',
      'left:-9999px',
      'opacity:0',
      'pointer-events:none',
      'white-space:normal'
    ].join(';')

    document.body.appendChild(container)
    void container.getBoundingClientRect()

    const range = document.createRange()
    range.selectNodeContents(container)

    const selection = window.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)

    let result = false
    try {
      result = document.execCommand('copy')
    } catch (e) {
      console.warn('[XuMD] execCommand error:', e)
    }

    selection?.removeAllRanges()
    document.body.removeChild(container)
    return result
  }

  function copyTextFallback(text: string): void {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.cssText = 'position:fixed;top:-9999px;opacity:0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  }

  function stripHtmlTags(html: string): string {
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }

  function resetState(): void {
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      copyState.value = 'idle'
    }, 2000)
  }

  return {
    copyText,
    copyHtml,
    copyState
  }
}
