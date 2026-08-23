/**
 * 主题：摸鱼绿
 * 风格：绿色杂志风，卡片丰富、信息密度高
 * 适用：教程、测评、清单、工具盘点
 */

import type { Theme } from '../types'

export const moyuGreen: Theme = {
  structure: {
    id: 'moyu-green',
    name: '摸鱼绿',
    description: '绿色杂志风，卡片丰富、信息密度高，适合教程、测评、清单、工具盘点',
    scenarios: ['教程', '测评', '清单', '工具盘点'],

    layout: {
      fontSize: '14px',
      lineHeight: '1.75',
      letterSpacing: '0.5px',
      maxWidth: '677px',
      contentPadding: '0 20px',
      paragraphMargin: '16px',
      chapterMargin: '48px',
      fontFamily: "-apple-system,BlinkMacSystemFont,'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif"
    },

    components: {
      // 全局容器
      container: `<section style="max-width:{{layout.maxWidth}};margin:0 auto;background:#ffffff;font-family:{{layout.fontFamily}};color:{{token.textColor}};line-height:{{layout.lineHeight}};letter-spacing:{{layout.letterSpacing}};overflow-x:hidden;padding:20px 0;">{{content}}</section>`,

      // 封面（杂志快讯风）
      coverWithImage: `<section style="margin:0 20px 32px;background:#fff;border:1.5px solid {{token.primaryBg}};border-radius:20px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);">
  <section style="padding:32px 28px 28px;">
    <section style="display:flex;align-items:center;gap:8px;margin-bottom:20px;">
      <span style="width:6px;height:6px;background:{{token.primary}};border-radius:50%;"><span leaf=""><br></span></span>
      <span style="font-size:11px;font-weight:700;letter-spacing:3px;color:{{token.primary}};"><span leaf="">{{top}}</span></span>
      <section style="flex:1;height:1px;overflow:hidden;background:linear-gradient(to right,{{token.primaryBg}},transparent);"><span leaf=""><br></span></section>
      <span style="font-size:10px;color:{{token.subTextColor}};font-weight:600;"><span leaf="">{{topRight}}</span></span>
    </section>
    <section style="display:flex;align-items:center;gap:20px;">
      <section style="flex:1;min-width:0;">
        <p style="font-size:24px;font-weight:900;color:{{token.titleColor}};margin:0;line-height:1.2;letter-spacing:-1px;">
          <span leaf="">{{title}}</span>
        </p>
        <p style="font-size:13px;color:{{token.subTextColor}};margin:12px 0 0;line-height:1.7;">
          <span leaf="">{{subtitle}}</span>
        </p>
      </section>
      <section style="flex-shrink:0;width:110px;height:110px;border-radius:16px;overflow:hidden;border:1px solid {{token.primaryBg}};box-shadow:0 4px 12px rgba(0,0,0,0.06);">
        <img src="{{image}}" style="width:100%;height:100%;object-fit:cover;" />
      </section>
    </section>
    <section style="margin-top:20px;padding-top:16px;border-top:1px dashed {{token.primaryBg}};">
      <span style="display:inline-block;font-size:11px;font-weight:600;color:{{token.primary}};background:{{token.primaryBg}};padding:4px 10px;border-radius:20px;">
        <span leaf="">{{tagLabel}}</span>
      </span>
    </section>
  </section>
  <section style="background:linear-gradient(135deg,{{token.primary}},{{token.primaryLight}});padding:12px 28px;display:flex;align-items:center;justify-content:space-between;">
    <p style="font-size:12px;color:rgba(255,255,255,0.9);margin:0;font-weight:600;letter-spacing:0.5px;">
      <span leaf="">{{bottomText}}</span>
    </p>
  </section>
</section>`,

      coverNoImage: `<section style="margin:0 20px 32px;background:#fff;border:1.5px solid {{token.primaryBg}};border-radius:20px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);">
  <section style="padding:32px 28px 28px;">
    <section style="display:flex;align-items:center;gap:8px;margin-bottom:20px;">
      <span style="width:6px;height:6px;background:{{token.primary}};border-radius:50%;"><span leaf=""><br></span></span>
      <span style="font-size:11px;font-weight:700;letter-spacing:3px;color:{{token.primary}};"><span leaf="">{{top}}</span></span>
      <section style="flex:1;height:1px;overflow:hidden;background:linear-gradient(to right,{{token.primaryBg}},transparent);"><span leaf=""><br></span></section>
      <span style="font-size:10px;color:{{token.subTextColor}};font-weight:600;"><span leaf="">{{topRight}}</span></span>
    </section>
    <section>
      <p style="font-size:24px;font-weight:900;color:{{token.titleColor}};margin:0;line-height:1.2;letter-spacing:-1px;">
        <span leaf="">{{title}}</span>
      </p>
      <p style="font-size:13px;color:{{token.subTextColor}};margin:12px 0 0;line-height:1.7;">
        <span leaf="">{{subtitle}}</span>
      </p>
    </section>
    <section style="margin-top:20px;padding-top:16px;border-top:1px dashed {{token.primaryBg}};">
      <span style="display:inline-block;font-size:11px;font-weight:600;color:{{token.primary}};background:{{token.primaryBg}};padding:4px 10px;border-radius:20px;">
        <span leaf="">{{tagLabel}}</span>
      </span>
    </section>
  </section>
  <section style="background:linear-gradient(135deg,{{token.primary}},{{token.primaryLight}});padding:12px 28px;display:flex;align-items:center;justify-content:space-between;">
    <p style="font-size:12px;color:rgba(255,255,255,0.9);margin:0;font-weight:600;letter-spacing:0.5px;">
      <span leaf="">{{bottomText}}</span>
    </p>
  </section>
</section>`,

      // 目录（横向滚动卡片）
      toc: `<section style="margin:0 20px 32px;">
  <section style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
    <p style="font-size:10px;color:{{token.subTextColor}};margin:0;text-transform:uppercase;letter-spacing:2px;font-weight:600;">
      <span leaf="">📦 目录</span>
    </p>
    <p style="font-size:10px;color:{{token.subTextColor}};margin:0;">
      <span leaf="">👉 滑动</span>
    </p>
  </section>
  <section style="overflow-x:scroll;-webkit-overflow-scrolling:touch;white-space:nowrap;padding-bottom:8px;">
    {{items}}
  </section>
</section>`,

      tocItem: `<section style="display:inline-block;white-space:normal;vertical-align:top;width:110px;background:#fff;border:1px solid {{token.borderColor}};border-radius:12px;padding:12px;margin-right:8px;box-shadow:0 2px 6px rgba(0,0,0,0.04);">
  <p style="font-size:9px;font-weight:700;color:{{token.subTextColor}};letter-spacing:1px;margin:0 0 5px;">
    <span leaf="">{{index}}</span>
  </p>
  <p style="font-size:13px;font-weight:800;color:{{token.titleColor}};margin:0 0 3px;">
    <span leaf="">{{title}}</span>
  </p>
</section>`,

      tocItemActive: `<section style="display:inline-block;white-space:normal;vertical-align:top;width:110px;background:linear-gradient(135deg,{{token.primary}},{{token.primaryLight}});border-radius:12px;padding:12px;margin-right:8px;">
  <p style="font-size:9px;font-weight:700;color:rgba(255,255,255,0.7);letter-spacing:1px;margin:0 0 5px;">
    <span leaf="">{{index}}</span>
  </p>
  <p style="font-size:13px;font-weight:800;color:#fff;margin:0 0 3px;">
    <span leaf="">{{title}}</span>
  </p>
</section>`,

      // 章节标题
      chapterTitle: `<section style="margin-top:48px;margin-bottom:32px;padding:0 20px;">
  <section style="display:flex;align-items:center;gap:16px;margin-bottom:24px;">
    <section style="text-align:center;flex-shrink:0;">
      <p style="margin:0;font-size:28px;font-weight:900;color:{{token.primary}};line-height:1;letter-spacing:-2px;">
        <span leaf="">{{index}}</span>
      </p>
      <p style="margin:0;font-size:8px;font-weight:700;color:{{token.dividerColor}};letter-spacing:2px;">
        <span leaf="">PART</span>
      </p>
    </section>
    <span style="width:1px;height:36px;background:{{token.borderColor}};flex-shrink:0;"><span leaf=""><br></span></span>
    <section>
      <p style="margin:0 0 1px;font-size:17px;font-weight:900;color:{{token.titleColor}};letter-spacing:0.3px;">
        <span leaf="">{{title}}</span>
      </p>
    </section>
  </section>
  {{content}}
</section>`,

      // 正文段落
      paragraph: `<p style="padding:0 20px;margin-bottom:{{layout.paragraphMargin}};font-size:{{layout.fontSize}};line-height:1.9;text-align:justify;">
  <span leaf="">{{content}}</span>
</p>`,

      // 引用/金句
      quote: `<section style="margin:0 0 24px;background:{{token.grayBg}};border:1px dashed {{token.dividerColor}};border-radius:8px;padding:12px 16px;text-align:justify;">
  <p style="font-size:13px;color:{{token.textColor}};margin:0;line-height:1.6;">
    {{content}}
  </p>
</section>`,

      quoteHighlight: `<section style="background:#FFF;border:1px dashed {{token.primaryLight}};border-radius:8px;padding:14px 16px;margin-bottom:24px;text-align:center;">
  <p style="margin:0;line-height:1.6;">
    <span style="font-size:15px;color:{{token.primary}};font-weight:bold;border-bottom:3px solid {{token.highlightBg}};padding-bottom:2px;"><span leaf="">{{content}}</span></span>
  </p>
</section>`,

      // 提示卡
      tipCard: `<section style="margin:0 0 24px;background:{{token.primaryBg}};border-radius:0 8px 8px 0;border-left:4px solid {{token.primary}};padding:14px 18px;">
  <p style="margin:0 0 6px;">
    <span style="display:inline-block;background:{{token.primary}};color:#FFFFFF;font-size:11px;font-weight:700;padding:2px 10px;border-radius:4px;letter-spacing:1px;"><span leaf="">{{title}}</span></span>
  </p>
  <p style="font-size:14px;color:{{token.textColor}};margin:0;line-height:1.8;">
    {{content}}
  </p>
</section>`,

      warningCard: `<section style="background:{{token.warningBg}};border:1px solid {{token.highlightBg}};border-radius:12px;padding:12px 16px;margin-bottom:20px;">
  <p style="font-size:13px;color:{{token.warningTextColor}};margin:0;font-weight:700;">
    <span leaf="">{{content}}</span>
  </p>
</section>`,

      infoCard: `<section style="background:{{token.primaryBg}};padding:12px 16px;border-radius:8px;border:1px solid {{token.primaryLight}};margin-bottom:20px;">
  <p style="font-size:13px;color:{{token.textColor}};margin:0;line-height:1.7;text-align:justify;">
    {{content}}
  </p>
</section>`,

      // FAQ 问答卡
      faqCard: `<section style="margin:0 0 24px;background:{{token.grayBg}};border-radius:10px;padding:16px 20px;">
  <p style="font-size:15px;font-weight:800;color:{{token.titleColor}};margin:0 0 10px;">
    <span style="display:inline-block;background:{{token.primary}};color:#fff;font-size:12px;font-weight:700;padding:2px 10px;border-radius:4px;margin-right:8px;"><span leaf="">Q</span></span>
    <span leaf="">{{question}}</span>
  </p>
  <section style="padding-left:28px;font-size:14px;color:{{token.textColor}};line-height:1.8;">
    {{content}}
  </section>
</section>`,

      // 步骤列表
      stepItem: `<section style="margin-bottom:24px;">
  <section style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
    <span style="display:inline-block;background:{{token.titleColor}};color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:12px;"><span leaf="">{{index}}</span></span>
    <h4 style="font-size:15px;font-weight:800;color:{{token.titleColor}};margin:0;">
      <span leaf="">{{title}}</span>
    </h4>
  </section>
  <p style="font-size:14px;margin:0 0 16px;color:{{token.secondaryTextColor}};line-height:1.9;text-align:justify;">
    {{content}}
  </p>
</section>`,

      // 签名块
      signature: `<section style="background:#FFFFFF;border:1px solid {{token.borderColor}};border-radius:16px;padding:32px 20px;text-align:center;margin:0 20px 24px;">
  <p style="font-size:13px;font-weight:bold;color:{{token.titleColor}};margin-bottom:20px;line-height:1.6;">
    <span leaf="">{{content}}</span>
  </p>
  <p style="font-size:10px;color:{{token.subTextColor}};letter-spacing:1px;margin:0;">
    <span leaf="">THANKS FOR READING</span>
  </p>
</section>`,

      // 代码块
      codeBlockDark: `<section style="margin:0 0 20px;border-radius:8px;overflow:hidden;background:{{token.codeBgDark}};box-shadow:0 4px 16px -8px rgba(15,23,42,0.4);">
  <section style="display:flex;align-items:center;padding:9px 14px;background:{{token.codeHeaderDark}};">
    <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#FF5F56;margin-right:7px;font-size:0;line-height:0;overflow:hidden;">.</span>
    <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#FFBD2E;margin-right:7px;font-size:0;line-height:0;overflow:hidden;">.</span>
    <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#27C93F;font-size:0;line-height:0;overflow:hidden;">.</span>
    <span style="margin-left:12px;font-size:12px;color:#64748B;font-family:Consolas,Monaco,monospace;letter-spacing:1px;"><span leaf="">{{lang}}</span></span>
  </section>
  <section style="padding:11px 14px;">
    {{content}}
  </section>
</section>`,

      codeBlockLight: `<section style="margin:0 0 20px;border-radius:8px;overflow:hidden;background:{{token.lightGrayBg}};border:1px solid {{token.borderColor}};border-left:3px solid {{token.primary}};">
  <section style="padding:7px 14px;border-bottom:1px solid {{token.borderColor}};">
    <span style="font-size:12px;color:{{token.subTextColor}};font-family:Consolas,Monaco,monospace;letter-spacing:1px;"><span leaf="">{{lang}}</span></span>
  </section>
  <section style="padding:11px 14px;">
    {{content}}
  </section>
</section>`,

      inlineCode: `<code style="background:{{token.inlineCodeBg}};color:{{token.inlineCodeColor}};padding:1px 6px;border-radius:4px;font-family:'SF Mono',Consolas,Monaco,monospace;font-size:13px;">{{content}}</code>`,

      // 图片
      image: `<section style="text-align:center;margin-bottom:24px;border-radius:12px;overflow:hidden;">
  <span leaf=""><img src="{{src}}" style="max-width:100%;height:auto;display:block;margin:0 auto;" /></span>
</section>`,

      imageWithCaption: `<section style="background:#FFF;border-radius:12px;padding:6px;border:1px solid {{token.borderColor}};box-shadow:0 4px 12px -2px rgba(0,0,0,0.08);margin:0 20px 8px;">
  <section style="margin:0;border-radius:8px;overflow:hidden;">
    <span leaf=""><img src="{{src}}" style="max-width:100%;height:auto;display:block;margin:0 auto;" /></span>
  </section>
</section>
<p style="font-size:12px;color:{{token.subTextColor}};text-align:center;margin:0 0 24px;">
  <span leaf="">— {{caption}}</span>
</p>`,

      // 表格
      table: `<section style="margin-bottom:24px;overflow-x:auto;padding:0 20px;">
  <table style="width:100%;border-collapse:collapse;font-size:13px;">
    <thead><tr>{{headers}}</tr></thead>
    <tbody>{{rows}}</tbody>
  </table>
</section>`,

      tableHeader: `<th style="background:{{token.primary}};color:#fff;font-weight:700;padding:8px 12px;text-align:left;"><span leaf="">{{content}}</span></th>`,

      tableRow: `<tr>{{cells}}</tr>`,

      // 有序列表
      orderedListItem: `<section style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px;">
  <span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;background:{{token.primary}};color:#fff;font-size:11px;font-weight:700;border-radius:50%;flex-shrink:0;margin-top:2px;"><span leaf="">{{index}}</span></span>
  <p style="font-size:14px;color:{{token.textColor}};margin:0;line-height:1.9;flex:1;">
    <span leaf="">{{content}}</span>
  </p>
</section>`,

      // 无序列表
      unorderedListItem: `<section style="margin-bottom:14px;">
  <p style="margin:0 0 6px;">
    <span style="display:inline-block;font-size:13px;font-weight:700;color:{{token.primary}};background:{{token.primaryBg}};padding:3px 10px;border-radius:999px;">
      <span style="display:inline-block;width:6px;height:6px;background:{{token.primary}};border-radius:50%;margin-right:5px;vertical-align:middle;"><span leaf=""><br></span></span>
      <span leaf="">{{content}}</span>
    </span>
  </p>
</section>`,

      // 分割线
      divider: `<section style="padding:0 20px;margin:36px 0;">
  <section style="display:flex;align-items:center;gap:12px;">
    <section style="width:48px;height:3px;background:linear-gradient(to right,{{token.primary}},{{token.primaryLight}});border-radius:2px;flex-shrink:0;">
      <span leaf=""><br></span>
    </section>
    <section style="flex:1;height:1px;background:{{token.dividerColor}};">
      <span leaf=""><br></span>
    </section>
  </section>
</section>`,

      // 行内样式（使用语义化标签，兼容公众号编辑器）
      inlineStrong: `<strong style="color:{{token.primary}};">{{content}}</strong>`,
      inlineEm: `<em>{{content}}</em>`,
      inlineHighlight: `<mark style="background:{{token.highlightBg}};padding:0 4px;color:{{token.titleColor}};">{{content}}</mark>`,
      inlineUnderline: `<u style="border-bottom:2px solid {{token.underlineColor}};">{{content}}</u>`,
      inlineDelete: `<del style="color:{{token.secondaryTextColor}};">{{content}}</del>`,

      // 子标题
      subTitle: `<p style="font-size:15px;font-weight:900;color:{{token.titleColor}};margin-bottom:16px;">
  <span style="background:linear-gradient(180deg,transparent 65%,{{token.highlightBg}} 65%);padding:0 4px;"><span leaf="">{{content}}</span></span>
</p>`,

      heading1: `<section style="margin:36px 0 24px;padding:0 20px;">
  <p style="margin:0;font-size:24px;font-weight:900;color:{{token.titleColor}};line-height:1.3;letter-spacing:0.5px;">
    <span leaf="">{{content}}</span>
  </p>
  <p style="margin:10px 0 0;width:40px;height:3px;background:{{token.primary}};border-radius:2px;">
    <span leaf=""><br></span>
  </p>
</section>`,

      heading3: `<p style="margin:28px 0 14px;font-size:16px;font-weight:800;color:{{token.titleColor}};line-height:1.5;border-left:4px solid {{token.primary}};padding-left:12px;">
  <span leaf="">{{content}}</span>
</p>`,

      pillTag: `<span style="display:inline-block;background:{{token.tagBg}};color:{{token.tagTextColor}};font-size:13px;font-weight:700;padding:3px 10px;border-radius:999px;">{{content}}</span>`,

      // 时间线
      timeline: `<section style="margin:0 20px 24px;">{{items}}</section>`,
      timelineItem: `<section style="display:flex;margin-bottom:20px;">
  <section style="display:flex;flex-direction:column;align-items:center;margin-right:16px;flex-shrink:0;">
    <section style="width:14px;height:14px;border-radius:50%;border:3px solid {{token.primary}};background:#fff;margin-top:4px;box-shadow:0 0 0 2px #fff;">
      <span leaf=""><br></span>
    </section>
    <section style="width:2px;background:{{token.dividerColor}};flex:1;margin-top:4px;min-height:40px;{{#isLast}}display:none;{{/isLast}}">
      <span leaf=""><br></span>
    </section>
  </section>
  <section style="flex:1;padding-bottom:8px;">
    <p style="font-size:12px;font-weight:700;color:{{token.primary}};margin:0 0 6px;letter-spacing:0.5px;">
      <span leaf="">{{date}}</span>
    </p>
    <p style="font-size:14px;margin:0;color:{{token.textColor}};line-height:1.7;">
      <span leaf="">{{text}}</span>
    </p>
  </section>
</section>`
    }
  },

  tokens: {
    primary: '#059669',
    primaryDark: '#047857',
    primaryLight: '#10B981',
    primaryBg: '#ECFDF5',
    underlineColor: '#A7F3D0',
    titleColor: '#111827',
    textColor: '#374151',
    subTextColor: '#9CA3AF',
    secondaryTextColor: '#4B5563',
    dividerColor: '#D1D5DB',
    borderColor: '#E5E7EB',
    grayBg: '#F9FAFB',
    lightGrayBg: '#F3F4F6',
    white: '#FFFFFF',
    highlightBg: '#FDE68A',
    tagBg: 'rgba(5,150,105,0.08)',
    tagTextColor: '#059669',
    warningColor: 'rgb(255,76,0)',
    warningBg: '#FFFBEB',
    warningTextColor: '#92400E',
    codeBgDark: '#1E293B',
    codeTextDark: '#E2E8F0',
    codeHeaderDark: '#0F172A',
    inlineCodeBg: '#F3F4F6',
    inlineCodeColor: '#059669'
  }
}
