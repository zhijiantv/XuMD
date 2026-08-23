/**
 * 模板解析器
 *
 * 功能：
 * 1. 解析组件 HTML 模板中的占位符 {{token.xxx}} 和 {{structure.xxx}}
 * 2. 将 token 色彩值替换到模板中
 * 3. 支持内容占位符 {{content}}、{{title}} 等
 *
 * 占位符语法：
 * - {{token.primary}} → 替换为主题 tokens 中的 primary 颜色
 * - {{token.primaryDark}} → 替换为深色主色
 * - {{content}} → 替换为内容
 * - {{title}} → 替换为标题
 * - {{index}} → 替换为序号
 */

import type { ThemeTokens, ThemeStructure } from './types'

/**
 * 模板替换上下文
 */
export interface TemplateContext {
  /** 色彩 tokens */
  tokens: ThemeTokens
  /** 结构参数（可选） */
  structure?: Partial<ThemeStructure>
  /** 内容变量 */
  vars?: Record<string, string>
}

/**
 * 渲染模板
 * @param template 模板字符串
 * @param context 替换上下文
 */
export function renderTemplate(template: string, context: TemplateContext): string {
  let result = template

  // 1. 替换 {{token.xxx}} 色彩变量
  result = result.replace(/\{\{\s*token\.([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key: string) => {
    const tokenMap = context.tokens as unknown as Record<string, string>
    return tokenMap[key] !== undefined ? tokenMap[key] : ''
  })

  // 2. 替换 {{layout.xxx}} 布局变量
  if (context.structure?.layout) {
    const layoutMap = context.structure.layout as unknown as Record<string, string>
    result = result.replace(/\{\{\s*layout\.([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key: string) => {
      return layoutMap[key] !== undefined ? layoutMap[key] : ''
    })
  }

  // 3. 替换普通变量 {{xxx}}
  if (context.vars) {
    result = result.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) => {
      // 已经被 token/layout 替换过的不再处理
      if (key.startsWith('token.') || key.startsWith('layout.')) {
        return match
      }
      return context.vars![key] !== undefined ? context.vars![key] : match
    })
  }

  return result
}

/**
 * 批量渲染模板对象
 * @param templates 模板集合
 * @param context 替换上下文
 */
export function renderTemplates<T extends Record<string, string>>(
  templates: T,
  context: TemplateContext
): Record<keyof T, string> {
  const result = {} as Record<keyof T, string>
  for (const key of Object.keys(templates) as Array<keyof T>) {
    result[key] = renderTemplate(templates[key], context)
  }
  return result
}
