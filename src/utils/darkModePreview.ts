/**
 * 预览区深色模式适配工具
 *
 * 通用方案：基于颜色亮度自动识别和替换，适配所有主题。
 * 通过直接修改 DOM 内联样式实现，100% 可靠。
 *
 * 原理：
 * 1. 遍历所有元素的内联样式 color / background / border-color
 * 2. 计算颜色亮度（YIQ 公式）
 * 3. 浅色背景 → 替换为深色背景
 * 4. 深色文字 → 替换为浅色文字
 * 5. 高饱和度彩色（主题色）→ 保持不变
 */

// ========== 颜色工具函数 ==========

/** 将 #rgb / #rrggbb / rgb() 格式转为 RGB 数值 */
function parseColor(color: string): [number, number, number] | null {
  color = color.trim().toLowerCase()
  // 去掉 !important 后缀（深色模式用 setProperty 加了 important）
  color = color.replace(/\s*!important\s*$/, '')
  // #rgb
  if (/^#[0-9a-f]{3}$/.test(color)) {
    const r = parseInt(color[1] + color[1], 16)
    const g = parseInt(color[2] + color[2], 16)
    const b = parseInt(color[3] + color[3], 16)
    return [r, g, b]
  }
  // #rrggbb
  if (/^#[0-9a-f]{6}$/.test(color)) {
    const r = parseInt(color.slice(1, 3), 16)
    const g = parseInt(color.slice(3, 5), 16)
    const b = parseInt(color.slice(5, 7), 16)
    return [r, g, b]
  }
  // rgb(r, g, b)
  const rgbMatch = color.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/)
  if (rgbMatch) {
    return [parseInt(rgbMatch[1]), parseInt(rgbMatch[2]), parseInt(rgbMatch[3])]
  }
  return null
}

/** 计算颜色亮度（YIQ 公式），返回 0-255 */
function getLuminance(r: number, g: number, b: number): number {
  return (r * 299 + g * 587 + b * 114) / 1000
}

/** 计算颜色饱和度，返回 0-1 */
function getSaturation(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  if (max === 0) return 0
  return (max - min) / max
}

/** 判断是否是"接近无色"的灰/白/黑（饱和度低） */
function isNeutral(r: number, g: number, b: number): boolean {
  return getSaturation(r, g, b) < 0.15
}

/** 从 style 字符串中提取某个属性的颜色值 */
function extractColorFromStyle(styleStr: string, property: string): string | null {
  // 匹配 background-color: xxx 或 color: xxx 等
  const regex = new RegExp(`${property}\\s*:\\s*([^;]+)`, 'i')
  const match = styleStr.match(regex)
  if (match) {
    let val = match[1].trim()
    // 去掉 !important 后缀
    val = val.replace(/\s*!important\s*$/i, '')
    // background 可能包含 linear-gradient 等，只取纯色部分
    if (property === 'background' || property === 'background-color') {
      // 如果是渐变，取第一个颜色停止点
      const gradientMatch = val.match(/(#[0-9a-f]{3,6}|rgb\([^)]+\))/i)
      if (gradientMatch) val = gradientMatch[1]
    }
    return val
  }
  return null
}

// ========== 深色模式颜色映射 ==========

/**
 * 将浅色背景转为对应的深色背景
 *
 * 微信官方深色模式规则（developers.weixin.qq.com 插件规范）：
 * - 文章背景统一为 RGB(36,36,36) = #242424（柔和深灰，非纯黑）
 * - 中性（无彩色）背景按亮度映射到接近 #242424 的深灰
 * - 彩色背景：保持色相、压低亮度（微信会按对比度调整）
 */
function bgLightToDark(r: number, g: number, b: number): string {
  const lum = getLuminance(r, g, b)
  const sat = getSaturation(r, g, b)

  // 中性 / 无彩色背景 → 微信深色底
  if (sat < 0.15) {
    if (lum > 240) return '#242424' // 白 / 极浅 → 微信文章底
    if (lum > 200) return '#2b2b2b' // 浅灰 → 略深灰
    return '#333333' // 中灰 → 深灰
  }

  // 彩色背景：保持色相，压低亮度与饱和度（贴近微信按对比度调整的行为）
  const hsl = rgbToHsl(r, g, b)
  const newLum = Math.max(0.1, Math.min(0.22, hsl.l * 0.4))
  const newSat = Math.min(0.5, hsl.s * 0.85)
  const [nr, ng, nb] = hslToRgb(hsl.h, newSat, newLum)
  return `rgb(${Math.round(nr)}, ${Math.round(ng)}, ${Math.round(nb)})`
}

/**
 * 将深色文字转为对应的浅色文字
 *
 * 微信实测映射（官方文档 + 第三方实测）：
 * - #232323（深） → #c3c3c3（浅）
 * - #333333（深） → #b3b3b3（浅）
 * 即：中性深色文字按相对亮度反相为浅灰，彩色文字保持不变。
 */
function textDarkToLight(r: number, g: number, b: number): string {
  const lum = getLuminance(r, g, b)
  const sat = getSaturation(r, g, b)

  // 中性深色文字 → 微信浅灰（参考 #232323→#c3c3c3, #333→#b3b3b3）
  if (sat < 0.15) {
    if (lum < 60) return '#c3c3c3' // 近黑 → 浅灰
    if (lum < 140) return '#b3b3b3' // 深灰 → 中浅灰
    return '#d6d6d6' // 浅灰 → 更浅灰
  }

  // 彩色文字：亮度足够则保持（微信不转换彩色），否则提亮
  if (sat > 0.2) {
    if (lum > 110) return `rgb(${r}, ${g}, ${b})`
    const hsl = rgbToHsl(r, g, b)
    const [nr, ng, nb] = hslToRgb(hsl.h, hsl.s, Math.min(0.72, hsl.l + 0.3))
    return `rgb(${Math.round(nr)}, ${Math.round(ng)}, ${Math.round(nb)})`
  }

  return '#c3c3c3'
}

/**
 * 将浅色边框转为深色边框
 * 微信中性边框统一为深灰，彩色边框保持色相并压暗。
 */
function borderLightToDark(r: number, g: number, b: number): string {
  const sat = getSaturation(r, g, b)
  if (sat < 0.15) {
    // 灰色边框 → 深灰边框
    return '#3a3a3a'
  }
  // 有色边框 → 同色系深色
  const hsl = rgbToHsl(r, g, b)
  const [nr, ng, nb] = hslToRgb(hsl.h, hsl.s * 0.7, Math.max(0.25, hsl.l * 0.5))
  return `rgb(${Math.round(nr)}, ${Math.round(ng)}, ${Math.round(nb)})`
}

// ========== HSL <-> RGB 转换 ==========

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return { h, s, l }
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r, g, b
  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1/6) return p + (q - p) * 6 * t
      if (t < 1/2) return q
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
      return p
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1/3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1/3)
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}

// ========== DOM 处理 ==========

interface DarkModeElement extends HTMLElement {
  _darkOrigins?: {
    color?: string
    backgroundColor?: string
    backgroundFull?: string
    borderColor?: string
    borderFull?: string
    dividerBg?: string
    preBg?: string
    preBorder?: string
    leafColor?: string
  }
}

/** 保存元素原始样式 */
function saveOriginal(el: DarkModeElement, prop: string, value: string): void {
  if (!el._darkOrigins) el._darkOrigins = {}
  if (el._darkOrigins[prop as keyof typeof el._darkOrigins] === undefined) {
    el._darkOrigins[prop as keyof typeof el._darkOrigins] = value
  }
}

/** 处理单个元素的颜色替换 */
function processElement(el: DarkModeElement, isDark: boolean): void {
  const styleAttr = el.getAttribute('style') || ''
  if (!styleAttr) return

  // 跳过 leaf span（内部占位，不单独处理颜色，继承父级）
  if (el.getAttribute('leaf') !== null) {
    if (isDark) {
      saveOriginal(el, 'leafColor', el.style.color || '')
      el.style.setProperty('color', 'inherit', 'important')
    } else if (el._darkOrigins?.leafColor !== undefined) {
      el.style.removeProperty('color')
      el.style.color = el._darkOrigins.leafColor
    }
    return
  }

  // 1. 处理 color（文字颜色）
  const colorMatch = styleAttr.match(/color\s*:\s*([^;]+)/i)
  if (colorMatch) {
    const colorStr = colorMatch[1].trim()
    const rgb = parseColor(colorStr)
    if (rgb) {
      const lum = getLuminance(rgb[0], rgb[1], rgb[2])
      const needReplace = (isNeutral(rgb[0], rgb[1], rgb[2]) && lum < 150) ||
        (!isNeutral(rgb[0], rgb[1], rgb[2]) && lum < 80)
      if (needReplace) {
        saveOriginal(el, 'color', colorStr)
        if (isDark) {
          el.style.setProperty('color', textDarkToLight(rgb[0], rgb[1], rgb[2]), 'important')
        } else {
          el.style.removeProperty('color')
          if (el._darkOrigins?.color) {
            el.style.color = el._darkOrigins.color
          }
        }
      }
    }
  }

  // 2. 处理 background / background-color（背景色）
  // 先找 background-color，再找 background
  let bgColorStr = extractColorFromStyle(styleAttr, 'background-color')
  let bgProp = 'background-color'
  if (!bgColorStr) {
    bgColorStr = extractColorFromStyle(styleAttr, 'background')
    bgProp = 'background'
  }

  if (bgColorStr) {
    const rgb = parseColor(bgColorStr)
    if (rgb) {
      const lum = getLuminance(rgb[0], rgb[1], rgb[2])
      // 只有浅色背景才替换（深色背景不用动）
      if (lum > 180) {
        saveOriginal(el, 'backgroundColor', bgColorStr)
        // 如果原始是 background 简写属性，也保存完整值用于恢复
        if (bgProp === 'background') {
          const fullBgMatch = styleAttr.match(/background\s*:\s*([^;]+)/i)
          if (fullBgMatch) {
            saveOriginal(el, 'backgroundFull', fullBgMatch[1])
          }
        }
        if (isDark) {
          const darkBg = bgLightToDark(rgb[0], rgb[1], rgb[2])
          el.style.setProperty('background-color', darkBg, 'important')
        } else {
          // 恢复：先清掉 important 的 background-color，再恢复原始值
          el.style.removeProperty('background-color')
          // 如果原始是 background 简写，恢复完整 background
          if (el._darkOrigins?.backgroundFull) {
            el.style.background = el._darkOrigins.backgroundFull
          } else if (el._darkOrigins?.backgroundColor) {
            el.style.backgroundColor = el._darkOrigins.backgroundColor
          }
        }
      }
    }
  }

  // 3. 处理 border-color
  const borderMatch = styleAttr.match(/border-color\s*:\s*([^;]+)/i)
  if (borderMatch) {
    const borderStr = borderMatch[1].trim()
    const rgb = parseColor(borderStr)
    if (rgb) {
      const lum = getLuminance(rgb[0], rgb[1], rgb[2])
      if (lum > 180) {
        saveOriginal(el, 'borderColor', borderStr)
        if (isDark) {
          el.style.setProperty('border-color', borderLightToDark(rgb[0], rgb[1], rgb[2]), 'important')
        } else {
          el.style.removeProperty('border-color')
          if (el._darkOrigins?.borderColor) {
            el.style.borderColor = el._darkOrigins.borderColor
          }
        }
      }
    }
  }

  // 4. 处理简写 border（从 border 中提取颜色）
  const borderShorthandMatch = styleAttr.match(/border\s*:\s*([^;]+)/i)
  if (borderShorthandMatch && !borderMatch) {
    const borderVal = borderShorthandMatch[1].trim()
    // 提取颜色部分
    const colorInBorder = borderVal.match(/(#[0-9a-f]{3,6}|rgb\([^)]+\))/i)
    if (colorInBorder) {
      const rgb = parseColor(colorInBorder[1])
      if (rgb) {
        const lum = getLuminance(rgb[0], rgb[1], rgb[2])
        if (lum > 180) {
          saveOriginal(el, 'borderColor', colorInBorder[1])
          // 保存完整 border 值用于恢复
          saveOriginal(el, 'borderFull', borderVal)
          if (isDark) {
            el.style.setProperty('border-color', borderLightToDark(rgb[0], rgb[1], rgb[2]), 'important')
          } else {
            // 恢复完整 border（简写形式）
            el.style.removeProperty('border-color')
            if (el._darkOrigins?.borderFull) {
              el.style.border = el._darkOrigins.borderFull
            }
          }
        }
      }
    }
  }
}

/** 处理 pre 代码块 */
function processPre(el: DarkModeElement, isDark: boolean): void {
  saveOriginal(el, 'preBg', el.style.backgroundColor || '')
  saveOriginal(el, 'preBorder', el.style.borderColor || '')
  if (isDark) {
    el.style.setProperty('background-color', '#1e1e1e', 'important')
    el.style.setProperty('border-color', '#3a3a3a', 'important')
  } else {
    el.style.removeProperty('background-color')
    el.style.removeProperty('border-color')
    if (el._darkOrigins?.preBg) {
      el.style.backgroundColor = el._darkOrigins.preBg
    }
    if (el._darkOrigins?.preBorder) {
      el.style.borderColor = el._darkOrigins.preBorder
    }
  }
}

/** 处理分割线（细且是背景色的元素） */
function processDivider(el: DarkModeElement, isDark: boolean): void {
  const styleAttr = el.getAttribute('style') || ''
  const h = el.offsetHeight
  if (h <= 2 && styleAttr.includes('height:1px')) {
    const bgMatch = styleAttr.match(/background\s*:\s*([^;]+)/i)
    saveOriginal(el, 'dividerBg', bgMatch?.[1] || '')
    if (isDark) {
      el.style.setProperty('background', '#3a3a3a', 'important')
    } else {
      el.style.removeProperty('background')
      if (el._darkOrigins?.dividerBg) {
        el.style.background = el._darkOrigins.dividerBg
      }
    }
  }
}

// ========== 对外 API ==========

/**
 * 应用或取消深色模式
 * @param root 预览区根元素
 * @param isDark 是否启用深色模式
 */
export function applyDarkMode(root: HTMLElement, isDark: boolean): void {
  // 遍历所有有内联样式的元素
  const allEls = root.querySelectorAll('[style]')
  allEls.forEach(el => {
    const htmlEl = el as DarkModeElement

    // 代码块单独处理
    if (el.tagName === 'PRE') {
      processPre(htmlEl, isDark)
      return
    }

    // 分割线单独处理（section 且高度 1px）
    if (el.tagName === 'SECTION') {
      processDivider(htmlEl, isDark)
    }

    // 通用颜色处理
    processElement(htmlEl, isDark)
  })
}

/** 标记组件类型（保留接口，兼容旧调用） */
export function markComponentTypes(_root: HTMLElement): void {
  // 新版本不需要预标记，直接实时计算
}
