/**
 * 第三方渲染库（KaTeX / Mermaid）的 CDN 懒加载器
 *
 * 公式与图表在公众号原生环境无法运行 JS 渲染，因此采用"浏览器端渲染 + 内联输出"方案：
 * - KaTeX：渲染数学公式为 HTML（预览可见；复制时结构内联，字体受公众号限制）
 * - Mermaid：渲染为自包含 SVG（复制到公众号可直接显示）
 *
 * 通过 CDN 动态加载，避免把这两个较重的库打进初始包，也规避了本地依赖安装受限的问题。
 * 加载结果用 Promise 缓存，多次调用只加载一次。
 */

const KATEX_JS = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js'
const KATEX_CSS = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css'
const MERMAID_JS = 'https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js'

let katexPromise: Promise<boolean> | null = null
let mermaidPromise: Promise<typeof import('mermaid').default> | null = null

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`)
    if (existing) {
      if ((existing as HTMLScriptElement).dataset.loaded === 'true') {
        resolve()
      } else {
        existing.addEventListener('load', () => resolve())
        existing.addEventListener('error', () => reject(new Error(`加载失败: ${src}`)))
      }
      return
    }
    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.onload = () => {
      script.dataset.loaded = 'true'
      resolve()
    }
    script.onerror = () => reject(new Error(`加载失败: ${src}`))
    document.head.appendChild(script)
  })
}

function loadStyle(href: string): void {
  const existing = document.querySelector(`link[href="${href}"]`)
  if (existing) return
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  document.head.appendChild(link)
}

/** 确保 KaTeX 已加载（JS + CSS）。返回是否成功加载 */
export function ensureKatex(): Promise<boolean> {
  if (katexPromise) return katexPromise
  katexPromise = (async () => {
    try {
      loadStyle(KATEX_CSS)
      await loadScript(KATEX_JS)
      return !!(window as unknown as { katex?: unknown }).katex
    } catch {
      return false
    }
  })()
  return katexPromise
}

/** 确保 Mermaid 已加载，返回 mermaid 实例 */
export function ensureMermaid(): Promise<typeof import('mermaid').default> {
  if (mermaidPromise) return mermaidPromise
  mermaidPromise = (async () => {
    await loadScript(MERMAID_JS)
    const m = (window as unknown as { mermaid?: typeof import('mermaid').default }).mermaid
    if (!m) throw new Error('mermaid 未初始化')
    return m
  })()
  return mermaidPromise
}
