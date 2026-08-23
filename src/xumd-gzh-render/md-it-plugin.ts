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
          meta[key] = value
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
