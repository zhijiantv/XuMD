/**
 * Leaf 文本节点包装器
 *
 * 公众号排版兼容：所有纯文本节点必须包裹 <span leaf="">文本</span>
 * 否则微信编辑器可能会剥掉样式或导致排版异常
 *
 * 使用 DOMParser 在 DOM 层面精确遍历文本节点，避免正则替换的误匹配问题
 */

/**
 * 使用 DOM 方式包裹文本节点（推荐，更精确）
 * @param html 原始 HTML 字符串
 * @returns 处理后的 HTML 字符串
 */
export function wrapLeafDom(html: string): string {
  if (!html) return ''

  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div id="xumd-leaf-wrapper">${html}</div>`, 'text/html')
  const root = doc.getElementById('xumd-leaf-wrapper')
  if (!root) return html

  // 需要跳过的标签（内容本身不需要 leaf 包裹，或已有 leaf）
  // 包括：代码块、语义化行内标签（公众号兼容，这些标签自带格式不应再嵌套 leaf span）
  const skipTags = new Set([
    'code', 'pre', 'script', 'style', 'textarea', 'svg', 'math',
    'strong', 'em', 'del', 's', 'u', 'mark', 'b', 'i'
  ])

  // 已被 leaf 包裹的 span 跳过检查
  function processNode(node: Node): void {
    // 文本节点
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || ''
      // 纯空白（只有换行/空格/制表符）不包裹
      if (!text || /^\s*$/.test(text)) return

      // 检查父元素是否已经是 leaf span
      const parent = node.parentElement
      if (parent && parent.tagName === 'SPAN' && parent.hasAttribute('leaf')) {
        return // 已包裹，跳过
      }

      // 检查父元素是否是带 style 的 span（行内样式元素：加粗/斜体/高亮/代码/删除线等）
      // 这些元素的样式直接在 span 上，不能再嵌套 leaf span，否则公众号编辑器会合并嵌套 span 导致样式丢失
      if (parent && parent.tagName === 'SPAN' && parent.hasAttribute('style') && parent.children.length === 0) {
        return // 行内样式 span 的直接文本子节点，跳过避免嵌套
      }

      // 检查祖先中是否有跳过标签
      let ancestor: HTMLElement | null = parent
      while (ancestor) {
        if (skipTags.has(ancestor.tagName.toLowerCase())) {
          return
        }
        ancestor = ancestor.parentElement
      }

      // 包裹
      const span = doc.createElement('span')
      span.setAttribute('leaf', '')
      span.textContent = text
      if (node.parentNode) {
        node.parentNode.replaceChild(span, node)
      }
      return
    }

    // 元素节点：递归处理子节点
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement

      // 跳过 leaf span 自身
      if (el.tagName === 'SPAN' && el.hasAttribute('leaf')) {
        return
      }

      // 跳过特定标签
      if (skipTags.has(el.tagName.toLowerCase())) {
        return
      }

      // 收集子节点并处理（需要从后往前，因为替换会改变节点列表）
      const children = Array.from(node.childNodes)
      for (let i = children.length - 1; i >= 0; i--) {
        processNode(children[i])
      }
    }
  }

  // 处理根节点的所有子节点
  const rootChildren = Array.from(root.childNodes)
  for (let i = rootChildren.length - 1; i >= 0; i--) {
    processNode(rootChildren[i])
  }

  return root.innerHTML
}

/**
 * 字符串级别的简易 leaf 包裹（备用，不依赖 DOM）
 * 已不推荐使用，保留作为兼容
 * @deprecated 请使用 wrapLeafDom
 */
export function wrapLeaf(html: string): string {
  return wrapLeafDom(html)
}
