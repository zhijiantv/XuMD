/**
 * 主题注册表
 * 6 套主题统一导出
 */

import type { Theme } from '../types'
import { moyuGreen } from './theme-moyu-green'
import { redWhite } from './theme-red-white'
import { graphiteMin } from './theme-graphite-min'
import { zenEmpty } from './theme-zen-empty'
import { moyuTicket } from './theme-moyu-ticket'
import { oliveNote } from './theme-olive-note'

/** 所有主题集合 */
export const themes: Record<string, Theme> = {
  'moyu-green': moyuGreen,
  'red-white': redWhite,
  'graphite-min': graphiteMin,
  'zen-empty': zenEmpty,
  'moyu-ticket': moyuTicket,
  'olive-note': oliveNote
}

/**
 * 根据 ID 获取主题
 */
export function getTheme(id: string): Theme | undefined {
  return themes[id]
}

/**
 * 获取所有主题列表（用于下拉选择）
 */
export function getThemeList(): Array<{
  id: string
  name: string
  description: string
  primaryColor: string
}> {
  return Object.values(themes).map(theme => ({
    id: theme.structure.id,
    name: theme.structure.name,
    description: theme.structure.description,
    primaryColor: theme.tokens.primary
  }))
}
