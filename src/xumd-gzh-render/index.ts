/**
 * XuMD 公众号渲染模块 - 对外入口
 *
 * 使用方式：
 * import { gzhRender } from './xumd-gzh-render'
 * const { previewHtml, copyOutputHtml } = gzhRender(mdSource, config)
 *
 * 渲染流程：
 * 1. markdown-it 解析 + 自定义语法插件 → 中间 HTML（带 class 标记）
 * 2. DOMParser 构建 DOM 树，遍历节点用主题组件模板替换标准标签
 * 3. 对所有文本节点包裹 <span leaf="">
 * 4. 生成 previewHtml（带 class + <style>）和 copyOutputHtml（全内联）
 */

import MarkdownIt from 'markdown-it'
import { gzhMdPlugin } from './md-it-plugin'
import { wrapLeafDom } from './leaf-wrapper'
import { deriveTokens } from './color-derive'
import { inlineCss, generatePreviewCss } from './css-inline-browser'
import { getTheme } from './themes'
import { renderTemplate } from './template-parser'
import { ensureMermaid } from '../utils/lib-loader'

import type { RenderConfig, RenderResult, ThemeTokens, ThemeStructure, ComponentTemplates } from './types'

// 用于渲染 GitHub 提示块正文的独立 markdown-it 实例（复用自定义语法插件）
// 仅负责把提示块内部 markdown 源码渲染为中间 HTML，再由外层主题模板包裹
const fragmentMd = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: false,
  typographer: false
})
gzhMdPlugin(fragmentMd)

// GitHub 提示块配色（按类型区分，独立于主题，保证清晰可辨）
const ALERT_COLORS: Record<string, { color: string; bg: string }> = {
  NOTE: { color: '#2563eb', bg: '#eff6ff' },
  TIP: { color: '#059669', bg: '#ecfdf5' },
  IMPORTANT: { color: '#7c3aed', bg: '#f5f3ff' },
  WARNING: { color: '#d97706', bg: '#fffbeb' },
  CAUTION: { color: '#dc2626', bg: '#fef2f2' }
}

// 模块级：当前渲染配置与统计（供递归渲染 GitHub 提示块正文时使用）
let activeConfig: RenderConfig = { themeId: 'moyu-green', customColorEnabled: false }
let activeStats: { charCount: string; readTime: string } = { charCount: '', readTime: '' }

// 导出所有类型和工具
export * from './types'
export { getTheme, getThemeList, themes } from './themes'
export { deriveTokens } from './color-derive'
export { convertBase64ImagesForGzh }

/**
 * 公众号 Markdown 渲染入口函数
 */
export function gzhRender(mdSource: string, config: RenderConfig): RenderResult {
  // 1. 获取主题
  const theme = getTheme(config.themeId)
  if (!theme) {
    throw new Error(`Theme not found: ${config.themeId}`)
  }

  const { structure, tokens: defaultTokens } = theme

  // 2. 计算最终 tokens（合并用户自定义颜色）
  let finalTokens: ThemeTokens = { ...defaultTokens }
  if (config.customColorEnabled && config.customTokens) {
    if (config.customTokens.primary) {
      const derived = deriveTokens({
        primary: config.customTokens.primary,
        style: getDeriveStyle(structure.id)
      })
      finalTokens = { ...defaultTokens, ...derived }
    }
    finalTokens = { ...finalTokens, ...config.customTokens }
  }

  // 3. 初始化 markdown-it
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    breaks: false,
    typographer: false
  })
  gzhMdPlugin(md)

  // 4. 计算文章统计信息（基于原始 Markdown 内容）
  const stats = calculateStatsFromMarkdown(mdSource)

  // 5. Markdown → 中间 HTML（带 class 标记）
  activeConfig = config
  activeStats = stats
  const rawHtml = md.render(mdSource)

  // 6. DOM 后处理：用主题组件替换标准标签
  const themedHtml = applyThemeStructure(rawHtml, structure, finalTokens, config, stats)

  // 7. 文本节点包裹 leaf（DOM 级别操作）
  const leafHtml = wrapLeafDom(themedHtml)

  // 8. 生成预览版 HTML
  const previewCss = generatePreviewCss(finalTokens)
  const previewHtml = `<style>${previewCss}</style>\n${leafHtml}`

  // 9. 生成公众号复制版 HTML（全内联样式 + 移除 class/style + 清理 leaf span）
  let copyOutputHtml = inlineCss(leafHtml, {
    tokens: finalTokens,
    removeStyleTags: true,
    removeClasses: true
  })

  // 10. 清理所有 <span leaf=""> 包裹 — 公众号编辑器不兼容嵌套的 leaf span
  //     预览版保留 leaf span（用于 CSS 样式定位），复制版移除（保证公众号兼容）
  copyOutputHtml = unwrapLeafSpans(copyOutputHtml)

  // 11. 移动端兼容：公众号助手 App / 移动端渲染器不支持 display:flex，
  //     把 flex 横向布局转换为 table 布局，避免封面被拉长、布局错乱。
  //     仅作用于复制输出，不影响编辑器预览。
  if (config.mobileCompat) {
    copyOutputHtml = flexToTable(copyOutputHtml)
  }

  return {
    previewHtml: previewHtml.trim(),
    copyOutputHtml: copyOutputHtml.trim()
  }
}

/**
 * 根据主题 ID 获取派生风格
 */
function getDeriveStyle(themeId: string): 'default' | 'minimal' | 'zen' | 'warm' | 'cool' {
  const styleMap: Record<string, 'default' | 'minimal' | 'zen' | 'warm' | 'cool'> = {
    'moyu-green': 'default',
    'moyu-ticket': 'default',
    'red-white': 'warm',
    'graphite-min': 'minimal',
    'zen-empty': 'zen',
    'olive-note': 'warm'
  }
  return styleMap[themeId] || 'default'
}

// ============================================================
// 主题结构应用 - 基于 DOMParser 的 DOM 后处理
// ============================================================

function applyThemeStructure(
  html: string,
  structure: ThemeStructure,
  tokens: ThemeTokens,
  config: RenderConfig,
  stats: { charCount: string; readTime: string }
): string {
  const components = structure.components
  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div id="xumd-root">${html}</div>`, 'text/html')
  const root = doc.getElementById('xumd-root')
  if (!root) return html

  // ============================================================
  // 第一遍：预扫描所有 h2 章节标题（按文档正序）
  // 用于：1) 章节序号（正序） 2) 目录生成（无论目录在章节前后）
  // ============================================================
  const chapterTitles: string[] = []
  const h2Elements = root.querySelectorAll('h2')
  h2Elements.forEach(h2 => {
    const text = h2.textContent?.trim() || ''
    if (text) chapterTitles.push(text)
  })

  // 章节计数器（正序，从 1 开始）
  let chapterIndex = 0
  let stepIndex = 0

  // 从后往前遍历子节点，避免 DOM 修改影响遍历
  function processNode(node: Node): void {
    // 只处理元素节点
    if (node.nodeType !== Node.ELEMENT_NODE) return
    const el = node as HTMLElement

    // 递归处理子节点（先处理子节点，再处理自身）
    // 需要从后往前处理子元素，防止替换后索引错乱
    const children = Array.from(el.children).reverse()
    for (const child of children) {
      processNode(child)
    }

    // 处理各种标签
    switch (el.tagName.toLowerCase()) {
      case 'h1':
        replaceH1(el, components, tokens, structure)
        break
      case 'h2':
        chapterIndex++
        replaceH2(el, components, tokens, structure, chapterIndex, chapterTitles.length)
        break
      case 'h3':
        replaceH3(el, components, tokens, structure)
        break
      case 'p':
        replaceParagraph(el, components, tokens, structure)
        break
      case 'blockquote':
        replaceBlockquote(el, components, tokens, structure)
        break
      case 'ul':
        replaceUl(el, components, tokens, structure)
        break
      case 'ol':
        replaceOl(el, components, tokens, structure)
        break
      case 'pre':
        replacePre(el, components, tokens, structure)
        break
      case 'code':
        // 行内 code（非 pre 下的 code）
        if (el.parentElement?.tagName.toLowerCase() !== 'pre') {
          replaceInlineCode(el, components, tokens, structure)
        }
        break
      case 'img':
        replaceImg(el, components, tokens, structure)
        break
      case 'strong':
        replaceStrong(el, components, tokens, structure)
        break
      case 'em':
        replaceEm(el, components, tokens, structure)
        break
      case 's':
      case 'del':
        replaceDelete(el, components, tokens, structure)
        break
      case 'hr':
        replaceHr(el, components, tokens, structure)
        break
      case 'table':
        replaceTable(el, components, tokens, structure)
        break
      case 'a':
        // 链接保持，但添加颜色
        el.style.color = tokens.primary
        el.style.textDecoration = 'underline'
        break
    }

    // 处理自定义 class 的元素（由 markdown-it 插件生成）
    if (el.classList.contains('gzh-highlight')) {
      replaceHighlight(el, components, tokens, structure)
    }
    if (el.classList.contains('gzh-card')) {
      replaceCard(el, components, tokens, structure)
    }
    if (el.classList.contains('gzh-faq')) {
      replaceFaq(el, components, tokens, structure)
    }
    if (el.classList.contains('gzh-marker')) {
      replaceMarker(el, components, tokens, structure, config, doc, stats, chapterTitles)
    }
    if (el.classList.contains('gzh-quote-highlight')) {
      replaceQuoteHighlight(el, components, tokens, structure)
    }
    if (el.classList.contains('gzh-step-item')) {
      replaceStepItem(el, components, tokens, structure, stepIndex)
      stepIndex++
    }
    if (el.classList.contains('gzh-timeline')) {
      replaceTimeline(el, components, tokens, structure)
    }
    if (el.classList.contains('gzh-pill-tag')) {
      replacePillTag(el, components, tokens, structure)
    }
    if (el.classList.contains('gzh-hr')) {
      replaceHr(
        el, components, tokens, structure,
        el.getAttribute('data-variant') || 'solid',
        el.getAttribute('data-text') || ''
      )
    }
    if (el.classList.contains('gzh-carousel')) {
      replaceCarousel(el, components, tokens, structure)
    }
    if (el.classList.contains('gzh-github-alert')) {
      replaceGithubAlert(el, components, tokens, structure)
    }
    if (el.classList.contains('gzh-task-item')) {
      replaceTaskItem(el, components, tokens, structure)
    }
    if (el.classList.contains('gzh-underline')) {
      replaceUnderline(el, components, tokens, structure)
    }
    if (el.classList.contains('gzh-math-block') || el.classList.contains('gzh-math-inline')) {
      replaceMath(el, components, tokens, structure)
    }
    if (el.classList.contains('gzh-mermaid')) {
      replaceMermaid(el, components, tokens, structure)
    }
    if (el.classList.contains('gzh-attr-marker')) {
      replaceAttrMarker(el, doc)
    }
  }

  processNode(root)

  // 取出处理后的内容
  const content = root.innerHTML

  // 包裹全局容器
  return renderTemplate(components.container, {
    tokens,
    structure,
    vars: { content }
  })
}

// ---------- 替换辅助函数 ----------

function replaceWith(el: HTMLElement, html: string): void {
  const template = document.createElement('template')
  template.innerHTML = html.trim()
  const fragment = template.content
  el.replaceWith(fragment)
}

function getInnerText(el: HTMLElement): string {
  return el.textContent?.trim() || ''
}

function getInnerHtml(el: HTMLElement): string {
  return el.innerHTML
}

// h2 → 章节标题
function replaceH2(
  el: HTMLElement,
  components: ComponentTemplates,
  tokens: ThemeTokens,
  structure: ThemeStructure,
  index: number,
  total: number
): void {
  const title = getInnerText(el)
  // 计算正序序号：由于处理是倒序的，index 从 1 开始递增（最后一个章节）
  // 我们需要正序，所以用 total - index + 1
  const orderIndex = total - index + 1
  const indexStr = String(orderIndex).padStart(2, '0')
  const html = renderTemplate(components.chapterTitle, {
    tokens,
    structure,
    vars: {
      index: indexStr,
      title,
      content: ''  // 章节内容在标题之后，由外层结构包裹
    }
  })
  // 章节标题组件自带容器，直接替换 h2
  replaceWith(el, html)
}

// h1 → 一级标题
function replaceH1(
  el: HTMLElement,
  components: ComponentTemplates,
  tokens: ThemeTokens,
  structure: ThemeStructure
): void {
  const content = getInnerText(el)
  const html = renderTemplate(components.heading1, {
    tokens,
    structure,
    vars: { content }
  })
  replaceWith(el, html)
}

// h3 → 三级标题
function replaceH3(
  el: HTMLElement,
  components: ComponentTemplates,
  tokens: ThemeTokens,
  structure: ThemeStructure
): void {
  const content = getInnerText(el)
  const html = renderTemplate(components.heading3, {
    tokens,
    structure,
    vars: { content }
  })
  replaceWith(el, html)
}

// p → 正文段落
function replaceParagraph(
  el: HTMLElement,
  components: ComponentTemplates,
  tokens: ThemeTokens,
  structure: ThemeStructure
): void {
  // 如果段落已经被组件包裹（父级有 gzh- 类），跳过
  let parent = el.parentElement
  while (parent) {
    if (parent.classList && Array.from(parent.classList).some(c => c.startsWith('gzh-'))) {
      return
    }
    parent = parent.parentElement
  }

  // 如果段落包含图片，跳过（图片组件自己处理）
  if (el.querySelector('img')) return

  const content = getInnerHtml(el)
  // 空段落跳过
  if (!content.trim()) return

  const html = renderTemplate(components.paragraph, {
    tokens,
    structure,
    vars: { content }
  })
  replaceWith(el, html)
}

// blockquote → 引用
function replaceBlockquote(
  el: HTMLElement,
  components: ComponentTemplates,
  tokens: ThemeTokens,
  structure: ThemeStructure
): void {
  // 收集 blockquote 内的每一块内容（段落、列表项等），逐行保留
  const lines: string[] = []
  Array.from(el.children).forEach(child => {
    const tag = child.tagName.toLowerCase()
    if (tag === 'p') {
      // 段落：直接取内容
      lines.push(child.innerHTML.trim())
    } else if (tag === 'ul' || tag === 'ol') {
      // 列表：每个 li 为一行
      const lis = child.querySelectorAll('li')
      lis.forEach(li => {
        lines.push(li.innerHTML.trim())
      })
    } else {
      // 其他元素直接取内容
      const html = (child as HTMLElement).innerHTML?.trim()
      if (html) lines.push(html)
    }
  })
  // 用 <br> 连接多行，保证换行显示
  const content = lines.join('<br>')
  const html = renderTemplate(components.quote, {
    tokens,
    structure,
    vars: { content }
  })
  replaceWith(el, html)
}

// ul → 无序列表
function replaceUl(
  el: HTMLElement,
  components: ComponentTemplates,
  tokens: ThemeTokens,
  structure: ThemeStructure
): void {
  const items: string[] = []
  // 只获取直接子元素 <li>，避免重复处理嵌套列表中的 <li>
  Array.from(el.children).forEach(child => {
    if (child.tagName.toLowerCase() === 'li') {
      const content = child.innerHTML.trim()
      // 嵌套列表已由递归 processNode 先行渲染为 <section>，
      // 把 section 提取出来作为独立列表项跟在父项后面，避免被包进 pill 背景里
      const { text, sectionsHtml } = extractNestedSections(content)
      const indentedSections = indentNestedListItems(sectionsHtml)
      const itemHtml = renderTemplate(components.unorderedListItem, {
        tokens,
        structure,
        vars: { content: text }
      })
      items.push(itemHtml + indentedSections)
    }
  })
  replaceWith(el, items.join(''))
}

// ol → 有序列表
function replaceOl(
  el: HTMLElement,
  components: ComponentTemplates,
  tokens: ThemeTokens,
  structure: ThemeStructure
): void {
  const items: string[] = []
  // 只获取直接子元素 <li>，避免重复处理嵌套列表中的 <li>
  let idx = 0
  Array.from(el.children).forEach(child => {
    if (child.tagName.toLowerCase() === 'li') {
      const content = child.innerHTML.trim()
      // 嵌套列表已由递归 processNode 先行渲染为 <section>，
      // 把 section 提取出来作为独立列表项跟在父项后面，避免被包进父项结构中
      const { text, sectionsHtml } = extractNestedSections(content)
      const indentedSections = indentNestedListItems(sectionsHtml)
      const itemHtml = renderTemplate(components.orderedListItem, {
        tokens,
        structure,
        vars: {
          content: text,
          index: String(++idx).padStart(2, '0')
        }
      })
      items.push(itemHtml + indentedSections)
    }
  })
  replaceWith(el, items.join(''))
}

/**
 * 从列表项内容中分离出文本（含行内元素）和嵌套子列表 <section>
 *
 * processNode 递归处理子节点后，嵌套 <ul>/<ol> 已经被替换成若干 <section>。
 * 如果不把它们提取为独立兄弟元素，section 会被包进父项的 inline-block pill 背景里，
 * 导致编辑器预览中嵌套项和父项共享同一个胶囊背景。
 */
function extractNestedSections(contentHtml: string): { text: string; sectionsHtml: string } {
  if (!contentHtml || !contentHtml.includes('<section')) {
    return { text: contentHtml, sectionsHtml: '' }
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div id="xumd-extract">${contentHtml}</div>`, 'text/html')
  const wrapper = doc.getElementById('xumd-extract')
  if (!wrapper) return { text: contentHtml, sectionsHtml: '' }

  let text = ''
  const sections: string[] = []
  Array.from(wrapper.childNodes).forEach(node => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement
      if (el.tagName.toLowerCase() === 'section') {
        sections.push(el.outerHTML)
      } else {
        text += el.outerHTML
      }
    } else if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent || ''
    }
  })

  return { text: text.trim(), sectionsHtml: sections.join('') }
}

/**
 * 给列表项内容中嵌套的子列表 <section> 添加左侧缩进
 *
 * 由于 processNode 递归是先深后宽（先子节点后自身），
 * 当 replaceUl/replaceOl 处理外层列表时，内层 <ul>/<ol>
 * 已经被替换成了若干 <section>（子列表项模板）。
 * 这些 section 如果不加 padding-left，就会跟父级列表项对齐，
 * 无法体现嵌套层级。
 */
function indentNestedListItems(contentHtml: string): string {
  if (!contentHtml || !contentHtml.includes('<section')) return contentHtml

  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div id="xumd-indent">${contentHtml}</div>`, 'text/html')
  const wrapper = doc.getElementById('xumd-indent')
  if (!wrapper) return contentHtml

  // 移除 Markdown 换行/插件可能产生的空段落，避免嵌套列表后出现空行
  Array.from(wrapper.children).forEach(child => {
    if (child.tagName.toLowerCase() === 'p' && (child.textContent || '').trim() === '') {
      child.remove()
    }
  })

  // 给内容中顶层（直接子元素）的 section 加缩进
  // 这些 section 是嵌套列表被 replaceUl/replaceOl 替换后的产物
  const sections = Array.from(wrapper.children).filter(
    child => child.tagName.toLowerCase() === 'section'
  ) as HTMLElement[]

  sections.forEach((child) => {
    const existing = child.getAttribute('style') || ''
    const separator = existing && !existing.endsWith(';') ? ';' : ''
    // 保持嵌套列表项本身的 margin-bottom（来自模板），确保与普通列表项间距一致
    child.setAttribute(
      'style',
      `${existing}${separator}padding-left:20px;margin-top:8px;`
    )
  })

  return wrapper.innerHTML
}

// pre → 代码块
function replacePre(
  el: HTMLElement,
  components: ComponentTemplates,
  tokens: ThemeTokens,
  structure: ThemeStructure
): void {
  const codeEl = el.querySelector('code')
  if (!codeEl) return

  // 获取语言
  let lang = 'code'
  const classAttr = codeEl.getAttribute('class') || ''
  const langMatch = classAttr.match(/language-([\w+-]+)/)
  if (langMatch) lang = langMatch[1]

  // 获取代码内容，按行拆分
  const rawCode = codeEl.textContent || ''
  const lines = rawCode.split('\n').filter(line => line.length > 0 || line.trim().length > 0)
  // 移除首尾空行
  while (lines.length > 0 && lines[0].trim() === '') lines.shift()
  while (lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop()

  const codeLines = lines.map(line =>
    `<p style="margin:0;font-family:'SF Mono',Consolas,Monaco,monospace;font-size:13px;line-height:1.6;color:${tokens.codeTextDark};white-space:pre-wrap;word-break:break-all;"><span leaf="${escapeHtml(line)}">${escapeHtml(line)}</span></p>`
  ).join('')

  const html = renderTemplate(components.codeBlockDark, {
    tokens,
    structure,
    vars: { lang, content: codeLines }
  })
  replaceWith(el, html)
}

// 行内 code
function replaceInlineCode(
  el: HTMLElement,
  components: ComponentTemplates,
  tokens: ThemeTokens,
  structure: ThemeStructure
): void {
  const content = getInnerText(el)
  const html = renderTemplate(components.inlineCode, {
    tokens,
    structure,
    vars: { content }
  })
  replaceWith(el, html)
}

// img → 图片组件
function replaceImg(
  el: HTMLElement,
  components: ComponentTemplates,
  tokens: ThemeTokens,
  structure: ThemeStructure
): void {
  const src = el.getAttribute('src') || ''
  const alt = el.getAttribute('alt') || ''

  let html: string
  if (alt) {
    html = renderTemplate(components.imageWithCaption, {
      tokens,
      structure,
      vars: { src, caption: alt }
    })
  } else {
    html = renderTemplate(components.image, {
      tokens,
      structure,
      vars: { src }
    })
  }
  replaceWith(el, html)
}

// strong → 加粗
function replaceStrong(
  el: HTMLElement,
  components: ComponentTemplates,
  tokens: ThemeTokens,
  structure: ThemeStructure
): void {
  const content = getInnerHtml(el)
  const html = renderTemplate(components.inlineStrong, {
    tokens,
    structure,
    vars: { content }
  })
  replaceWith(el, html)
}

// em → 斜体（公众号不保证渲染语义 <em>，必须显式 font-style:italic）
function replaceEm(
  el: HTMLElement,
  components: ComponentTemplates,
  tokens: ThemeTokens,
  structure: ThemeStructure
): void {
  const content = getInnerHtml(el)
  const html = renderTemplate(components.inlineEm, {
    tokens,
    structure,
    vars: { content }
  })
  replaceWith(el, html)
}

// s / del → 删除线（显式 text-decoration:line-through，不依赖语义标签）
function replaceDelete(
  el: HTMLElement,
  components: ComponentTemplates,
  tokens: ThemeTokens,
  structure: ThemeStructure
): void {
  const content = getInnerHtml(el)
  const html = renderTemplate(components.inlineDelete, {
    tokens,
    structure,
    vars: { content }
  })
  replaceWith(el, html)
}

// hr → 分割线（支持多种样式：solid / dashed / double / dot / diamond / text）
function replaceHr(
  el: HTMLElement,
  components: ComponentTemplates,
  tokens: ThemeTokens,
  structure: ThemeStructure,
  variant = 'solid',
  text = ''
): void {
  let template: string
  switch (variant) {
    case 'dashed':
      template = components.dividerDashed
      break
    case 'double':
      template = components.dividerDouble
      break
    case 'dot':
      template = components.dividerDot
      break
    case 'diamond':
      template = components.dividerDiamond
      break
    case 'text':
      template = components.dividerText
      break
    case 'primary':
      template = components.dividerPrimary
      break
    case 'primary-bold':
      template = components.dividerPrimaryBold
      break
    case 'primary-gradient':
      template = components.dividerPrimaryGradient
      break
    case 'primary-dotted':
      template = components.dividerPrimaryDotted
      break
    case 'solid':
    default:
      template = components.dividerSolid
      break
  }
  const html = renderTemplate(template, {
    tokens,
    structure,
    vars: { text: escapeHtml(text) }
  })
  replaceWith(el, html)
}

// ==高亮== 行内语法
function replaceHighlight(
  el: HTMLElement,
  components: ComponentTemplates,
  tokens: ThemeTokens,
  structure: ThemeStructure
): void {
  const content = getInnerText(el)
  const html = renderTemplate(components.inlineHighlight, {
    tokens,
    structure,
    vars: { content }
  })
  replaceWith(el, html)
}

// tip / warning / info 卡片 → 主题卡片模板
function replaceCard(
  el: HTMLElement,
  components: ComponentTemplates,
  tokens: ThemeTokens,
  structure: ThemeStructure
): void {
  // 从 class 中识别卡片类型：gzh-card-tip / gzh-card-warning / gzh-card-info
  let cardType = 'tip'
  if (el.classList.contains('gzh-card-warning')) cardType = 'warning'
  else if (el.classList.contains('gzh-card-info')) cardType = 'info'

  // 获取标题
  const titleEl = el.querySelector('.gzh-card-title')
  const title = titleEl?.textContent?.trim() || ''

  // 获取正文内容（body 内部已经过子节点递归处理，保留 HTML）
  const bodyEl = el.querySelector('.gzh-card-body')
  const content = bodyEl ? bodyEl.innerHTML.trim() : ''

  const templateKey = `${cardType}Card` as keyof ComponentTemplates
  const template = components[templateKey]
  if (!template) return

  const html = renderTemplate(template, {
    tokens,
    structure,
    vars: { title, content }
  })
  replaceWith(el, html)
}

// FAQ 问答卡 → 主题 FAQ 模板
function replaceFaq(
  el: HTMLElement,
  components: ComponentTemplates,
  tokens: ThemeTokens,
  structure: ThemeStructure
): void {
  const qEl = el.querySelector('.gzh-faq-q')
  const question = qEl?.textContent?.trim() || ''

  const aEl = el.querySelector('.gzh-faq-a')
  const content = aEl ? aEl.innerHTML.trim() : ''

  const html = renderTemplate(components.faqCard, {
    tokens,
    structure,
    vars: { question, content }
  })
  replaceWith(el, html)
}

// 特殊标记（封面、目录、签名）
function replaceMarker(
  el: HTMLElement,
  components: ComponentTemplates,
  tokens: ThemeTokens,
  structure: ThemeStructure,
  config: RenderConfig,
  _doc: Document,
  stats: { charCount: string; readTime: string },
  chapterTitles: string[]
): void {
  // 封面
  if (el.classList.contains('gzh-marker-cover')) {
    // 优先从 data 属性中获取用户自定义的封面内容（:::cover 语法）
    let title = el.getAttribute('data-title') || ''
    let subtitle = el.getAttribute('data-subtitle') || ''
    const topText = el.getAttribute('data-top') || ''
    const tagText = el.getAttribute('data-tag') || ''
    const imageUrl = el.getAttribute('data-image') || ''
    const bottomTextCustom = el.getAttribute('data-bottom') || ''
    const dateCustom = el.getAttribute('data-date') || ''

    // 如果没有自定义内容，从配置中获取
    if (!title) {
      title = config.coverTitle || '文章标题'
    }
    if (!subtitle) {
      subtitle = config.coverSubtitle || config.authorName || '副标题 / 作者信息'
    }

    // 日期：优先用户自定义，否则当前日期
    const today = new Date()
    const dateStr = dateCustom || `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`

    // 顶部右侧：日期 + 字数
    const topRightText = `${dateStr} · ${stats.charCount}字`

    // 顶部左侧：用户自定义 top，默认"原创文章"
    const topLeftText = topText || '原创文章'

    // 标签：支持多标签（多个 tag: 行用 ||| 分隔，或单行逗号分隔）
    // 渲染为多个 #标签名 pill，用间距隔开
    const tagsHtml = renderCoverTags(tagText, tokens)

    // 底部横条文字：用户自定义 bottom，否则默认日期+字数+阅读时间
    const bottomDisplay = bottomTextCustom || topRightText

    // 使用有图/无图模板
    const hasImage = !!(imageUrl || config.coverImage)
    const template = hasImage ? components.coverWithImage : components.coverNoImage
    const html = renderTemplate(template, {
      tokens,
      structure,
      vars: {
        title,
        subtitle,
        image: imageUrl || config.coverImage || '',
        // 顶部左侧文字（原"原创文章"位置）
        tag: topLeftText,
        top: topLeftText,
        // 顶部右侧：日期+字数+阅读时间
        date: topRightText,
        topRight: topRightText,
        // 标签（分割线下方，多标签 HTML）
        tagText: tagsHtml,
        tagLabel: tagsHtml,
        tagsHtml: tagsHtml,
        // 底部横条文字
        bottomText: bottomDisplay,
        bottom: bottomDisplay,
        charCount: stats.charCount,
        readTime: stats.readTime,
        // 兼容其他主题使用的变量名
        author: config.authorName || 'XuMD 用户',
        highlight: '精选'
      }
    })
    replaceWith(el, html)
    return
  }

  // 目录
  if (el.classList.contains('gzh-marker-toc')) {
    // 使用预扫描的章节标题列表（无论目录在章节之前还是之后都能正确生成）
    const items: string[] = []
    chapterTitles.forEach((text, index) => {
      const isActive = index === 0
      const itemTpl = isActive ? components.tocItemActive : components.tocItem
      const itemHtml = renderTemplate(itemTpl, {
        tokens,
        structure,
        vars: {
          index: String(index + 1).padStart(2, '0'),
          title: text
        }
      })
      items.push(itemHtml)
    })

    const tocHtml = renderTemplate(components.toc, {
      tokens,
      structure,
      vars: {
        items: items.join('')
      }
    })
    replaceWith(el, tocHtml)
    return
  }

  // 签名
  if (el.classList.contains('gzh-marker-signature')) {
    // 优先使用 [签名 自定义文字] 格式的自定义内容
    const customContent = el.getAttribute('data-content') || ''
    const content = customContent || config.authorName || '感谢阅读，欢迎分享'
    const html = renderTemplate(components.signature, {
      tokens,
      structure,
      vars: { content }
    })
    replaceWith(el, html)
  }
}

// table → 主题表格
function replaceTable(
  el: HTMLElement,
  components: ComponentTemplates,
  tokens: ThemeTokens,
  structure: ThemeStructure
): void {
  const thead = el.querySelector('thead')
  const tbody = el.querySelector('tbody')

  // 表头
  let headers = ''
  if (thead) {
    const ths = thead.querySelectorAll('th')
    ths.forEach(th => {
      headers += renderTemplate(components.tableHeader, {
        tokens,
        structure,
        vars: { content: th.textContent?.trim() || '' }
      })
    })
  }

  // 表体
  let rows = ''
  if (tbody) {
    const trs = tbody.querySelectorAll('tr')
    trs.forEach(tr => {
      const tds = tr.querySelectorAll('td')
      let cells = ''
      tds.forEach((td, idx) => {
        const content = td.innerHTML
        const isLast = idx === tds.length - 1
        cells += `<td style="padding:8px 12px;border-bottom:1px solid ${tokens.borderColor};color:${tokens.textColor};font-size:13px;${!isLast ? `border-right:1px solid ${tokens.borderColor};` : ''}">${content}</td>`
      })
      rows += renderTemplate(components.tableRow, {
        tokens,
        structure,
        vars: { cells }
      })
    })
  }

  const html = renderTemplate(components.table, {
    tokens,
    structure,
    vars: { headers, rows }
  })
  replaceWith(el, html)
}

// ---------- 新增组件渲染函数 ----------

// 引用高亮（金句卡）:::quote
function replaceQuoteHighlight(
  el: HTMLElement,
  components: ComponentTemplates,
  tokens: ThemeTokens,
  _structure: ThemeStructure
): void {
  const content = el.getAttribute('data-content') || el.textContent || ''
  const html = renderTemplate(components.quoteHighlight, {
    tokens,
    vars: { content: escapeHtml(content) }
  })
  replaceWith(el, html)
}

// 步骤列表 > step
function replaceStepItem(
  el: HTMLElement,
  components: ComponentTemplates,
  tokens: ThemeTokens,
  _structure: ThemeStructure,
  index: number
): void {
  const title = el.getAttribute('data-title') || ''
  const desc = el.getAttribute('data-desc') || ''
  const stepIndex = String(index + 1).padStart(2, '0')
  const html = renderTemplate(components.stepItem, {
    tokens,
    vars: {
      index: stepIndex,
      title: escapeHtml(title),
      content: escapeHtml(desc)
    }
  })
  replaceWith(el, html)
}

// 行内药丸标签 [tag:xxx]
function replacePillTag(
  el: HTMLElement,
  components: ComponentTemplates,
  tokens: ThemeTokens,
  _structure: ThemeStructure
): void {
  const content = el.getAttribute('data-content') || el.textContent || ''
  const html = renderTemplate(components.pillTag, {
    tokens,
    vars: { content: escapeHtml(content) }
  })
  replaceWith(el, html)
}

// 时间线 :::timeline
function replaceTimeline(
  el: HTMLElement,
  components: ComponentTemplates,
  tokens: ThemeTokens,
  _structure: ThemeStructure
): void {
  let items: Array<{ date: string; text: string }> = []
  try {
    const raw = el.getAttribute('data-items')
    if (raw) items = JSON.parse(raw)
  } catch { /* ignore */ }

  if (!components.timeline) {
    // 主题未定义 timeline 模板时，降级为普通列表
    let html = '<section style="margin:0 0 24px;">'
    items.forEach((item, i) => {
      const isLast = i === items.length - 1
      html += `<p style="margin:0 0 8px;color:${tokens.textColor};font-size:14px;line-height:1.8;">`
      html += `<span style="color:${tokens.primary};font-weight:700;margin-right:8px;">${escapeHtml(item.date)}</span>`
      html += `<span leaf="">${escapeHtml(item.text)}</span>`
      html += '</p>'
      if (!isLast) {
        html += `<p style="margin:0 0 8px;"><span leaf="">&nbsp;</span></p>`
      }
    })
    html += '</section>'
    replaceWith(el, html)
    return
  }

  let itemsHtml = ''
  items.forEach((item, i) => {
    const isLast = i === items.length - 1
    itemsHtml += renderTemplate(components.timelineItem || '<p>{{text}}</p>', {
      tokens,
      vars: {
        date: escapeHtml(item.date),
        text: escapeHtml(item.text),
        isLast: isLast ? '1' : ''
      }
    })
  })

  const html = renderTemplate(components.timeline, {
    tokens,
    vars: { items: itemsHtml }
  })
  replaceWith(el, html)
}

// ---------- 工具函数 ----------

/**
 * 将封面 tag 原始字符串渲染为多个标签 pill 的 HTML
 *
 * 支持两种多标签写法：
 *   1. 多个 tag: 行（解析器用 ||| 分隔）
 *   2. 单行逗号分隔：tag: 标签1, 标签2, 标签3
 *
 * 输出示例（2 个标签）：
 *   <span style="...">#标签1</span> <span style="...">#标签2</span>
 */
function renderCoverTags(tagRaw: string, tokens: ThemeTokens): string {
  if (!tagRaw) return ''

  // 先按 ||| 拆分（多个 tag: 行），再按 , 拆分（单行逗号分隔）
  const allTags = tagRaw
    .split('|||')
    .map(s => s.trim())
    .filter(Boolean)
    .flatMap(s => s.split(',').map(t => t.trim()).filter(Boolean))

  if (allTags.length === 0) return ''

  const pillStyle = `display:inline-block;font-size:11px;font-weight:600;color:${tokens.primary};background:${tokens.primaryBg};padding:4px 10px;border-radius:20px;margin-right:6px;`
  const gap = '<span style="display:inline-block;width:4px;"></span>'

  return allTags
    .map(tag => `<span style="${pillStyle}"><span leaf="">#${escapeHtml(tag)}</span></span>`)
    .join(gap)
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// ============================================================
// 水平滑动图组
// ============================================================
function replaceCarousel(
  el: HTMLElement,
  components: ComponentTemplates,
  tokens: ThemeTokens,
  _structure: ThemeStructure
): void {
  let images: Array<{ alt: string; url: string }> = []
  try {
    const raw = el.getAttribute('data-images')
    if (raw) images = JSON.parse(decodeURIComponent(raw))
  } catch { /* ignore */ }

  const slidesHtml = images.map(img => {
    const tpl = components.carouselItem || components.image
    return renderTemplate(tpl, {
      tokens,
      vars: {
        src: escapeHtml(img.url),
        alt: escapeHtml(img.alt)
      }
    })
  }).join('')

  const html = renderTemplate(components.carousel, {
    tokens,
    vars: {
      slides: slidesHtml,
      count: String(images.length)
    }
  })
  replaceWith(el, html)
}

// ============================================================
// GitHub 提示块
// ============================================================
const ALERT_TITLE_DEFAULT: Record<string, string> = {
  NOTE: '📝 备注',
  TIP: '💡 提示',
  IMPORTANT: '⚠️ 重要',
  WARNING: '⚠️ 警告',
  CAUTION: '🚨 注意'
}

function replaceGithubAlert(
  el: HTMLElement,
  components: ComponentTemplates,
  tokens: ThemeTokens,
  _structure: ThemeStructure
): void {
  const type = el.getAttribute('data-type') || 'NOTE'
  const title = el.getAttribute('data-title') || ALERT_TITLE_DEFAULT[type] || '备注'
  const bodyRaw = el.getAttribute('data-body') || ''

  // 渲染正文 markdown 为中间 HTML，再套主题模板
  let bodyHtml = ''
  if (bodyRaw.trim()) {
    const inner = fragmentMd.render(decodeURIComponent(bodyRaw))
    // 对正文再做一次主题结构应用（处理其中的高亮/加粗等），复用当前渲染配置
    bodyHtml = applyThemeStructure(inner, _structure, tokens, activeConfig, activeStats)
  }

  const colorSet = ALERT_COLORS[type] || ALERT_COLORS.NOTE
  const html = renderTemplate(components.githubAlert, {
    tokens,
    vars: {
      type: escapeHtml(type),
      title: escapeHtml(title),
      body: bodyHtml,
      alertColor: colorSet.color,
      alertBg: colorSet.bg
    }
  })
  replaceWith(el, html)
}

// ============================================================
// 任务列表项
// ============================================================
function replaceTaskItem(
  el: HTMLElement,
  components: ComponentTemplates,
  tokens: ThemeTokens,
  _structure: ThemeStructure
): void {
  const checked = el.getAttribute('data-checked') === 'true'
  const text = el.textContent || ''
  // 用普通变量传入完整样式（template-parser 不支持条件语法）
  const checkboxStyle = checked
    ? `background:${tokens.primary};color:#fff;`
    : `border:2px solid ${tokens.dividerColor};color:transparent;`
  const checkboxMark = checked ? '✓' : '·'
  const textStyle = checked
    ? `text-decoration:line-through;color:${tokens.subTextColor};`
    : ''
  const html = renderTemplate(components.taskItem, {
    tokens,
    vars: {
      checkboxStyle,
      checkboxMark,
      textStyle,
      text: escapeHtml(text)
    }
  })
  replaceWith(el, html)
}

// ============================================================
// 下划线 ++xx++
// ============================================================
function replaceUnderline(
  el: HTMLElement,
  components: ComponentTemplates,
  tokens: ThemeTokens,
  _structure: ThemeStructure
): void {
  const content = el.textContent || ''
  const html = renderTemplate(components.inlineUnderline, {
    tokens,
    vars: { content: escapeHtml(content) }
  })
  replaceWith(el, html)
}

// ============================================================
// 数学公式（KaTeX，同步渲染）
// ============================================================

function replaceMath(
  el: HTMLElement,
  components: ComponentTemplates,
  tokens: ThemeTokens,
  _structure: ThemeStructure
): void {
  const tex = (el.getAttribute('data-tex') || '').replace(/&quot;/g, '"')
  const isBlock = el.classList.contains('gzh-math-block')

  let katexOut = ''
  const katexLib = (window as unknown as { katex?: typeof import('katex') }).katex
  if (katexLib) {
    try {
      katexOut = katexLib.renderToString(tex, {
        displayMode: isBlock,
        throwOnError: false,
        output: 'html'
      })
    } catch {
      katexOut = ''
    }
  }
  if (!katexOut) {
    // 公式库未加载（离线/CDN 失败）：降级为等宽源码
    katexOut = `<code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;font-family:monospace;white-space:pre-wrap;">${escapeHtml(tex)}</code>`
  }

  const html = renderTemplate(isBlock ? components.mathBlock : components.mathInline, {
    tokens,
    vars: { katexOut, tex: escapeHtml(tex) }
  })
  replaceWith(el, html)
}

// ============================================================
// Mermaid 图表（异步渲染，由外部 postProcessMermaid 完成 SVG 注入）
// ============================================================

function replaceMermaid(
  el: HTMLElement,
  components: ComponentTemplates,
  tokens: ThemeTokens,
  _structure: ThemeStructure
): void {
  const code = (el.getAttribute('data-code') || '').replace(/&quot;/g, '"')
  // 渲染模板，但外层包裹带 gzh-mermaid 类和 data-code 的容器
  // 使后续 renderMermaidInHtml 能定位到节点并异步替换为 SVG
  const innerHtml = renderTemplate(components.mermaid, {
    tokens,
    vars: { svgOut: `<p style="color:${tokens.subTextColor};font-size:13px;margin:0;">图表渲染中…</p>`, code: escapeHtml(code) }
  })
  const safeCode = code.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const wrappedHtml = `<section class="gzh-mermaid" data-code="${safeCode}">${innerHtml}</section>`
  replaceWith(el, wrappedHtml)
}

/**
 * 异步后处理：把 HTML 中的 .gzh-mermaid 占位节点替换为 mermaid 渲染的 SVG。
 * 在浏览器环境（真实 document 存在）下调用。preview 与 copy 两套 HTML 都需调用。
 */
let mermaidInited = false
export async function renderMermaidInHtml(html: string): Promise<string> {
  const hasMermaid = /class="gzh-mermaid"/.test(html)
  if (!hasMermaid) return html

  try {
    const mermaid = await ensureMermaid()
    if (!mermaidInited) {
      mermaid.initialize({ startOnLoad: false, securityLevel: 'loose', theme: 'default' })
      mermaidInited = true
    }

    const parser = new DOMParser()
    const doc = parser.parseFromString(`<div id="xumd-mermaid">${html}</div>`, 'text/html')
    const root = doc.getElementById('xumd-mermaid')
    if (!root) return html

    const nodes = Array.from(root.querySelectorAll('.gzh-mermaid')) as HTMLElement[]
    let idx = 0
    for (const node of nodes) {
      const code = (node.getAttribute('data-code') || '').replace(/&quot;/g, '"')
      if (!code.trim()) continue
      try {
        const id = `xumd-mm-${Date.now()}-${idx++}`
        const renderResult = await mermaid.render(id, code) as unknown as { svg: string }
        node.outerHTML = renderResult.svg
      } catch {
        // 渲染失败保留提示
      }
    }
    return root.innerHTML
  } catch {
    return html
  }
}

// ============================================================
// 局部属性标记：将属性应用到前一个兄弟块级元素
// ============================================================
function replaceAttrMarker(el: HTMLElement, _doc: Document): void {
  const attrs = el.getAttribute('data-attrs') || ''
  const prev = el.previousElementSibling
  if (prev && attrs) {
    const classMatch = attrs.match(/\.([\w-]+)/g)
    const idMatch = attrs.match(/#([\w-]+)/)
    const dataMatches = attrs.matchAll(/\s+data-([\w-]+)(?:=([^\s}]*))?/g)
    if (classMatch) {
      classMatch.forEach(c => {
        const cls = c.slice(1)
        if (cls) prev.classList.add(cls)
      })
    }
    if (idMatch) {
      prev.setAttribute('id', idMatch[1])
    }
    for (const dm of dataMatches) {
      const name = dm[1]
      const val = dm[2] !== undefined ? dm[2] : ''
      prev.setAttribute(`data-${name}`, val)
    }
  }
  el.remove()
}

/**
 * 清理所有 <span leaf=""> 包裹，释放内部文本/元素
 *
 * 公众号编辑器的粘贴解析器无法正确处理嵌套的 leaf span，
 * 会导致文字消失或样式丢失。此函数在复制前清理这些包裹。
 *
 * 处理方式：
 * - <span leaf="">纯文本</span> → 纯文本
 * - <span leaf=""><strong>加粗</strong></span> → <strong>加粗</strong>
 * - 嵌套多层 leaf span 也一并处理
 */
function unwrapLeafSpans(html: string): string {
  if (!html) return ''

  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div id="xumd-unwrap">${html}</div>`, 'text/html')
  const root = doc.getElementById('xumd-unwrap')
  if (!root) return html

  // 查找所有 leaf span 并解包
  const leafSpans = root.querySelectorAll('span[leaf]')
  leafSpans.forEach(span => {
    const parent = span.parentNode
    if (!parent) return

    // 将 leaf span 的子节点移到父节点中（替换 leaf span 的位置）
    while (span.firstChild) {
      parent.insertBefore(span.firstChild, span)
    }
    parent.removeChild(span)
  })

  return root.innerHTML
}

/**
 * 移动端兼容转换：公众号助手 App / 移动端渲染器
 * 不支持 display:flex / display:inline-flex 及其全部子属性，
 * 且 display:table/table-cell 在移动端 WebView 中也有严重缺陷
 *（table-cell 会被撑成等高导致圆形变椭圆、等分宽度导致文字被挤压）。
 *
 * 本函数将所有 flex / inline-flex 布局转换为仅使用基础 CSS 的等价布局：
 * - 横向排列 → float:left + overflow:hidden（ universally supported ）
 * - flex:1 弹性区 → overflow:hidden（自动填充剩余空间）
 * - space-between → float:left / float:right
 * - 纵向排列（column）→ 直接剥离 flex，block 流天然纵向
 * - 圆形/徽章居中 → line-height=height + text-align:center
 * - gap → 转换为 margin-left（float 布局下）
 *
 * 仅作用于复制输出（copyOutputHtml），不影响编辑器内的实时预览。
 */
function flexToTable(html: string): string {
  if (!html || !html.includes('flex')) return html

  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div id="xumd-flex">${html}</div>`, 'text/html')
  const root = doc.getElementById('xumd-flex')
  if (!root) return html

  // 收集所有含 display:flex 或 display:inline-flex 的元素，按 DOM 深度降序处理（先深后浅）
  const flexEls: HTMLElement[] = []
  root.querySelectorAll('*').forEach(el => {
    const style = (el as HTMLElement).getAttribute('style') || ''
    if (/\bdisplay\s*:\s*(inline-)?flex\b/.test(style)) flexEls.push(el as HTMLElement)
  })
  flexEls.sort((a, b) => domDepth(b) - domDepth(a))

  flexEls.forEach(el => convertFlexCompat(el))

  return root.innerHTML
}

function domDepth(el: Element): number {
  let d = 0
  let p = el.parentElement
  while (p) { d++; p = p.parentElement }
  return d
}

/**
 * 把复制输出里的本地 Base64 图片替换为「公众号可替换的占位图片」。
 *
 * 公众号编辑器会剥离内联 Base64 图片，导致粘贴后整张图消失、无法操作。
 * 这里在「复制到公众号」这一步（仅作用于 copyOutputHtml，不影响编辑器预览）
 * 把所有 src="data:image/..." 的 <img> 的 src 替换成公网可访问的占位图片 URL，
 * 让微信编辑器把它当作正常图片下载、转存到微信图库，从而支持「替换图片」。
 *
 * 占位图带中文提示文字，且保留原图片的居中 / 圆角 / 间距等外层样式。
 */
function convertBase64ImagesForGzh(html: string): string {
  if (!html || !html.includes('data:image')) return html

  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div id="xumd-base64">${html}</div>`, 'text/html')
  const root = doc.getElementById('xumd-base64')
  if (!root) return html

  // SVG 占位图：不依赖外部图床，在微信内直接以 data URI 形式嵌入，
  // 避免 placehold.co 等外部服务被屏蔽导致图片不显示。
  // 800×600 比例，灰底 + "点击替换图片" 提示文字。
  const PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#e5e7eb"/><text x="400" y="300" font-family="sans-serif" font-size="40" fill="#374151" text-anchor="middle" dominant-baseline="middle">点击替换图片</text></svg>`
  const PLACEHOLDER_IMG = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(PLACEHOLDER_SVG)}`

  // 找出所有 Base64 图片
  const imgs = Array.from(root.querySelectorAll('img')).filter(img =>
    (img.getAttribute('src') || '').startsWith('data:image')
  )

  imgs.forEach(img => {
    img.setAttribute('src', PLACEHOLDER_IMG)
    img.setAttribute('alt', '点击替换图片（原图为本地图片，公众号无法显示）')
    img.setAttribute('title', '点击替换图片')
    img.setAttribute('data-xumd-replaced', '1')

    // 保持原有 display 与最大宽度，让占位图在公众号内沿用原布局
    const style = img.getAttribute('style') || ''
    if (!style.includes('width')) {
      img.setAttribute(
        'style',
        [style, 'width:100%;max-width:800px;height:auto'].filter(Boolean).join(';')
      )
    }
  })

  return root.innerHTML
}

/**
 * 将单个 flex/inline-flex 元素转换为移动端兼容布局。
 * 核心策略：使用 float+overflow 替代 flex/table，避免 table-cell 的等高/等宽问题。
 */
function convertFlexCompat(el: HTMLElement): void {
  const style = el.getAttribute('style') || ''
  if (!/\bdisplay\s*:\s*(inline-)?flex\b/.test(style)) return

  const isColumn = /flex-direction\s*:\s*column/.test(style)
  const isSpaceBetween = /justify-content\s*:\s*space-between/.test(style)

  // 提取 gap 值
  const gapMatch = style.match(/gap\s*:\s*([\d.]+)(px)?/i)
  const gapPx = gapMatch ? parseFloat(gapMatch[1]) : 0

  const children = Array.from(el.children).filter(
    c => c.nodeType === Node.ELEMENT_NODE
  ) as HTMLElement[]

  // ─── 场景 A：无或单子元素 ───
  if (children.length <= 1) {
    el.setAttribute('style', stripAllFlexProps(style))
    if (children.length === 1) fixCentering(children[0])
    return
  }

  // ─── 场景 B：纵向 flex（column）───
  if (isColumn) {
    let newStyle = stripAllFlexProps(style)
    if (!/\bwidth\b/.test(newStyle)) newStyle += ';width:100%'
    el.setAttribute('style', cleanS(newStyle))
    children.forEach(c => {
      c.setAttribute('style', cleanS(stripAllFlexProps(c.getAttribute('style') || '')))
      fixCentering(c)
    })
    return
  }

  // ─── 场景 C：横向 flex（默认 row）───

  // 子策略 C1：space-between 且 2+ 子元素 → float:left/right
  if (isSpaceBetween && children.length >= 2) {
    let parentStyle = stripAllFlexProps(style)
    parentStyle += ';overflow:hidden;width:100%'
    el.setAttribute('style', cleanS(parentStyle))

    children.forEach((child, idx) => {
      let cStyle = stripAllFlexProps(child.getAttribute('style') || '')
      if (idx === 0) cStyle += ';float:left'
      else if (idx === children.length - 1) cStyle += ';float:right'
      else cStyle += ';display:inline-block;vertical-align:middle'
      child.setAttribute('style', cleanS(cStyle))
      fixCentering(child)
    })
    return
  }

  // ─── 子策略 C2：普通横向 → float 布局（核心修复）────
  //
  // 为什么不用 display:table：
  //   table-cell 会强制等高 → 圆形编号(22px)被多行文本撑成椭圆 ❌
  //   table-cell 默认等宽 → "原创文章"被挤压成竖排 ❌
  //
  // float 布局的优势：
  //   每个元素保持自然尺寸，不被兄弟撑大 ✅
  //   flex:1 用 overflow:hidden 自动填充剩余空间 ✅
  //   所有移动端 WebView 完美支持 ✅

  let parentStyle = stripAllFlexProps(style)
  parentStyle += ';overflow:hidden;width:100%'
  el.setAttribute('style', cleanS(parentStyle))

  // 预扫描：标记哪些子元素是"弹性填充型"（flex:1/flex-grow）
  const isElastic = children.map(c => {
    const cs = c.getAttribute('style') || ''
    return /\bflex\s*:\s*1\b/.test(cs) || /\bgrow-grow\s*:\s*[1-9]/.test(cs)
  })

  children.forEach((child, idx) => {
    const cRaw = child.getAttribute('style') || ''
    let cStyle = stripAllFlexProps(cRaw)

    if (isElastic[idx]) {
      // 弹性子元素：不 float，用 overflow:hidden 占满剩余空间
      if (gapPx > 0 && idx > 0) cStyle += `;margin-left:${gapPx}px`
    } else {
      // 非弹性子元素：float:left 使其保持自然尺寸
      cStyle += ';float:left'
      if (idx > 0 && gapPx > 0) {
        // gap 转为 margin-left（float 元素之间）
        cStyle += `;margin-left:${gapPx}px`
      }
    }

    child.setAttribute('style', cleanS(cStyle))
    fixCentering(child)
  })
}

/**
 * 修复圆形/徽章元素的居中问题。
 * 当原元素是 inline-flex + align-items:center + justify-content:center
 * （常用于步骤编号、圆点等），flex 被剥离后文字不再居中。
 * 用 line-height=height + text-align=center 实现同等效果。
 */
function fixCentering(el: HTMLElement): void {
  const style = el.getAttribute('style') || ''
  const hMatch = style.match(/height\s*:\s*([\d.]+)(px)?/i)
  const hasBorderRadius = /border-radius\s*:\s*(50%|[3-9]\d%|[\d.]+px)/i.test(style)
  if (hMatch && hasBorderRadius) {
    const hVal = hMatch[1] + (hMatch[2] || 'px')
    let newStyle = style
    if (!/\btext-align\s*:/.test(newStyle)) newStyle += ';text-align:center'
    if (!/\bline-height\s*:/.test(newStyle)) newStyle += `;line-height:${hVal}`
    if (!/\boverflow\s*:/.test(newStyle)) newStyle += ';overflow:hidden'
    el.setAttribute('style', cleanS(newStyle))
  }
}

/** 从样式中移除所有 flex 相关属性 */
function stripAllFlexProps(style: string): string {
  return style
    .replace(/display\s*:\s*flex\b[^;]*;?/g, '')
    .replace(/display\s*:\s*inline-flex\b[^;]*;?/g, '')
    .replace(/align-items\s*:[^;]+;?/g, '')
    .replace(/align-content\s*:[^;]+;?/g, '')
    .replace(/justify-content\s*:[^;]+;?/g, '')
    .replace(/justify-self\s*:[^;]+;?/g, '')
    .replace(/align-self\s*:[^;]+;?/g, '')
    .replace(/gap\s*:[^;]+;?/g, '')
    .replace(/row-gap\s*:[^;]+;?/g, '')
    .replace(/column-gap\s*:[^;]+;?/g, '')
    .replace(/flex\s*:[^;]+;?/g, '')
    .replace(/flex-grow\s*:[^;]+;?/g, '')
    .replace(/flex-shrink\s*:[^;]+;?/g, '')
    .replace(/flex-basis\s*:[^;]+;?/g, '')
    .replace(/flex-wrap\s*:[^;]+;?/g, '')
    .replace(/flex-direction\s*:[^;]+;?/g, '')
    .replace(/order\s*:[^;]+;?/g, '')
    .replace(/;\s*;+/g, ';')
    .trim()
}

/** 清理样式字符串 */
function cleanS(s: string): string {
  s = s.replace(/;\s*;+/g, ';').trim()
  if (s.endsWith(';')) s = s.slice(0, -1)
  return s
}

/**
 * 基于 Markdown 原文计算文章统计信息
 * 移除 Markdown 语法标记后统计纯文本字数
 */
function calculateStatsFromMarkdown(mdSource: string): { charCount: string; readTime: string } {
  // 移除 Markdown 语法标记，统计纯文本字数
  let text = mdSource

  // 移除代码块
  text = text.replace(/```[\s\S]*?```/g, '')
  // 移除行内代码
  text = text.replace(/`[^`]*`/g, '')
  // 移除图片语法
  text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, '')
  // 移除链接语法（保留文字）
  text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
  // 移除标题标记
  text = text.replace(/^#{1,6}\s+/gm, '')
  // 移除列表标记
  text = text.replace(/^[\s]*[-*+]\s+/gm, '')
  text = text.replace(/^[\s]*\d+\.\s+/gm, '')
  // 移除引用标记
  text = text.replace(/^>\s*/gm, '')
  // 移除强调标记
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1')
  text = text.replace(/\*([^*]+)\*/g, '$1')
  text = text.replace(/==([^=]+)==/g, '$1')
  text = text.replace(/~~([^~]+)~~/g, '$1')
  // 移除分割线
  text = text.replace(/^---+$/gm, '')
  // 移除特殊标记
  text = text.replace(/^\[封面\]$/gm, '')
  text = text.replace(/^\[TOC\]$/gm, '')
  text = text.replace(/^\[目录\]$/gm, '')
  text = text.replace(/^\[签名\]$/gm, '')
  // 移除 ::: 容器标记
  text = text.replace(/^:::.*$/gm, '')
  // 移除 /// 章节标记
  text = text.replace(/^\/\/\//gm, '')

  // 移除空白字符后计数
  const charCount = text.replace(/\s/g, '').length
  // 按每分钟 400 字计算阅读时间，最少 1 分钟
  const readTime = Math.max(1, Math.ceil(charCount / 400))

  return {
    charCount: String(charCount),
    readTime: String(readTime)
  }
}
