/**
 * XuMD 公众号渲染模块 - 类型定义
 *
 * 核心设计原则：
 * - 每套主题 = structure（结构，锁定不可改） + tokens（色彩，可自定义）
 * - 用户自定义颜色只修改 tokens，绝不改动 structure
 */

// ============================================================
// 主题色彩 Tokens（用户可自定义覆盖的部分）
// ============================================================

/**
 * 主题色彩变量集合
 * 所有颜色都支持用户通过主色派生或手动覆盖
 */
export interface ThemeTokens {
  /** 主色调 - 品牌色/强调色，所有衍生色的基础 */
  primary: string
  /** 主色调深 - 深色版本，用于深字色、深色边框 */
  primaryDark: string
  /** 主色调浅 - 浅色版本，用于浅边框、浅底纹 */
  primaryLight: string
  /** 主色调极浅 - 极淡背景色 */
  primaryBg: string
  /** 下划线/标记色 - 正文关键词下划线、次要强调 */
  underlineColor: string

  /** 标题颜色 */
  titleColor: string
  /** 正文颜色 */
  textColor: string
  /** 辅助文字颜色 - 说明、署名、注释 */
  subTextColor: string
  /** 次要文字颜色 */
  secondaryTextColor: string

  /** 分割线颜色 */
  dividerColor: string
  /** 浅边框颜色 */
  borderColor: string
  /** 浅灰背景色 */
  grayBg: string
  /** 极浅灰背景 */
  lightGrayBg: string
  /** 纯白底 */
  white: string

  /** 高亮背景色（荧光笔效果） */
  highlightBg: string
  /** 标签底色 - 胶囊标签背景 */
  tagBg: string
  /** 标签文字色 - 胶囊标签文字 */
  tagTextColor: string

  /** 警告色 - 黄/橙 */
  warningColor: string
  /** 警告背景色 */
  warningBg: string
  /** 警告文字色 */
  warningTextColor: string

  /** 代码块背景色（深色版） */
  codeBgDark: string
  /** 代码块文字色（深色版） */
  codeTextDark: string
  /** 代码块顶栏背景（深色版） */
  codeHeaderDark: string
  /** 行内代码背景 */
  inlineCodeBg: string
  /** 行内代码文字色 */
  inlineCodeColor: string
}

// ============================================================
// 主题 Structure（结构模板，锁定，用户不可修改）
// ============================================================

/**
 * 组件结构模板
 * - 使用 {{token.xxx}} 引用色彩变量
 * - 使用 {{content}}、{{title}} 等占位符引用内容
 * - structure 只定义布局、圆角、阴影、间距等结构风格
 */
export interface ComponentTemplates {
  /** 全局容器 */
  container: string

  /** 封面（有图/无图两版） */
  coverWithImage: string
  coverNoImage: string

  /** 目录卡片（横向滚动/三列卡片/极简细线等不同风格） */
  toc: string
  tocItem: string
  tocItemActive: string

  /** 章节标题 */
  chapterTitle: string

  /** 一级标题（h1） */
  heading1: string

  /** 正文段落 */
  paragraph: string

  /** 引用/金句块 */
  quote: string
  quoteHighlight: string

  /** 提示卡（tip / warning / info） */
  tipCard: string
  warningCard: string
  infoCard: string

  /** FAQ 问答卡 */
  faqCard: string

  /** 步骤列表项 */
  stepItem: string

  /** 签名块 */
  signature: string

  /** 代码块（深色/浅色） */
  codeBlockDark: string
  codeBlockLight: string

  /** 行内代码 */
  inlineCode: string

  /** 图片容器 */
  image: string
  imageWithCaption: string

  /** 表格 */
  table: string
  tableHeader: string
  tableRow: string

  /** 有序列表项 */
  orderedListItem: string

  /** 无序列表项 */
  unorderedListItem: string

  /** 分割线 */
  divider: string

  /** 行内高亮样式 */
  inlineStrong: string
  inlineHighlight: string
  inlineUnderline: string
  inlineDelete: string
  /** 行内斜体样式 */
  inlineEm: string

  /** 小标题/子标题 */
  subTitle: string

  /** 三级标题 */
  heading3: string

  /** 小标签（pill / badge） */
  pillTag: string

  /** 时间线 */
  timeline?: string
  timelineItem?: string
}

/**
 * 排版布局参数（属于 structure 一部分，用户不可改）
 * 决定了主题的整体排版气质：字号、行高、间距、边距等
 */
export interface LayoutParams {
  /** 正文字号 */
  fontSize: string
  /** 行高 */
  lineHeight: string
  /** 字间距 */
  letterSpacing: string
  /** 最大宽度 */
  maxWidth: string
  /** 内容区左右边距 */
  contentPadding: string
  /** 段落间距 */
  paragraphMargin: string
  /** 章节间距 */
  chapterMargin: string
  /** 字体栈 */
  fontFamily: string
  /** 标题字体栈（如衬线字体主题） */
  titleFontFamily?: string
}

/**
 * 主题 Structure - 完整结构定义
 * 锁定不变，保证主题风格统一
 */
export interface ThemeStructure {
  /** 主题标识（英文） */
  id: string
  /** 主题中文名 */
  name: string
  /** 主题描述 */
  description: string
  /** 适用场景 */
  scenarios: string[]

  /** 排版布局参数 */
  layout: LayoutParams
  /** 组件 HTML 模板库 */
  components: ComponentTemplates
}

// ============================================================
// 完整主题定义
// ============================================================

/**
 * 完整主题 = 结构（锁定） + 色彩（可自定义）
 */
export interface Theme {
  /** 结构定义 - 用户不可修改 */
  structure: ThemeStructure
  /** 默认色彩 tokens - 用户可覆盖 */
  tokens: ThemeTokens
}

// ============================================================
// 渲染配置
// ============================================================

/**
 * 用户渲染配置
 */
export interface RenderConfig {
  /** 主题 ID */
  themeId: string
  /** 是否启用自定义颜色 */
  customColorEnabled: boolean
  /** 用户自定义 tokens（只覆盖部分字段） */
  customTokens?: Partial<ThemeTokens>
  /** 作者名（签名区用） */
  authorName?: string
  /** 是否显示封面 */
  showCover?: boolean
  /** 封面标题 */
  coverTitle?: string
  /** 封面副标题 */
  coverSubtitle?: string
  /** 封面图片 URL */
  coverImage?: string
  /** 首行缩进 */
  textIndent?: boolean
}

// ============================================================
// 渲染结果
// ============================================================

/**
 * 渲染输出结果
 */
export interface RenderResult {
  /** 浏览器预览用 HTML - 保留 class 样式，方便调试 */
  previewHtml: string
  /** 公众号复制输出 HTML - 全部行内 style，无 var()、无外部 style */
  copyOutputHtml: string
}

// ============================================================
// Markdown 自定义语法相关类型
// ============================================================

/**
 * 自定义块级语法类型
 */
export type CustomBlockType =
  | 'tip'       // :::tip 提示卡
  | 'warning'   // :::warning 警告卡
  | 'info'      // :::info 信息卡
  | 'faq'       // :::faq 问答卡
  | 'cover'     // 封面标记
  | 'toc'       // 目录标记
  | 'signature' // 签名块
  | 'step'      // 步骤列表

/**
 * 自定义行内语法类型
 */
export type CustomInlineType =
  | 'highlight'  // ==文字== 高亮
  | 'underline'  // ++文字++ 下划线（关键词标记）
  | 'chapter'    // /// 章节编号

// ============================================================
// 颜色派生配置
// ============================================================

/**
 * 颜色派生输入
 */
export interface ColorDeriveInput {
  /** 主色 */
  primary: string
  /** 可选：主题风格类型，影响派生算法 */
  style?: 'default' | 'minimal' | 'zen' | 'warm' | 'cool'
}
