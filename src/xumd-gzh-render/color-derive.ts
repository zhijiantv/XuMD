/**
 * 颜色派生工具
 * 输入主色，自动派生整套配套衍生色
 *
 * 功能：
 * 1. HSL 颜色空间操作（加深、变浅、透明化）
 * 2. 基于主色自动生成完整 ThemeTokens
 * 3. 支持不同风格的派生策略
 */

import type { ThemeTokens, ColorDeriveInput } from './types'

/**
 * 将十六进制颜色转换为 HSL
 * @param hex 十六进制颜色，如 #059669
 */
export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  // 去除 # 号
  hex = hex.replace('#', '')
  // 处理三位简写
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('')
  }

  const r = parseInt(hex.substring(0, 2), 16) / 255
  const g = parseInt(hex.substring(2, 4), 16) / 255
  const b = parseInt(hex.substring(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  }
}

/**
 * 将 HSL 转换为十六进制颜色
 */
export function hslToHex(h: number, s: number, l: number): string {
  s /= 100
  l /= 100
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const color = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
    return Math.round(255 * color).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

/**
 * 加深颜色
 * @param hex 十六进制颜色
 * @param amount 加深量 0-100
 */
export function darken(hex: string, amount: number): string {
  const { h, s, l } = hexToHsl(hex)
  return hslToHex(h, s, Math.max(0, l - amount))
}

/**
 * 变浅颜色
 * @param hex 十六进制颜色
 * @param amount 变浅量 0-100
 */
export function lighten(hex: string, amount: number): string {
  const { h, s, l } = hexToHsl(hex)
  return hslToHex(h, s, Math.min(100, l + amount))
}

/**
 * 降低饱和度
 */
export function desaturate(hex: string, amount: number): string {
  const { h, s, l } = hexToHsl(hex)
  return hslToHex(h, Math.max(0, s - amount), l)
}

/**
 * 生成带透明度的 rgba 颜色字符串
 * @param hex 十六进制颜色
 * @param alpha 透明度 0-1
 */
export function rgba(hex: string, alpha: number): string {
  hex = hex.replace('#', '')
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('')
  }
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

/**
 * 基于主色派生完整主题色彩 tokens
 *
 * 派生策略：
 * - primaryDark: 主色加深 15%
 * - primaryLight: 主色变浅 20%
 * - primaryBg: 主色变浅 45%，饱和度降低
 * - underlineColor: 主色变浅 30%
 * - tagBg / highlightBg: 主色变浅 40%
 * - tagTextColor: 主色加深 10%
 */
export function deriveTokens(input: ColorDeriveInput): Partial<ThemeTokens> {
  const { primary, style = 'default' } = input

  const hsl = hexToHsl(primary)

  // 基础衍生色
  const primaryDark = darken(primary, 15)
  const primaryLight = lighten(primary, 20)
  const primaryBg = hslToHex(hsl.h, Math.max(20, hsl.s - 30), 97)
  const underlineColor = lighten(primary, 30)

  const tagBg = hslToHex(hsl.h, Math.max(15, hsl.s - 25), 95)
  const tagTextColor = darken(primary, 10)
  const highlightBg = lighten(primary, 40)

  // 根据风格微调
  let textColor = '#374151'
  let titleColor = '#111827'
  let subTextColor = '#9CA3AF'
  let secondaryTextColor = '#6B7280'
  let dividerColor = '#E5E7EB'
  let borderColor = '#E5E7EB'
  let grayBg = '#F9FAFB'
  let lightGrayBg = '#F3F4F6'

  if (style === 'minimal') {
    // 极简风：更灰、更克制
    textColor = primary
    titleColor = darken(primary, 10)
    subTextColor = '#A1A1AA'
    secondaryTextColor = '#71717A'
    dividerColor = '#E4E4E7'
    borderColor = '#E4E4E7'
  } else if (style === 'zen') {
    // 禅意风：低饱和、柔和
    textColor = '#525252'
    titleColor = '#2B2B2B'
    subTextColor = '#A3A3A3'
    dividerColor = '#E8E8E8'
    borderColor = '#E8E8E8'
  }

  // 警告色（橙色系，与主色对比）
  const warningColor = '#F59E0B'
  const warningBg = '#FFFBEB'
  const warningTextColor = '#92400E'

  // 代码块颜色
  const codeBgDark = '#1E293B'
  const codeTextDark = '#E2E8F0'
  const codeHeaderDark = '#0F172A'
  const inlineCodeBg = '#F3F4F6'
  const inlineCodeColor = primaryDark

  return {
    primary,
    primaryDark,
    primaryLight,
    primaryBg,
    underlineColor,
    titleColor,
    textColor,
    subTextColor,
    secondaryTextColor,
    dividerColor,
    borderColor,
    grayBg,
    lightGrayBg,
    white: '#FFFFFF',
    highlightBg,
    tagBg,
    tagTextColor,
    warningColor,
    warningBg,
    warningTextColor,
    codeBgDark,
    codeTextDark,
    codeHeaderDark,
    inlineCodeBg,
    inlineCodeColor
  }
}
