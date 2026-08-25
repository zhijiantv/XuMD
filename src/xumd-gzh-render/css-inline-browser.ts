/**
 * 浏览器端 CSS 行内化工具
 *
 * 功能：
 * 1. 输入带 class 的 HTML（预览用）
 * 2. 使用 DOMParser 构建 DOM 树
 * 3. 基于预定义的 class→style 映射表，将 class 样式转为内联 style
 * 4. 彻底清除 var() CSS 变量、移除 <style> 标签、移除 class 属性
 * 5. 输出公众号可用的纯内联样式 HTML
 */

import type { ThemeTokens } from './types'

export interface CssInlineOptions {
  tokens: ThemeTokens
  removeStyleTags?: boolean
  removeClasses?: boolean
}

/**
 * 将 HTML 中的 class 样式转为内联 style，并清理 var() 和 style 标签
 */
export function inlineCss(html: string, options: CssInlineOptions): string {
  const { tokens, removeStyleTags = true, removeClasses = true } = options

  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div id="xumd-inline-root">${html}</div>`, 'text/html')
  const root = doc.getElementById('xumd-inline-root')
  if (!root) return html

  // 1. 清理 var() CSS 变量（在 style 属性中）
  cleanCssVars(root, tokens)

  // 2. 应用 class 对应的内联样式
  applyClassInlineStyles(root, tokens)

  // 3. 移除 <style> 标签
  if (removeStyleTags) {
    const styles = root.querySelectorAll('style')
    styles.forEach(s => s.remove())
  }

  // 4. 移除 class 属性（但保留 KaTeX / Mermaid 等第三方库/异步渲染必需的类）
  if (removeClasses) {
    const all = root.querySelectorAll('[class]')
    all.forEach(el => {
      // 保留 KaTeX 公式渲染所需的类（由 katex.min.css 提供样式）
      if (el.closest('.katex') || el.classList.contains('katex')) return
      // 保留 gzh-mermaid 类（供 renderMermaidInHtml 异步定位并替换为 SVG）
      if (el.classList.contains('gzh-mermaid')) return
      el.removeAttribute('class')
    })
  }

  return root.innerHTML
}

// ============================================================
// 清理 var() CSS 变量
// ============================================================

function cleanCssVars(root: HTMLElement, tokens: ThemeTokens): void {
  const allElements = root.querySelectorAll('*')
  const tokenMap = tokens as unknown as Record<string, string>

  allElements.forEach(el => {
    const styleAttr = el.getAttribute('style')
    if (!styleAttr || !styleAttr.includes('var(')) return

    let newStyle = styleAttr

    // 替换 var(--xxx) 为实际颜色值
    newStyle = newStyle.replace(/var\(--([a-zA-Z0-9-]+)\)/g, (_match, varName: string) => {
      // kebab-case → camelCase
      const camelName = kebabToCamel(varName)
      if (tokenMap[camelName] !== undefined) {
        return tokenMap[camelName]
      }
      if (tokenMap[varName] !== undefined) {
        return tokenMap[varName]
      }
      return '' // 找不到返回空
    })

    el.setAttribute('style', newStyle)
  })
}

function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (_m, letter: string) => letter.toUpperCase())
}

// ============================================================
// 应用 class 对应的内联样式
// ============================================================

function applyClassInlineStyles(root: HTMLElement, tokens: ThemeTokens): void {
  const allElements = root.querySelectorAll('[class]')

  allElements.forEach(el => {
    const classList = Array.from(el.classList)
    if (classList.length === 0) return

    let inlineStyles = ''
    for (const cls of classList) {
      const style = getClassStyle(cls, tokens)
      if (style) inlineStyles += style
    }

    if (inlineStyles) {
      const existingStyle = el.getAttribute('style') || ''
      el.setAttribute('style', inlineStyles + existingStyle)
    }
  })
}

/**
 * 获取 class 对应的内联样式
 * 这是 gzh-* 自定义 class 的样式映射
 */
function getClassStyle(className: string, tokens: ThemeTokens): string {
  const map: Record<string, string> = {
    // ==高亮==
    'gzh-highlight': `background:${tokens.highlightBg};padding:0 4px;border-radius:2px;font-weight:600;color:${tokens.titleColor};`,

    // 通用卡片
    'gzh-card': `margin:0 0 24px;padding:14px 18px;border-radius:8px;`,
    'gzh-card-body': `font-size:14px;color:${tokens.textColor};line-height:1.8;`,

    // tip 提示卡
    'gzh-card-tip': `background:${tokens.primaryBg};border-left:4px solid ${tokens.primary};`,
    'gzh-card-tip .gzh-card-title': '', // 已在 title 单独处理

    // warning 警告卡
    'gzh-card-warning': `background:${tokens.warningBg};border-left:4px solid ${tokens.warningColor};`,

    // info 信息卡
    'gzh-card-info': `background:${tokens.grayBg};border-left:4px solid ${tokens.secondaryTextColor};`,

    // 卡片标题
    'gzh-card-title': `margin:0 0 8px;font-size:14px;font-weight:700;color:${tokens.primaryDark};`,

    // FAQ
    'gzh-faq': `margin:0 0 24px;padding:16px 20px;background:${tokens.grayBg};border-radius:10px;`,
    'gzh-faq-q': `margin:0 0 10px;font-size:15px;font-weight:800;color:${tokens.titleColor};`,
    'gzh-faq-a': `font-size:14px;color:${tokens.textColor};line-height:1.8;`,

    // 章节标记
    'gzh-chapter': '',

    // 标记点（默认隐藏）
    'gzh-marker': `display:none;`,
    'gzh-marker-cover': '',
    'gzh-marker-toc': '',
    'gzh-marker-signature': ''
  }

  return map[className] || ''
}

// ============================================================
// 生成预览用的 CSS（class 形式）
// ============================================================

export function generatePreviewCss(tokens: ThemeTokens): string {
  return `
.gzh-highlight {
  background: ${tokens.highlightBg};
  padding: 0 4px;
  border-radius: 2px;
  font-weight: 600;
  color: ${tokens.titleColor};
}
.gzh-card {
  margin: 0 0 24px;
  padding: 14px 18px;
  border-radius: 8px;
}
.gzh-card-tip {
  background: ${tokens.primaryBg};
  border-left: 4px solid ${tokens.primary};
}
.gzh-card-warning {
  background: ${tokens.warningBg};
  border-left: 4px solid ${tokens.warningColor};
}
.gzh-card-info {
  background: ${tokens.grayBg};
  border-left: 4px solid ${tokens.secondaryTextColor};
}
.gzh-card-title {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 700;
  color: ${tokens.primaryDark};
}
.gzh-card-body {
  font-size: 14px;
  color: ${tokens.textColor};
  line-height: 1.8;
}
.gzh-faq {
  margin: 0 0 24px;
  padding: 16px 20px;
  background: ${tokens.grayBg};
  border-radius: 10px;
}
.gzh-faq-q {
  margin: 0 0 10px;
  font-size: 15px;
  font-weight: 800;
  color: ${tokens.titleColor};
}
.gzh-faq-a {
  font-size: 14px;
  color: ${tokens.textColor};
  line-height: 1.8;
}
.gzh-marker {
  display: none;
}
/* 水平滑动图组：预览区横向滚动，与公众号效果一致 */
.xumd-carousel {
  max-width: 100%;
  margin: 0 0 24px;
}
.xumd-carousel > section {
  overflow-x: scroll;
  -webkit-overflow-scrolling: touch;
  white-space: nowrap;
  width: 100%;
  font-size: 0;
}
.xumd-carousel > section > section {
  display: inline-block;
  width: 48%;
  margin-right: 2%;
  white-space: normal;
  vertical-align: top;
}
.xumd-carousel img {
  width: 100% !important;
  max-width: none !important;
  height: auto !important;
  border-radius: 12px;
  display: block;
}
/* 预览容器适配 */
.xumd-preview-wrapper {
  max-width: 677px;
  margin: 0 auto;
  padding: 20px;
}
  `.trim()
}
