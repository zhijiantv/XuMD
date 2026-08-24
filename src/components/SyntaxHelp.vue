<template>
  <div class="syntax-help">
    <div class="help-search">
      <input
        type="text"
        v-model="searchQuery"
        placeholder="搜索组件..."
        class="search-input"
      />
    </div>

    <div class="help-categories">
      <button
        v-for="cat in categories"
        :key="cat.id"
        class="category-tab"
        :class="{ active: activeCategory === cat.id }"
        @click="activeCategory = cat.id"
      >
        {{ cat.name }}
      </button>
    </div>

    <div class="help-items">
      <div
        v-for="item in filteredItems"
        :key="item.name"
        class="help-item"
      >
        <div class="help-header">
          <span class="help-name">{{ item.name }}</span>
          <button class="insert-btn" @click="$emit('insert', item.insert)">
            插入
          </button>
        </div>
        <div class="help-desc" v-if="item.desc">{{ item.desc }}</div>
        <div class="help-preview" :id="'help-preview-' + item.id"></div>
        <div class="help-code">
          <code>{{ item.syntax }}</code>
        </div>
      </div>
    </div>

    <div v-if="filteredItems.length === 0" class="help-empty">
      没有找到相关组件
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { gzhRender } from '../xumd-gzh-render'
import { markComponentTypes, applyDarkMode } from '../utils/darkModePreview'

export interface SyntaxItem {
  id: string
  name: string
  category: string
  syntax: string
  sampleMd: string
  insert: string
  desc?: string
}

const props = defineProps<{
  themeId?: string
  isDark?: boolean
}>()

defineEmits<{
  (e: 'insert', text: string): void
}>()

const categories = [
  { id: 'layout', name: '布局组件' },
  { id: 'card', name: '卡片组件' },
  { id: 'content', name: '内容组件' },
  { id: 'divider', name: '分割线' },
  { id: 'special', name: '特殊标记' }
]

const activeCategory = ref('layout')
const searchQuery = ref('')

const syntaxItems: SyntaxItem[] = [
  // ========== 布局组件 ==========
  {
    id: 'cover-image',
    name: '封面（带图）',
    category: 'layout',
    desc: '杂志快讯风格封面，支持图片、标题、副标题和多个标签',
    syntax: ':::cover 主标题\n副标题内容\n---\ntop: 顶部左侧\ntag: 标签1, 标签2\ntag: 标签3\nbottom: 底部文字\nimage: https://...\n:::',
    sampleMd: ':::cover 封面标题示例\n副标题内容描述\n---\ntop: 原创文章\ntag: 新手指南, Markdown\ntag: 公众号\nbottom: 点击查看详情\nimage: https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800\n:::',
    insert: ':::cover 封面标题\n副标题内容\n---\ntop: 原创文章\ntag: 标签1, 标签2\ntag: 标签3\nbottom: 点击查看详情\nimage: 图片地址\n:::\n'
  },
  {
    id: 'cover-simple',
    name: '封面（无图）',
    category: 'layout',
    desc: '简洁风格封面，适合纯文字标题，支持多个标签',
    syntax: ':::cover 主标题\n副标题\n---\ntop: 顶部左侧\ntag: 标签1, 标签2\nbottom: 底部文字\n:::',
    sampleMd: ':::cover 文章标题\n文章副标题\n---\ntop: 精选推荐\ntag: 深度好文, 干货\nbottom: 欢迎阅读\n:::',
    insert: ':::cover 文章标题\n文章副标题\n---\ntop: 精选推荐\ntag: 标签1, 标签2\nbottom: 欢迎阅读\n:::\n'
  },
  {
    id: 'chapter',
    name: '章节标题',
    category: 'layout',
    desc: '自动编号的章节标题',
    syntax: '/// 章节标题',
    sampleMd: '/// 第一章 基础入门\n\n章节内容从这里开始。\n\n/// 第二章 进阶技巧\n\n继续深入学习更多排版技巧。',
    insert: '/// 章节标题\n'
  },
  {
    id: 'toc',
    name: '目录区',
    category: 'layout',
    desc: '自动生成文章目录导航',
    syntax: '[TOC]',
    sampleMd: '[目录]\n\n/// 第一章 基础入门\n\n章节内容。\n\n/// 第二章 进阶技巧\n\n章节内容。\n\n/// 第三章 实战案例\n\n章节内容。',
    insert: '\n[TOC]\n'
  },
  {
    id: 'signature',
    name: '签名区',
    category: 'layout',
    desc: '文章结尾签名/END 标记，支持自定义文字',
    syntax: '[签名 自定义文字]',
    sampleMd: '[签名 感谢阅读，欢迎关注]',
    insert: '\n[签名 感谢阅读]\n'
  },

  // ========== 卡片组件 ==========
  {
    id: 'tip',
    name: '提示卡片 (tip)',
    category: 'card',
    desc: '绿色主题，用于提示、建议、技巧',
    syntax: ':::tip 提示标题\n提示内容\n:::',
    sampleMd: ':::tip 小提示\n这是一条提示内容，用于提供有用的建议和技巧。\n:::',
    insert: ':::tip 小提示\n这里是提示内容\n:::\n'
  },
  {
    id: 'warning',
    name: '警告卡片 (warning)',
    category: 'card',
    desc: '黄色主题，用于警告、注意事项',
    syntax: ':::warning 警告标题\n警告内容\n:::',
    sampleMd: ':::warning 注意\n这是一条警告内容，请务必注意相关事项。\n:::',
    insert: ':::warning 注意\n这里是警告内容\n:::\n'
  },
  {
    id: 'info',
    name: '信息卡片 (info)',
    category: 'card',
    desc: '灰色主题，用于说明、补充信息',
    syntax: ':::info 说明标题\n说明内容\n:::',
    sampleMd: ':::info 说明\n这是一条补充说明信息，提供额外的背景知识。\n:::',
    insert: ':::info 说明\n这里是补充说明\n:::\n'
  },
  {
    id: 'faq',
    name: '问答卡片 (FAQ)',
    category: 'card',
    desc: 'Q&A 风格，用于常见问题解答',
    syntax: ':::faq 问题？\n答案内容\n:::',
    sampleMd: ':::faq 这是一个常见问题？\n这是问题的详细答案，帮助用户理解相关内容。\n:::',
    insert: ':::faq 常见问题？\n这里是答案\n:::\n'
  },
  {
    id: 'quote',
    name: '引用高亮',
    category: 'card',
    desc: '虚线边框引用，用于金句、重点强调',
    syntax: ':::quote 引用内容\n:::',
    sampleMd: ':::quote 这是一句重点强调的话，值得铭记于心。\n:::',
    insert: ':::quote 这是一句重点强调的话\n:::\n'
  },

  // ========== 内容组件 ==========
  {
    id: 'highlight',
    name: '高亮标记',
    category: 'content',
    desc: '行内高亮，用于强调关键词',
    syntax: '==高亮文字==',
    sampleMd: '这是一段==高亮标记==的文字示例',
    insert: '==高亮文字=='
  },
  {
    id: 'step',
    name: '步骤列表',
    category: 'content',
    desc: '带序号的步骤说明列表',
    syntax: '> step 步骤标题\n> 步骤描述内容',
    sampleMd: '> step 第一步\n> 第一步的详细描述内容，告诉用户该怎么做。\n\n> step 第二步\n> 第二步的详细描述内容，继续下一步操作。',
    insert: '> step 第一步\n> 第一步的详细描述内容\n\n> step 第二步\n> 第二步的详细描述内容\n'
  },
  {
    id: 'codeblock',
    name: '代码块',
    category: 'content',
    desc: '带语法高亮的代码块',
    syntax: '```javascript\n// 代码内容\n```',
    sampleMd: '```javascript\nfunction hello() {\n  console.log("Hello World");\n}\n```',
    insert: '```javascript\n// 代码内容\nconsole.log("Hello World");\n```\n'
  },
  {
    id: 'inlinecode',
    name: '行内代码',
    category: 'content',
    desc: '行内代码片段',
    syntax: '`代码`',
    sampleMd: '这是一段包含`行内代码`的文字',
    insert: '`代码`'
  },
  {
    id: 'ul-list',
    name: '无序列表',
    category: 'content',
    desc: '圆点标记的列表项',
    syntax: '- 列表项一\n- 列表项二\n- 列表项三',
    sampleMd: '- 准备素材与大纲\n- 撰写正文初稿\n- 配图与排版优化',
    insert: '- 列表项一\n- 列表项二\n- 列表项三\n'
  },
  {
    id: 'ol-list',
    name: '有序列表',
    category: 'content',
    desc: '自动编号的步骤列表',
    syntax: '1. 步骤一\n2. 步骤二\n3. 步骤三',
    sampleMd: '1. 打开编辑器新建文档\n2. 选择喜欢的主题样式\n3. 一键复制到公众号',
    insert: '1. 步骤一\n2. 步骤二\n3. 步骤三\n'
  },
  {
    id: 'nested-list',
    name: '嵌套列表',
    category: 'content',
    desc: '列表项内部再缩进一层子列表',
    syntax: '- 父列表项一\n  - 子列表项 A\n  - 子列表项 B\n- 父列表项二',
    sampleMd: '- 准备工作\n  - 确定选题方向\n  - 收集参考资料\n- 正式写作\n  - 搭建文章结构\n  - 填充核心内容',
    insert: '- 父列表项一\n  - 子列表项 A\n  - 子列表项 B\n- 父列表项二\n'
  },
  {
    id: 'blockquote',
    name: '引用块',
    category: 'content',
    desc: '左侧竖线标记的引用内容',
    syntax: '> 引用内容文字',
    sampleMd: '> 写作的本质不是炫技，而是把复杂的事讲清楚。',
    insert: '> 引用内容文字\n'
  },
  {
    id: 'bold-italic',
    name: '加粗/斜体/删除线',
    category: 'content',
    desc: '行内文字强调：加粗、斜体、删除线',
    syntax: '**加粗** *斜体* ~~删除线~~',
    sampleMd: '这是**加粗文字**，这是*斜体文字*，这是~~删除线文字~~',
    insert: '**加粗文字** *斜体文字* ~~删除线文字~~'
  },

  // ========== 特殊标记 ==========
  {
    id: 'tag',
    name: '自定义标签',
    category: 'special',
    desc: '在正文中添加彩色标签',
    syntax: '[tag:标签内容]',
    sampleMd: '这是一个[tag:彩色标签]示例',
    insert: '[tag:标签内容]'
  },
  {
    id: 'timeline',
    name: '时间线',
    category: 'special',
    desc: '时间线式内容展示',
    syntax: ':::timeline\n2024.01 - 事件一\n2024.02 - 事件二\n:::',
    sampleMd: ':::timeline\n2024.01 - 第一个事件描述\n2024.02 - 第二个事件描述\n2024.03 - 第三个事件描述\n:::',
    insert: ':::timeline\n2024.01 - 第一个事件\n2024.02 - 第二个事件\n2024.03 - 第三个事件\n:::\n'
  },

  // ========== 分割线（多种样式，颜色跟随主题） ==========
  {
    id: 'hr-solid',
    name: '分割线（实线）',
    category: 'divider',
    desc: '基础实线分割线，等价于 ---，颜色跟随主题',
    syntax: '---   （或 :::hr）',
    sampleMd: ':::hr',
    insert: '\n:::hr\n'
  },
  {
    id: 'hr-dashed',
    name: '分割线（虚线）',
    category: 'divider',
    desc: '虚线样式的分割线，颜色跟随主题',
    syntax: ':::hr dashed',
    sampleMd: ':::hr dashed',
    insert: '\n:::hr dashed\n'
  },
  {
    id: 'hr-double',
    name: '分割线（双线）',
    category: 'divider',
    desc: '上下双实线的分割线，颜色跟随主题',
    syntax: ':::hr double',
    sampleMd: ':::hr double',
    insert: '\n:::hr double\n'
  },
  {
    id: 'hr-dot',
    name: '分割线（圆点装饰）',
    category: 'divider',
    desc: '两侧细线 + 中间圆点，圆点颜色为主题主色',
    syntax: ':::hr dot',
    sampleMd: ':::hr dot',
    insert: '\n:::hr dot\n'
  },
  {
    id: 'hr-diamond',
    name: '分割线（菱形装饰）',
    category: 'divider',
    desc: '两侧细线 + 中间菱形，菱形颜色为主题主色',
    syntax: ':::hr diamond',
    sampleMd: ':::hr diamond',
    insert: '\n:::hr diamond\n'
  },
  {
    id: 'hr-text',
    name: '分割线（文字）',
    category: 'divider',
    desc: '两侧细线 + 中间文字，文字颜色为主题主色',
    syntax: ':::hr text 章节分隔',
    sampleMd: ':::hr text 章节分隔',
    insert: '\n:::hr text 章节分隔\n'
  },
  {
    id: 'hr-primary',
    name: '分割线（主题色·实线）',
    category: 'divider',
    desc: '整条线为主题主色，凸显品牌色',
    syntax: ':::hr primary',
    sampleMd: ':::hr primary',
    insert: '\n:::hr primary\n'
  },
  {
    id: 'hr-primary-bold',
    name: '分割线（主题色·粗线）',
    category: 'divider',
    desc: '加粗的主题主色实线，更醒目',
    syntax: ':::hr primary-bold',
    sampleMd: ':::hr primary-bold',
    insert: '\n:::hr primary-bold\n'
  },
  {
    id: 'hr-primary-gradient',
    name: '分割线（主题色·渐变）',
    category: 'divider',
    desc: '两端主题主色向中心淡出的渐变线',
    syntax: ':::hr primary-gradient',
    sampleMd: ':::hr primary-gradient',
    insert: '\n:::hr primary-gradient\n'
  },
  {
    id: 'hr-primary-dotted',
    name: '分割线（主题色·点线）',
    category: 'divider',
    desc: '主题主色点状线 + 主色圆点',
    syntax: ':::hr primary-dotted',
    sampleMd: ':::hr primary-dotted',
    insert: '\n:::hr primary-dotted\n'
  }
]

const filteredItems = computed(() => {
  let items = syntaxItems.filter(item => item.category === activeCategory.value)

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    items = syntaxItems.filter(item =>
      item.name.toLowerCase().includes(query) ||
      item.syntax.toLowerCase().includes(query) ||
      (item.desc && item.desc.toLowerCase().includes(query))
    )
  }

  return items
})

// 渲染所有组件的预览
function renderPreviews(): void {
  const themeId = props.themeId || 'moyu-green'

  nextTick(() => {
    filteredItems.value.forEach(item => {
      const el = document.getElementById('help-preview-' + item.id)
      if (el) {
        const result = gzhRender(item.sampleMd, {
          themeId,
          customColorEnabled: false,
          authorName: ''
        })
        // 使用全内联样式版本，确保每个预览独立、与实际渲染完全一致
        el.innerHTML = result.copyOutputHtml
        // 标记组件类型并保存原始样式
        markComponentTypes(el as HTMLElement)
        // 如果当前是深色模式，立即应用深色样式
        if (props.isDark) {
          applyDarkMode(el as HTMLElement, true)
        }
      }
    })
  })
}

// 对所有已渲染的预览应用深色模式
function applyDarkToAllPreviews(isDark: boolean): void {
  filteredItems.value.forEach(item => {
    const el = document.getElementById('help-preview-' + item.id)
    if (el) {
      applyDarkMode(el as HTMLElement, isDark)
    }
  })
}

watch(
  () => props.themeId,
  () => {
    renderPreviews()
  }
)

watch(
  () => props.isDark,
  (newVal, oldVal) => {
    // 从深色切回浅色：直接重新渲染所有预览，彻底清除样式残留
    if (oldVal === true && newVal === false) {
      renderPreviews()
    } else {
      applyDarkToAllPreviews(!!newVal)
    }
  }
)

watch(
  [activeCategory, searchQuery],
  () => {
    nextTick(() => {
      renderPreviews()
    })
  }
)

onMounted(() => {
  renderPreviews()
})
</script>

<style scoped>
.syntax-help {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.help-search {
  margin-bottom: 12px;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;
  background: #fff;
  box-sizing: border-box;
}

.search-input:focus {
  border-color: #3b82f6;
}

.help-categories {
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
  flex-shrink: 0;
  overflow-x: auto;
  padding-bottom: 4px;
}

.category-tab {
  padding: 6px 12px;
  border: none;
  background: #f3f4f6;
  border-radius: 6px;
  font-size: 12px;
  color: #6b7280;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.category-tab:hover {
  background: #e5e7eb;
}

.category-tab.active {
  background: #10b981;
  color: #fff;
}

.help-items {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.help-item {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
}

.help-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.help-name {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
}

.help-desc {
  font-size: 11px;
  color: #6b7280;
  margin-bottom: 8px;
  line-height: 1.5;
}

.insert-btn {
  padding: 4px 10px;
  background: #ecfdf5;
  color: #059669;
  border: none;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.insert-btn:hover {
  background: #d1fae5;
}

.help-preview {
  padding: 16px 20px;
  background: #ffffff;
  border-radius: 6px;
  margin-bottom: 8px;
  font-size: 12px;
  line-height: 1.6;
  overflow-x: auto;
  border: 1px solid #f3f4f6;
}

/* 帮助预览中的组件保持真实渲染效果 */
.help-preview :deep(section) {
  max-width: 100% !important;
}

.help-preview :deep(p) {
  margin: 0;
}

.help-preview :deep(img) {
  max-width: 100% !important;
  height: auto !important;
}

.help-preview :deep(pre) {
  max-width: 100%;
  overflow-x: auto;
}

.help-code {
  background: #1e293b;
  color: #e2e8f0;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 11px;
  overflow-x: auto;
}

.help-code code {
  font-family: 'SF Mono', Consolas, Monaco, monospace;
  white-space: pre;
  line-height: 1.6;
}

.help-empty {
  text-align: center;
  color: #9ca3af;
  font-size: 13px;
  padding: 40px 0;
}
</style>
