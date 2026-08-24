/**
 * Markdown-It 自定义语法插件
 *
 * 支持 gzh-design-skill 全部自定义语法：
 * 1. :::tip / :::warning / :::info / :::faq - 块级提示卡
 * 2. ///章节标题 - 章节自动编号
 * 3. ==关键词== - 高亮/下划线
 * 4. [封面] / [目录] / [签名] - 特殊标记
 *
 * 注意：
 * - 插件输出带 class 的中间 HTML（gzh-card, gzh-faq 等）
 * - 由后续 DOM 后处理（applyThemeStructure）将这些结构转为主题组件
 * - 这样设计保证了 markdown-it 插件与主题解耦
 */

import type MarkdownIt from 'markdown-it'

export interface GzhPluginOptions {
  chapterNumbering?: boolean
  containers?: boolean
  highlight?: boolean
  faq?: boolean
}

export function gzhMdPlugin(md: MarkdownIt, options: GzhPluginOptions = {}): void {
  const opts: Required<GzhPluginOptions> = {
    chapterNumbering: true,
    containers: true,
    highlight: true,
    faq: true,
    ...options
  }

  if (opts.highlight) {
    registerHighlightInline(md)
  }
  if (opts.containers) {
    registerContainerBlocks(md)
    registerQuoteContainer(md)
    registerTimelineContainer(md)
  }
  if (opts.faq) {
    registerFaqContainer(md)
  }
  if (opts.chapterNumbering) {
    registerChapterNumbering(md)
  }
  registerStepList(md)
  registerPillTagInline(md)
  registerCoverContainer(md)
  registerSpecialMarkers(md)
  registerHrContainer(md)
  // 新增语法（对齐 wemd 文档）
  registerCarousel(md)
  registerGithubAlerts(md)
  registerTaskList(md)
  registerUnderlineInline(md)
  registerSupSubInline(md)
  registerEmojiInline(md)
  registerMathBlock(md)
  registerMermaidBlock(md)
  registerAttributes(md)
}

// ============================================================
// ==高亮== 行内语法
// 优先级低于 emphasis，使用独立的 inline ruler 位置
// ============================================================

function registerHighlightInline(md: MarkdownIt): void {
  md.inline.ruler.after('emphasis', 'gzh_highlight', (state, silent) => {
    const start = state.pos
    const src = state.src

    // 检查开头 ==
    if (src.charCodeAt(start) !== 0x3D /* = */) return false
    if (src.charCodeAt(start + 1) !== 0x3D) return false

    // 查找结束 ==
    let pos = start + 2
    let found = false

    while (pos < src.length) {
      if (src.charCodeAt(pos) === 0x3D && src.charCodeAt(pos + 1) === 0x3D) {
        // 确保不是 === 开头的三重等号
        if (pos === start + 2) {
          pos += 2
          continue // 空内容跳过
        }
        found = true
        break
      }
      // 跳过转义
      if (src.charCodeAt(pos) === 0x5C /* \ */) {
        pos += 2
        continue
      }
      pos++
    }

    if (!found) return false

    const content = src.slice(start + 2, pos)
    if (!content.trim()) return false

    if (!silent) {
      const token = state.push('gzh_highlight', 'span', 0)
      token.content = content
      token.markup = '=='
    }

    state.pos = pos + 2
    return true
  })

  // 渲染规则：输出带 class 的 span，由后处理转为主题样式
  md.renderer.rules.gzh_highlight = (tokens, idx) => {
    const token = tokens[idx]
    return `<span class="gzh-highlight">${token.content}</span>`
  }
}

// ============================================================
// :::tip / :::warning / :::info 块级容器
// ============================================================

function registerContainerBlocks(md: MarkdownIt): void {
  const containerTypes = ['tip', 'warning', 'info']

  md.block.ruler.before('fence', 'gzh_container', (state, startLine, _endLine, silent) => {
    const startPos = state.bMarks[startLine] + state.tShift[startLine]
    const lineText = state.src.slice(startPos, state.eMarks[startLine])

    // 匹配 :::xxx 可选标题
    const match = lineText.match(/^:::(tip|warning|info)(?:\s+(.*))?$/)
    if (!match) return false
    if (silent) return true

    const type = match[1]
    const title = match[2] || getDefaultTitle(type)

    // 查找结束标记 :::
    let nextLine = startLine + 1
    let endLineFound = -1
    while (nextLine < _endLine) {
      const nextPos = state.bMarks[nextLine] + state.tShift[nextLine]
      const nextText = state.src.slice(nextPos, state.eMarks[nextLine])
      if (/^:::\s*$/.test(nextText)) {
        endLineFound = nextLine
        break
      }
      nextLine++
    }
    if (endLineFound === -1) return false

    // 生成 open token
    const openToken = state.push(`gzh_${type}_open`, 'section', 1)
    openToken.info = title
    openToken.markup = ':::'
    openToken.map = [startLine, endLineFound]

    // 内容标题 token（卡片标题）
    const titleToken = state.push('gzh_card_title', 'p', 0)
    titleToken.content = title
    titleToken.markup = ':::'

    // body 开始
    state.push('gzh_card_body_open', 'div', 1)

    // 递归解析容器内部内容
    state.md.block.tokenize(state, startLine + 1, endLineFound)

    // body 结束
    state.push('gzh_card_body_close', 'div', -1)

    // 关闭容器
    const closeToken = state.push(`gzh_${type}_close`, 'section', -1)
    closeToken.markup = ':::'

    state.line = endLineFound + 1
    return true
  })

  // 渲染规则
  for (const type of containerTypes) {
    md.renderer.rules[`gzh_${type}_open`] = () => {
      return `<section class="gzh-card gzh-card-${type}">`
    }
    md.renderer.rules[`gzh_${type}_close`] = () => '</section>'
  }

  md.renderer.rules.gzh_card_title = (tokens, idx) => {
    return `<p class="gzh-card-title">${tokens[idx].content}</p>`
  }
  md.renderer.rules.gzh_card_body_open = () => '<div class="gzh-card-body">'
  md.renderer.rules.gzh_card_body_close = () => '</div>'
}

function getDefaultTitle(type: string): string {
  const titles: Record<string, string> = {
    tip: '💡 提示',
    warning: '⚠️ 注意',
    info: 'ℹ️ 说明'
  }
  return titles[type] || ''
}

// ============================================================
// :::faq 问答卡
// ============================================================

function registerFaqContainer(md: MarkdownIt): void {
  md.block.ruler.before('fence', 'gzh_faq', (state, startLine, _endLine, silent) => {
    const startPos = state.bMarks[startLine] + state.tShift[startLine]
    const lineText = state.src.slice(startPos, state.eMarks[startLine])

    const match = lineText.match(/^:::faq(?:\s+(.*))?$/)
    if (!match) return false
    if (silent) return true

    const question = match[1] || '常见问题'

    // 查找结束
    let nextLine = startLine + 1
    let endLineFound = -1
    while (nextLine < _endLine) {
      const nextPos = state.bMarks[nextLine] + state.tShift[nextLine]
      const nextText = state.src.slice(nextPos, state.eMarks[nextLine])
      if (/^:::\s*$/.test(nextText)) {
        endLineFound = nextLine
        break
      }
      nextLine++
    }
    if (endLineFound === -1) return false

    // open token
    const openToken = state.push('gzh_faq_open', 'section', 1)
    openToken.info = question
    openToken.map = [startLine, endLineFound]

    // 问题标题
    const qToken = state.push('gzh_faq_q', 'p', 0)
    qToken.content = question

    // answer 开始
    state.push('gzh_faq_a_open', 'div', 1)

    // 解析内容
    state.md.block.tokenize(state, startLine + 1, endLineFound)

    // answer 结束
    state.push('gzh_faq_a_close', 'div', -1)

    // close
    state.push('gzh_faq_close', 'section', -1)

    state.line = endLineFound + 1
    return true
  })

  md.renderer.rules.gzh_faq_open = () => '<section class="gzh-faq">'
  md.renderer.rules.gzh_faq_close = () => '</section>'
  md.renderer.rules.gzh_faq_q = (tokens, idx) => {
    return `<p class="gzh-faq-q">${tokens[idx].content}</p>`
  }
  md.renderer.rules.gzh_faq_a_open = () => '<div class="gzh-faq-a">'
  md.renderer.rules.gzh_faq_a_close = () => '</div>'
}

// ============================================================
// /// 章节编号
// ============================================================

function registerChapterNumbering(md: MarkdownIt): void {
  md.block.ruler.before('heading', 'gzh_chapter', (state, startLine, _endLine, silent) => {
    const startPos = state.bMarks[startLine] + state.tShift[startLine]
    const lineText = state.src.slice(startPos, state.eMarks[startLine])

    // 匹配 /// 章节标题（必须三个斜杠开头）
    const match = lineText.match(/^\/\/\/\s*(.+)$/)
    if (!match) return false
    if (silent) return true

    const title = match[1].trim()
    const token = state.push('gzh_chapter', 'h2', 0)
    token.content = title
    token.map = [startLine, startLine + 1]

    state.line = startLine + 1
    return true
  })

  // 渲染为 h2，让后续的 DOM 后处理统一按 h2 → chapterTitle 处理
  md.renderer.rules.gzh_chapter = (tokens, idx) => {
    return `<h2 class="gzh-chapter-title">${tokens[idx].content}</h2>\n`
  }
}

// ============================================================
// :::cover 封面块级容器
// 语法：
//   :::cover 主标题
//   副标题内容
//   ---
//   top: 顶部左侧文字
//   tag: 标签文字
//   image: 封面图URL（可选）
//   bottom: 底部文字
//   :::
// ============================================================

function registerCoverContainer(md: MarkdownIt): void {
  md.block.ruler.before('fence', 'gzh_cover', (state, startLine, _endLine, silent) => {
    const startPos = state.bMarks[startLine] + state.tShift[startLine]
    const lineText = state.src.slice(startPos, state.eMarks[startLine])

    // 匹配 :::cover 可选标题
    const match = lineText.match(/^:::cover(?:\s+(.*))?$/)
    if (!match) return false
    if (silent) return true

    const title = match[1] || ''

    // 查找结束标记 :::
    let nextLine = startLine + 1
    let endLineFound = -1
    while (nextLine < _endLine) {
      const nextPos = state.bMarks[nextLine] + state.tShift[nextLine]
      const nextText = state.src.slice(nextPos, state.eMarks[nextLine])
      if (/^:::\s*$/.test(nextText)) {
        endLineFound = nextLine
        break
      }
      nextLine++
    }
    if (endLineFound === -1) return false

    // 解析封面内容：
    // 1. 分割线 --- 之前是副标题
    // 2. 分割线之后是元数据（top, tag, image, bottom 等）
    const subtitleLines: string[] = []
    const meta: Record<string, string> = {}
    let foundDivider = false

    for (let i = startLine + 1; i < endLineFound; i++) {
      const pos = state.bMarks[i] + state.tShift[i]
      const line = state.src.slice(pos, state.eMarks[i]).trim()

      if (!line) continue

      // 检测分割线
      if (/^---+\s*$/.test(line)) {
        foundDivider = true
        continue
      }

      if (foundDivider) {
        // 分割线后：解析 key: value 格式
        const colonIdx = line.indexOf(':')
        if (colonIdx > 0) {
          const key = line.slice(0, colonIdx).trim().toLowerCase()
          const value = line.slice(colonIdx + 1).trim()
          if (key === 'tag') {
            // tag 支持多标签：多个 tag: 行或逗号分隔都会被收集
            const existing = meta.tag || ''
            meta.tag = existing ? `${existing}|||${value}` : value
          } else {
            meta[key] = value
          }
        }
      } else {
        // 分割线前：副标题内容
        subtitleLines.push(line)
      }
    }
    const subtitle = subtitleLines.join('\n')

    const coverData = {
      title,
      subtitle,
      top: meta.top || '',
      tag: meta.tag || '',
      image: meta.image || '',
      bottom: meta.bottom || '',
      date: meta.date || ''
    }

    // open token
    const openToken = state.push('gzh_cover_open', 'section', 1)
    openToken.info = JSON.stringify(coverData)
    openToken.markup = ':::cover'
    openToken.map = [startLine, endLineFound]

    // 关闭容器
    const closeToken = state.push('gzh_cover_close', 'section', -1)
    closeToken.markup = ':::'

    state.line = endLineFound + 1
    return true
  })

  md.renderer.rules.gzh_cover_open = (tokens, idx) => {
    const info = tokens[idx].info
    try {
      const data = JSON.parse(info)
      return `<div class="gzh-marker gzh-marker-cover" 
        data-title="${escapeAttr(data.title || '')}" 
        data-subtitle="${escapeAttr(data.subtitle || '')}"
        data-top="${escapeAttr(data.top || '')}"
        data-tag="${escapeAttr(data.tag || '')}"
        data-image="${escapeAttr(data.image || '')}"
        data-bottom="${escapeAttr(data.bottom || '')}"
        data-date="${escapeAttr(data.date || '')}"
      ></div>\n`
    } catch {
      return '<div class="gzh-marker gzh-marker-cover"></div>\n'
    }
  }
  md.renderer.rules.gzh_cover_close = () => ''
}

function escapeAttr(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// ============================================================
// 特殊标记：封面、目录、签名
// ============================================================

function registerSpecialMarkers(md: MarkdownIt): void {
  md.block.ruler.before('paragraph', 'gzh_marker', (state, startLine, _endLine, silent) => {
    const startPos = state.bMarks[startLine] + state.tShift[startLine]
    const lineText = state.src.slice(startPos, state.eMarks[startLine]).trim()

    // 匹配 [标记名 可选内容] 格式
    const bracketMatch = lineText.match(/^\[([^\]]+)\]$/)
    let markerType = ''
    let markerContent = ''

    if (bracketMatch) {
      const inner = bracketMatch[1]
      const spaceIdx = inner.indexOf(' ')
      const name = spaceIdx > 0 ? inner.slice(0, spaceIdx) : inner
      const content = spaceIdx > 0 ? inner.slice(spaceIdx + 1).trim() : ''

      const nameMap: Record<string, string> = {
        '封面': 'cover',
        'TOC': 'toc',
        '目录': 'toc',
        '签名': 'signature'
      }

      if (nameMap[name]) {
        markerType = nameMap[name]
        markerContent = content
      }
    }

    // ---signature--- 格式
    if (!markerType && lineText === '---signature---') {
      markerType = 'signature'
    }

    if (!markerType) return false
    if (silent) return true

    const token = state.push(`gzh_${markerType}_marker`, 'div', 0)
    token.markup = lineText
    token.info = JSON.stringify({ type: markerType, content: markerContent })
    token.map = [startLine, startLine + 1]

    state.line = startLine + 1
    return true
  })

  function getMarkerInfo(token: { info: string }): { type: string; content: string } {
    try {
      return JSON.parse(token.info)
    } catch {
      return { type: token.info, content: '' }
    }
  }

  md.renderer.rules.gzh_cover_marker = (tokens, idx) => {
    const info = getMarkerInfo(tokens[idx])
    return `<div class="gzh-marker gzh-marker-cover" data-content="${escapeAttr(info.content)}"></div>\n`
  }
  md.renderer.rules.gzh_toc_marker = (tokens, idx) => {
    const info = getMarkerInfo(tokens[idx])
    return `<div class="gzh-marker gzh-marker-toc" data-content="${escapeAttr(info.content)}"></div>\n`
  }
  md.renderer.rules.gzh_signature_marker = (tokens, idx) => {
    const info = getMarkerInfo(tokens[idx])
    return `<div class="gzh-marker gzh-marker-signature" data-content="${escapeAttr(info.content)}"></div>\n`
  }
}

// ============================================================
// :::quote 引用高亮（金句卡）
// ============================================================

function registerQuoteContainer(md: MarkdownIt): void {
  md.block.ruler.before('fence', 'gzh_quote', (state, startLine, _endLine, silent) => {
    const startPos = state.bMarks[startLine] + state.tShift[startLine]
    const lineText = state.src.slice(startPos, state.eMarks[startLine])

    const match = lineText.match(/^:::quote(?:\s+(.*))?$/)
    if (!match) return false
    if (silent) return true

    // 查找结束标记
    let nextLine = startLine + 1
    let endLineFound = -1
    while (nextLine < _endLine) {
      const nextPos = state.bMarks[nextLine] + state.tShift[nextLine]
      const nextText = state.src.slice(nextPos, state.eMarks[nextLine])
      if (/^:::\s*$/.test(nextText)) {
        endLineFound = nextLine
        break
      }
      nextLine++
    }
    if (endLineFound === -1) return false

    // 收集内容（纯文本，支持多行）
    const lines: string[] = []
    for (let i = startLine + 1; i < endLineFound; i++) {
      const pos = state.bMarks[i] + state.tShift[i]
      const line = state.src.slice(pos, state.eMarks[i]).trim()
      if (line) lines.push(line)
    }
    const content = lines.join(' ')

    const openToken = state.push('gzh_quote_open', 'section', 1)
    openToken.info = content
    openToken.markup = ':::quote'
    openToken.map = [startLine, endLineFound]

    // 内容 token
    const contentToken = state.push('gzh_quote_content', 'p', 0)
    contentToken.content = content

    state.push('gzh_quote_close', 'section', -1)

    state.line = endLineFound + 1
    return true
  })

  md.renderer.rules.gzh_quote_open = (tokens, idx) => {
    return `<section class="gzh-quote-highlight" data-content="${escapeAttr(tokens[idx].info)}">`
  }
  md.renderer.rules.gzh_quote_content = () => ''
  md.renderer.rules.gzh_quote_close = () => '</section>\n'
}

// ============================================================
// :::timeline 时间线容器
// 语法：
//   :::timeline
//   2024.01 - 事件一描述
//   2024.02 - 事件二描述
//   :::
// ============================================================

function registerTimelineContainer(md: MarkdownIt): void {
  md.block.ruler.before('fence', 'gzh_timeline', (state, startLine, _endLine, silent) => {
    const startPos = state.bMarks[startLine] + state.tShift[startLine]
    const lineText = state.src.slice(startPos, state.eMarks[startLine])

    if (!/^:::timeline\s*$/.test(lineText)) return false
    if (silent) return true

    // 查找结束标记
    let nextLine = startLine + 1
    let endLineFound = -1
    while (nextLine < _endLine) {
      const nextPos = state.bMarks[nextLine] + state.tShift[nextLine]
      const nextText = state.src.slice(nextPos, state.eMarks[nextLine])
      if (/^:::\s*$/.test(nextText)) {
        endLineFound = nextLine
        break
      }
      nextLine++
    }
    if (endLineFound === -1) return false

    // 解析每一行：日期 - 描述
    const items: Array<{ date: string; text: string }> = []
    for (let i = startLine + 1; i < endLineFound; i++) {
      const pos = state.bMarks[i] + state.tShift[i]
      const line = state.src.slice(pos, state.eMarks[i]).trim()
      if (!line) continue
      const dashIdx = line.indexOf(' - ')
      if (dashIdx > 0) {
        items.push({
          date: line.slice(0, dashIdx).trim(),
          text: line.slice(dashIdx + 3).trim()
        })
      } else {
        items.push({ date: '', text: line })
      }
    }

    const openToken = state.push('gzh_timeline_open', 'section', 1)
    openToken.info = JSON.stringify(items)
    openToken.markup = ':::timeline'
    openToken.map = [startLine, endLineFound]

    state.push('gzh_timeline_close', 'section', -1)

    state.line = endLineFound + 1
    return true
  })

  md.renderer.rules.gzh_timeline_open = (tokens, idx) => {
    return `<div class="gzh-timeline" data-items="${escapeAttr(tokens[idx].info)}"></div>\n`
  }
  md.renderer.rules.gzh_timeline_close = () => ''
}

// ============================================================
// 步骤列表：> step 标题\n> 描述
// 将 blockquote 中以 "step " 开头的段落解析为步骤项
// ============================================================

function registerStepList(md: MarkdownIt): void {
  // 在 blockquote 渲染后处理，检测 step 模式
  // 这里用更简单的方式：直接在行首匹配 "> step " 模式
  md.block.ruler.before('blockquote', 'gzh_step', (state, startLine, _endLine, silent) => {
    const startPos = state.bMarks[startLine] + state.tShift[startLine]
    const lineText = state.src.slice(startPos, state.eMarks[startLine])

    // 匹配 > step 标题 格式
    const match = lineText.match(/^>\s*step\s+(.+)$/i)
    if (!match) return false
    if (silent) return true

    const title = match[1].trim()
    const descriptionLines: string[] = []

    // 查找后续的 > 描述行（属于同一步骤）
    let nextLine = startLine + 1
    while (nextLine < _endLine) {
      const nextPos = state.bMarks[nextLine] + state.tShift[nextLine]
      const nextText = state.src.slice(nextPos, state.eMarks[nextLine])

      if (/^>\s*step\s+/i.test(nextText)) {
        // 下一个 step，停止
        break
      }
      if (/^>\s*(.+)$/.test(nextText)) {
        // 继续收集描述
        const descMatch = nextText.match(/^>\s*(.+)$/)
        if (descMatch && descMatch[1].trim()) {
          descriptionLines.push(descMatch[1].trim())
        }
        nextLine++
      } else if (nextText.trim() === '') {
        // 空行也跳过（step 之间可能有空行）
        // 但需要检查下一行是否还是 step 或描述
        if (nextLine + 1 < _endLine) {
          const checkPos = state.bMarks[nextLine + 1] + state.tShift[nextLine + 1]
          const checkText = state.src.slice(checkPos, state.eMarks[nextLine + 1])
          if (/^>\s*(.+)$/.test(checkText) && !/^>\s*step\s+/i.test(checkText)) {
            nextLine++
            continue
          }
        }
        break
      } else {
        break
      }
    }

    const description = descriptionLines.join(' ')

    const token = state.push('gzh_step_item', 'div', 0)
    token.info = JSON.stringify({ title, description })
    token.markup = '> step'
    token.map = [startLine, nextLine]

    state.line = nextLine
    return true
  })

  md.renderer.rules.gzh_step_item = (tokens, idx) => {
    const info = tokens[idx].info
    try {
      const data = JSON.parse(info)
      return `<div class="gzh-step-item" data-title="${escapeAttr(data.title)}" data-desc="${escapeAttr(data.description)}"></div>\n`
    } catch {
      return '<div class="gzh-step-item"></div>\n'
    }
  }
}

// ============================================================
// [tag:标签内容] 行内药丸标签
// ============================================================

function registerPillTagInline(md: MarkdownIt): void {
  md.inline.ruler.after('emphasis', 'gzh_pilltag', (state, silent) => {
    const start = state.pos
    const src = state.src

    // 检查开头 [tag:
    if (src.charCodeAt(start) !== 0x5B /* [ */) return false
    if (src.slice(start, start + 5) !== '[tag:') return false

    // 查找结束 ]
    let pos = start + 5
    let found = false
    while (pos < src.length) {
      if (src.charCodeAt(pos) === 0x5D /* ] */) {
        found = true
        break
      }
      if (src.charCodeAt(pos) === 0x5C /* \ */) {
        pos += 2
        continue
      }
      pos++
    }

    if (!found) return false
    const content = src.slice(start + 5, pos)
    if (!content.trim()) return false

    if (!silent) {
      const token = state.push('gzh_pilltag', 'span', 0)
      token.content = content
      token.markup = '[tag:]'
    }

    state.pos = pos + 1
    return true
  })

  md.renderer.rules.gzh_pilltag = (tokens, idx) => {
    return `<span class="gzh-pill-tag" data-content="${escapeAttr(tokens[idx].content)}">${tokens[idx].content}</span>`
  }
}

// ============================================================
// :::hr 分割线（多种样式，单行语法，无需闭合）
// 语法：
//   :::hr              → 实线（等价于 ---）
//   :::hr dashed       → 虚线
//   :::hr double       → 双线
//   :::hr dot          → 圆点装饰
//   :::hr diamond      → 菱形装饰
//   :::hr text 文字     → 中间带文字的装饰分割线
//   :::hr 任意文字      → 自动识别为 text 模式
// ============================================================

const HR_VARIANTS = ['solid', 'dashed', 'double', 'dot', 'diamond', 'text', 'primary', 'primary-bold', 'primary-gradient', 'primary-dotted']

function registerHrContainer(md: MarkdownIt): void {
  md.block.ruler.before('fence', 'gzh_hr', (state, startLine, _endLine, silent) => {
    const startPos = state.bMarks[startLine] + state.tShift[startLine]
    const lineText = state.src.slice(startPos, state.eMarks[startLine])

    const match = lineText.match(/^:::hr(?:\s+(.*))?$/)
    if (!match) return false
    if (silent) return true

    const rest = (match[1] || '').trim()
    let variant = 'solid'
    let text = ''

    if (rest) {
      const sp = rest.indexOf(' ')
      const first = sp === -1 ? rest : rest.slice(0, sp)
      if (HR_VARIANTS.includes(first)) {
        variant = first
        if (variant === 'text') {
          text = sp === -1 ? '' : rest.slice(sp + 1).trim()
        }
      } else {
        // 不是已知变体 → 整段作为文字分割线
        variant = 'text'
        text = rest
      }
    }

    const token = state.push('gzh_hr', 'section', 0)
    token.info = variant
    token.content = text
    token.markup = ':::hr'

    // 兼容误写的闭合行 :::
    const nextLine = startLine + 1
    if (nextLine < _endLine) {
      const np = state.bMarks[nextLine] + state.tShift[nextLine]
      const ntext = state.src.slice(np, state.eMarks[nextLine])
      if (/^:::\s*$/.test(ntext)) {
        state.line = nextLine + 1
        return true
      }
    }
    state.line = startLine + 1
    return true
  })

  md.renderer.rules.gzh_hr = (tokens, idx) => {
    const t = tokens[idx]
    const v = (t.info || 'solid').replace(/"/g, '')
    const txt = (t.content || '').replace(/"/g, '')
    return `<section class="gzh-hr" data-variant="${v}" data-text="${txt}"></section>`
  }
}

// ============================================================
// 水平滑动图组：<![描述1](url1),![描述2](url2),...>
// 公众号中展示可左右滑动的多图
// ============================================================

function registerCarousel(md: MarkdownIt): void {
  md.block.ruler.before('paragraph', 'gzh_carousel', (state, startLine, _endLine, silent) => {
    const startPos = state.bMarks[startLine] + state.tShift[startLine]
    const lineText = state.src.slice(startPos, state.eMarks[startLine]).trim()

    // 必须以 <![ 开头，且包含至少一个 ![...](...)
    if (!lineText.startsWith('<![') || !/!\[[^\]]*\]\([^)]*\)/.test(lineText)) return false
    if (silent) return true

    // 提取所有 ![alt](url)
    const imgRe = /!\[([^\]]*)\]\(([^)]+)\)/g
    const images: Array<{ alt: string; url: string }> = []
    let m: RegExpExecArray | null
    while ((m = imgRe.exec(lineText)) !== null) {
      images.push({ alt: m[1].trim(), url: m[2].trim() })
    }
    if (images.length === 0) return false

    const token = state.push('gzh_carousel', 'section', 0)
    token.info = JSON.stringify(images)
    token.map = [startLine, startLine + 1]

    state.line = startLine + 1
    return true
  })

  md.renderer.rules.gzh_carousel = (tokens, idx) => {
    try {
      const images = JSON.parse(tokens[idx].info) as Array<{ alt: string; url: string }>
      const data = encodeURIComponent(JSON.stringify(images.map(i => ({ alt: i.alt, url: i.url }))))
      return `<section class="gzh-carousel" data-images="${escapeAttr(data)}"></section>\n`
    } catch {
      return '<section class="gzh-carousel"></section>\n'
    }
  }
}

// ============================================================
// GitHub 风格提示块：> [!NOTE] / [!TIP] / [!IMPORTANT] / [!WARNING] / [!CAUTION]
// 将 blockquote 中以 [!TYPE] 开头的块解析为提示卡
// ============================================================

const GITHUB_ALERT_TYPES = ['NOTE', 'TIP', 'IMPORTANT', 'WARNING', 'CAUTION']

function registerGithubAlerts(md: MarkdownIt): void {
  md.block.ruler.before('blockquote', 'gzh_github_alert', (state, startLine, endLine, silent) => {
    const startPos = state.bMarks[startLine] + state.tShift[startLine]
    const lineText = state.src.slice(startPos, state.eMarks[startLine])

    // 匹配 > [!TYPE] 开头
    const firstMatch = lineText.match(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(.*)$/)
    if (!firstMatch) return false
    if (silent) return true

    const type = firstMatch[1]
    const firstTitle = firstMatch[2] || ''

    // 收集所有 > 开头的后续行（属于该提示块），直到遇到非 > 行
    const rawLines: string[] = []
    let nextLine = startLine
    while (nextLine < endLine) {
      const p = state.bMarks[nextLine] + state.tShift[nextLine]
      const t = state.src.slice(p, state.eMarks[nextLine])
      const mm = t.match(/^>\s?(.*)$/)
      if (!mm) break
      rawLines.push(mm[1])
      nextLine++
    }
    if (nextLine === startLine) return false

    // 第一行的标题（[!TYPE] 后的文字）作为卡片标题；其余作为正文（透传给 markdown-it 再渲染）
    const bodyLines = rawLines.slice(1)
    const bodySrc = bodyLines.join('\n')

    const openToken = state.push('gzh_github_alert_open', 'section', 1)
    openToken.info = JSON.stringify({ type, title: firstTitle, body: bodySrc })
    openToken.map = [startLine, nextLine]

    const closeToken = state.push('gzh_github_alert_close', 'section', -1)
    closeToken.map = [startLine, nextLine]

    state.line = nextLine
    return true
  })

  md.renderer.rules.gzh_github_alert_open = (tokens, idx) => {
    try {
      const { type, title, body } = JSON.parse(tokens[idx].info)
      const safeType = GITHUB_ALERT_TYPES.includes(type) ? type : 'NOTE'
      const safeTitle = escapeAttr(title || '')
      const safeBody = escapeAttr(body || '')
      return `<section class="gzh-github-alert" data-type="${safeType}" data-title="${safeTitle}" data-body="${safeBody}">`
    } catch {
      return '<section class="gzh-github-alert" data-type="NOTE" data-title="" data-body=""></section>'
    }
  }
  md.renderer.rules.gzh_github_alert_close = () => '</section>\n'
}

// ============================================================
// 任务列表：- [ ] 未完成 / - [x] 已完成
// 通过自定义 inline 标记 + 后处理识别复选框
// ============================================================

function registerTaskList(md: MarkdownIt): void {
  // 在列表项渲染后，检测 [ ] / [x] 开头的文本，替换为任务项结构
  md.core.ruler.push('gzh_tasklist', state => {
    const tokens = state.tokens
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i]
      if (t.type !== 'inline') continue
      const children = t.children
      if (!children || children.length === 0) continue
      const first = children[0]
      // 检测开头为 [ ] 或 [x] 的文本
      if (first.type === 'text' && /^\[([ xX])\]\s/.test(first.content)) {
        const m = first.content.match(/^\[([ xX])\]\s(.*)$/)
        if (m) {
          const checked = m[1].toLowerCase() === 'x'
          const rest = m[2]
          // 将该 inline token 的内容整体作为一个任务项，标记给后处理
          const wrap = new state.Token('gzh_task_item_open', 'span', 1)
          wrap.attrSet('class', 'gzh-task-item')
          wrap.attrSet('data-checked', checked ? 'true' : 'false')
          const textToken = new state.Token('text', '', 0)
          textToken.content = rest
          const wrapClose = new state.Token('gzh_task_item_close', 'span', -1)
          // 重构 children
          children[0] = wrap
          children.splice(1, 0, textToken, wrapClose)
        }
      }
    }
    return true
  })
}

// ============================================================
// ++下划线++ 行内语法（关键词下划线标记）
// ============================================================

function registerUnderlineInline(md: MarkdownIt): void {
  md.inline.ruler.after('emphasis', 'gzh_underline', (state, silent) => {
    const start = state.pos
    const src = state.src
    if (src.charCodeAt(start) !== 0x2B /* + */) return false
    if (src.charCodeAt(start + 1) !== 0x2B) return false

    let pos = start + 2
    let found = false
    while (pos < src.length) {
      if (src.charCodeAt(pos) === 0x2B && src.charCodeAt(pos + 1) === 0x2B) {
        if (pos === start + 2) { pos += 2; continue }
        found = true
        break
      }
      if (src.charCodeAt(pos) === 0x5C) { pos += 2; continue }
      pos++
    }
    if (!found) return false
    const content = src.slice(start + 2, pos)
    if (!content.trim()) return false
    if (!silent) {
      const token = state.push('gzh_underline', 'span', 0)
      token.content = content
      token.markup = '++'
    }
    state.pos = pos + 2
    return true
  })

  md.renderer.rules.gzh_underline = (tokens, idx) => {
    return `<span class="gzh-underline">${tokens[idx].content}</span>`
  }
}

// ============================================================
// ^上标^ 与 ~下标~ 行内语法
// ============================================================

function registerSupSubInline(md: MarkdownIt): void {
  // 上标 ^
  md.inline.ruler.after('emphasis', 'gzh_sup', (state, silent) => {
    const start = state.pos
    const src = state.src
    if (src.charCodeAt(start) !== 0x5E /* ^ */) return false
    if (src.charCodeAt(start + 1) === 0x5E) return false // 跳过 ^^
    let pos = start + 1
    let found = false
    while (pos < src.length) {
      const c = src.charCodeAt(pos)
      if (c === 0x5E) { found = true; break }
      if (c === 0x5C) { pos += 2; continue }
      if (c === 0x20 || c === 0x0A || c === 0x0D) return false // 不允许跨空格/换行
      pos++
    }
    if (!found) return false
    const content = src.slice(start + 1, pos)
    if (!content.trim()) return false
    if (!silent) {
      const token = state.push('gzh_sup', 'sup', 0)
      token.content = content
    }
    state.pos = pos + 1
    return true
  })

  // 下标 ~（注意：~~ 已被删除线占用，需在 emphasis 之后、避免冲突）
  md.inline.ruler.after('emphasis', 'gzh_sub', (state, silent) => {
    const start = state.pos
    const src = state.src
    if (src.charCodeAt(start) !== 0x7E /* ~ */) return false
    if (src.charCodeAt(start + 1) === 0x7E) return false // 跳过 ~~（删除线）
    let pos = start + 1
    let found = false
    while (pos < src.length) {
      const c = src.charCodeAt(pos)
      if (c === 0x7E) { found = true; break }
      if (c === 0x5C) { pos += 2; continue }
      if (c === 0x20 || c === 0x0A || c === 0x0D) return false
      pos++
    }
    if (!found) return false
    const content = src.slice(start + 1, pos)
    if (!content.trim()) return false
    if (!silent) {
      const token = state.push('gzh_sub', 'sub', 0)
      token.content = content
    }
    state.pos = pos + 1
    return true
  })

  md.renderer.rules.gzh_sup = (tokens, idx) => `<sup class="gzh-sup">${tokens[idx].content}</sup>`
  md.renderer.rules.gzh_sub = (tokens, idx) => `<sub class="gzh-sub">${tokens[idx].content}</sub>`
}

// ============================================================
// :emoji: GitHub 风格短代码 → Unicode Emoji
// ============================================================

const EMOJI_MAP: Record<string, string> = {
  smile: '😄', grin: '😁', laughing: '😆', blush: '😊', heart_eyes: '😍',
  wink: '😉', thinking: '🤔', rofl: '🤣', sob: '😭', cry: '😢',
  angry: '😠', rage: '😡', fearful: '😨', flushed: '😳', sleepy: '😴',
  tired: '😫', mask: '😷', sunglasses: '😎', cool: '🆒', innocent: '😇',
  star: '⭐', star2: '🌟', sparkles: '✨', fire: '🔥', heart: '❤️',
  hearts: '💕', broken_heart: '💔', thumbsup: '👍', thumbsdown: '👎',
  ok_hand: '👌', clap: '👏', raised_hands: '🙌', pray: '🙏', muscle: '💪',
  tada: '🎉', rocket: '🚀', bulb: '💡', warning: '⚠️', bulb1: '💡',
  check: '✅', x: '❌', question: '❓', exclamation: '❗', bell: '🔔',
  book: '📚', memo: '📝', pencil: '✏️', bul: '🔵', eyes: '👀',
  coffee: '☕', zap: '⚡', sun: '☀️', moon: '🌙', rainbow: '🌈',
  bug: '🐛', robot: '🤖', computer: '💻', mobile: '📱', mail: '📧',
  link: '🔗', lock: '🔒', unlock: '🔓', search: '🔍', settings: '⚙️',
  clock: '⏰', calendar: '📅', chart: '📊', money: '💰', gift: '🎁',
  flag: '🚩', location: '📍', warning_sign: '⚠️', white_check: '✅',
  info: 'ℹ️', heavy_plus: '➕', heavy_minus: '➖', arrow_right: '➡️',
  arrow_left: '⬅️', arrow_up: '⬆️', arrow_down: '⬇️', point_right: '👉',
  point_left: '👈', point_up: '👆', point_down: '👇', hundred: '💯',
  eyes_roll: '🙄', dizzy: '😵', hushed: '😯', open_mouth: '😮',
  tongue: '😛', sweat: '😅', cold_sweat: '😰', relief: '😌',
  kiss: '😘', cupid: '😘', smirk: '😏', unamused: '😒', disappointed: '😞',
  pensive: '😔', confused: '😕', worried: '😟', frown: '😔',
  grey_question: '❔', grey_exclamation: '❕', bangbang: '‼️',
  heavy_exclamation: '❗', heavy_question: '❓', interrobang: '⁉️',
  key: '🔑', wrench: '🔧', hammer: '🔨', gear: '⚙️', tools: '🛠️',
  article: '📄', newspaper: '📰', page: '📄', books: '📚', notebook: '📓',
  folder: '📁', file: '📄', package: '📦', truck: '🚚', ship: '🚢',
  airplane: '✈️', car: '🚗', bus: '🚌', train: '🚆', bike: '🚲',
  home: '🏠', building: '🏢', city: '🏙️', factory: '🏭', school: '🏫',
  hospital: '🏥', bank: '🏦', store: '🏪', hotel: '🏨', park: '🏞️',
  tree: '🌳', flower: '🌸', rose: '🌹', seedling: '🌱', leaf: '🍃',
  apple: '🍎', banana: '🍌', grapes: '🍇', watermelon: '🍉',
  pizza: '🍕', hamburger: '🍔', fries: '🍟', cake: '🍰', cookie: '🍪',
  coffee2: '☕', tea: '🍵', beer: '🍺', wine: '🍷', cocktail: '🍸',
  dog: '🐶', cat: '🐱', mouse: '🐭', rabbit: '🐰', bear: '🐻',
  panda: '🐼', tiger: '🐯', lion: '🦁', elephant: '🐘', monkey: '🐵',
  pig: '🐷', cow: '🐮', chicken: '🐔', fish: '🐟', whale: '🐳',
  bug2: '🐛', butterfly: '🦋', honeybee: '🐝', snail: '🐌', octopus: '🐙',
  earth: '🌍', moon2: '🌕', sun2: '🌞', comet: '☄️', star3: '⭐',
  cloud: '☁️', rain: '🌧️', snow: '❄️', lightning: '⚡', umbrella: '☂️',
  music: '🎵', note: '🎶', microphone: '🎤', headphone: '🎧', camera: '📷',
  tv: '📺', phone: '📱', laptop: '💻', watch: '⌚', game: '🎮',
  soccer: '⚽', basketball: '🏀', baseball: '⚾', football: '🏈', tennis: '🎾',
  medal: '🏅', trophy: '🏆', crown: '👑', gem: '💎', moneybag: '💰',
  dollar: '💵', yen: '💴', euro: '💶', pound: '💷', coin: '🪙'
}

function registerEmojiInline(md: MarkdownIt): void {
  md.inline.ruler.after('emphasis', 'gzh_emoji', (state, silent) => {
    const start = state.pos
    const src = state.src
    if (src.charCodeAt(start) !== 0x3A /* : */) return false

    let pos = start + 1
    let found = false
    while (pos < src.length) {
      const c = src.charCodeAt(pos)
      if (c === 0x3A) { found = true; break }
      // 短代码只允许字母、数字、下划线
      if (!(/[a-zA-Z0-9_]/.test(src[pos]))) return false
      pos++
    }
    if (!found) return false
    const code = src.slice(start + 1, pos)
    if (!code) return false
    const emoji = EMOJI_MAP[code]
    if (!emoji) return false
    if (!silent) {
      const token = state.push('text', '', 0)
      token.content = emoji
    }
    state.pos = pos + 1
    return true
  })
}

// ============================================================
// 数学公式：行内 $...$ 与块级 $$...$$
// 解析为占位结构，由 index.ts 用 KaTeX 渲染
// ============================================================

function registerMathBlock(md: MarkdownIt): void {
  // 块级 $$ ... $$
  md.block.ruler.before('fence', 'gzh_math_block', (state, startLine, _endLine, silent) => {
    const startPos = state.bMarks[startLine] + state.tShift[startLine]
    const lineText = state.src.slice(startPos, state.eMarks[startLine])
    if (!lineText.trim().startsWith('$$')) return false
    if (silent) return true

    // 多行：从 $$ 开始，到下一个 $$ 结束
    let nextLine = startLine
    let endLineFound = -1
    let content = ''
    if (lineText.trim() === '$$') {
      // 需要找结束的 $$
      nextLine = startLine + 1
      while (nextLine < _endLine) {
        const np = state.bMarks[nextLine] + state.tShift[nextLine]
        const nt = state.src.slice(np, state.eMarks[nextLine])
        if (nt.trim() === '$$') { endLineFound = nextLine; break }
        content += state.src.slice(state.bMarks[nextLine], state.eMarks[nextLine]) + '\n'
        nextLine++
      }
      if (endLineFound === -1) return false
    } else {
      // 单行 $$ ... $$
      const rest = lineText.trim().slice(2)
      const endIdx = rest.lastIndexOf('$$')
      if (endIdx === -1) return false
      content = rest.slice(0, endIdx)
      endLineFound = startLine
      nextLine = startLine + 1
    }

    const token = state.push('gzh_math_block', 'section', 0)
    token.info = 'block'
    token.content = content.trim()
    token.map = [startLine, endLineFound]

    state.line = nextLine
    return true
  })

  md.renderer.rules.gzh_math_block = (tokens, idx) => {
    const tex = (tokens[idx].content || '').replace(/"/g, '&quot;')
    return `<section class="gzh-math-block" data-tex="${escapeAttr(tex)}"></section>\n`
  }

  // 行内 $ ... $
  md.inline.ruler.after('escape', 'gzh_math_inline', (state, silent) => {
    const start = state.pos
    const src = state.src
    if (src.charCodeAt(start) !== 0x24 /* $ */) return false
    if (src.charCodeAt(start + 1) === 0x24) return false // 跳过 $$
    let pos = start + 1
    let found = false
    while (pos < src.length) {
      const c = src.charCodeAt(pos)
      if (c === 0x24) { found = true; break }
      if (c === 0x5C) { pos += 2; continue }
      if (c === 0x0A || c === 0x0D) return false
      pos++
    }
    if (!found) return false
    const tex = src.slice(start + 1, pos)
    if (!tex.trim()) return false
    if (!silent) {
      const token = state.push('gzh_math_inline', 'span', 0)
      token.content = tex
    }
    state.pos = pos + 1
    return true
  })

  md.renderer.rules.gzh_math_inline = (tokens, idx) => {
    const tex = (tokens[idx].content || '').replace(/"/g, '&quot;')
    return `<span class="gzh-math-inline" data-tex="${escapeAttr(tex)}"></span>`
  }
}

// ============================================================
// Mermaid 图表：```mermaid 代码块
// 解析为占位结构，由 index.ts 用 mermaid 渲染为 SVG
// ============================================================

function registerMermaidBlock(md: MarkdownIt): void {
  const defaultFence = md.renderer.rules.fence!.bind(md.renderer.rules)
  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const lang = (token.info || '').trim().split(/\s+/)[0]
    if (lang === 'mermaid') {
      const code = token.content
      return `<section class="gzh-mermaid" data-code="${escapeAttr(code)}"></section>\n`
    }
    return defaultFence(tokens, idx, options, env, self)
  }
}

// ============================================================
// 局部属性：{.class #id data-*} 追加到前一个块级元素
// 记录到 token 的 attr，由 index.ts 后处理应用
// ============================================================

function registerAttributes(md: MarkdownIt): void {
  md.inline.ruler.push('gzh_attributes', (state, silent) => {
    const start = state.pos
    const src = state.src
    // 必须以 { 开头
    if (src.charCodeAt(start) !== 0x7B /* { */) return false
    // 属性只允许 .class #id data-*
    const rest = src.slice(start)
    const match = rest.match(/^\{([^{}]*)\}/)
    if (!match) return false
    const inner = match[1].trim()
    if (!inner) return false
    // 校验属性格式
    const valid = /^(?:[.#][\w-]+|\s+data-[\w-]+(?:=[^\s}]*))*(?:\s+[.#][\w-]+|\s+data-[\w-]+(?:=[^\s}]*))*$/.test(inner)
    if (!valid) return false
    if (silent) return true

    const token = state.push('gzh_attr', 'span', 0)
    token.content = inner
    token.markup = '{}'
    state.pos = start + match[0].length
    return true
  })

  md.renderer.rules.gzh_attr = (tokens, idx) => {
    // 实际属性应用到前一个元素由 index.ts 的 applyAttributes 处理；
    // 这里先输出一个隐藏标记，后处理时移除
    return `<span class="gzh-attr-marker" data-attrs="${escapeAttr(tokens[idx].content)}" style="display:none"></span>`
  }
}
