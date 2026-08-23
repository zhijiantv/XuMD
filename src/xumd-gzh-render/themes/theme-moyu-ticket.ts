/**
 * 主题：摸鱼票据风
 * 风格：票据/门票视觉隐喻，星级评分+编号+硬阴影卡片
 * 适用：测评、工具对比、创意评测
 */

import type { Theme } from '../types'

export const moyuTicket: Theme = {
  structure: {
    id: 'moyu-ticket',
    name: '摸鱼票据',
    description: '票据/门票视觉隐喻，硬阴影卡片，适合测评、工具对比、创意评测',
    scenarios: ['测评', '工具对比', '创意评测'],

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
      container: `<section style="max-width:{{layout.maxWidth}};margin:0 auto;background:#f8f8f6;font-family:{{layout.fontFamily}};color:{{token.textColor}};line-height:{{layout.lineHeight}};letter-spacing:{{layout.letterSpacing}};overflow-x:hidden;padding:20px 0;">{{content}}</section>`,

      coverWithImage: `<section style="margin:0 20px 32px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:8px 8px 0 {{token.primary}};border:2px solid {{token.primary}};">
  <section style="background:{{token.primary}};padding:10px 20px;display:flex;align-items:center;justify-content:space-between;">
    <span style="font-size:11px;color:#fff;font-weight:700;letter-spacing:2px;"><span leaf="">{{top}}</span></span>
    <span style="font-size:11px;color:rgba(255,255,255,0.7);"><span leaf="">{{topRight}}</span></span>
  </section>
  <section style="padding:24px 20px 16px;">
    <p style="font-size:22px;font-weight:900;color:{{token.titleColor}};margin:0 0 12px;line-height:1.3;">
      <span leaf="">{{title}}</span>
    </p>
    <p style="font-size:13px;color:{{token.secondaryTextColor}};margin:0;line-height:1.7;">
      <span leaf="">{{subtitle}}</span>
    </p>
  </section>
  <section style="border-top:2px dashed {{token.borderColor}};padding:10px 20px;">
    {{tagsHtml}}
  </section>
  <section style="border-top:2px dashed {{token.borderColor}};padding:12px 20px;background:{{token.grayBg}};display:flex;align-items:center;justify-content:space-between;">
    <span style="font-size:11px;color:{{token.subTextColor}};font-weight:600;letter-spacing:1px;"><span leaf="">{{bottomText}}</span></span>
    <span style="font-size:11px;color:{{token.primary}};font-weight:700;"><span leaf="">ADMIT ONE</span></span>
  </section>
</section>`,

      coverNoImage: `<section style="margin:0 20px 32px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:8px 8px 0 {{token.primary}};border:2px solid {{token.primary}};">
  <section style="background:{{token.primary}};padding:10px 20px;display:flex;align-items:center;justify-content:space-between;">
    <span style="font-size:11px;color:#fff;font-weight:700;letter-spacing:2px;"><span leaf="">{{top}}</span></span>
    <span style="font-size:11px;color:rgba(255,255,255,0.7);"><span leaf="">{{topRight}}</span></span>
  </section>
  <section style="padding:28px 20px 16px;">
    <p style="font-size:22px;font-weight:900;color:{{token.titleColor}};margin:0 0 12px;line-height:1.3;">
      <span leaf="">{{title}}</span>
    </p>
    <p style="font-size:13px;color:{{token.secondaryTextColor}};margin:0;line-height:1.7;">
      <span leaf="">{{subtitle}}</span>
    </p>
  </section>
  <section style="border-top:2px dashed {{token.borderColor}};padding:10px 20px;">
    {{tagsHtml}}
  </section>
  <section style="border-top:2px dashed {{token.borderColor}};padding:12px 20px;background:{{token.grayBg}};display:flex;align-items:center;justify-content:space-between;">
    <span style="font-size:11px;color:{{token.subTextColor}};font-weight:600;letter-spacing:1px;"><span leaf="">{{bottomText}}</span></span>
    <span style="font-size:11px;color:{{token.primary}};font-weight:700;"><span leaf="">ADMIT ONE</span></span>
  </section>
</section>`,

      toc: `<section style="margin:0 20px 32px;">
  <p style="font-size:11px;color:{{token.subTextColor}};margin:0 0 12px;font-weight:700;letter-spacing:2px;">
    <span leaf="">🎫 目录 / TICKETS</span>
  </p>
  <section style="display:flex;flex-direction:column;gap:8px;">
    {{items}}
  </section>
</section>`,

      tocItem: `<section style="background:#fff;border:2px solid {{token.borderColor}};border-radius:8px;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;">
  <section>
    <p style="font-size:10px;color:{{token.subTextColor}};font-weight:700;letter-spacing:1px;margin:0 0 2px;"><span leaf="">{{index}}</span></p>
    <p style="font-size:14px;font-weight:700;color:{{token.titleColor}};margin:0;"><span leaf="">{{title}}</span></p>
  </section>
  <span style="font-size:11px;color:{{token.subTextColor}};"><span leaf="">→</span></span>
</section>`,

      tocItemActive: `<section style="background:{{token.primary}};border:2px solid {{token.primary}};border-radius:8px;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;box-shadow:4px 4px 0 {{token.primaryDark}};">
  <section>
    <p style="font-size:10px;color:rgba(255,255,255,0.7);font-weight:700;letter-spacing:1px;margin:0 0 2px;"><span leaf="">{{index}}</span></p>
    <p style="font-size:14px;font-weight:700;color:#fff;margin:0;"><span leaf="">{{title}}</span></p>
  </section>
  <span style="font-size:11px;color:#fff;"><span leaf="">✓</span></span>
</section>`,

      chapterTitle: `<section style="margin-top:48px;margin-bottom:28px;padding:0 20px;">
  <section style="background:#fff;border:2px solid {{token.primary}};border-radius:8px;padding:14px 18px;box-shadow:4px 4px 0 {{token.primary}};display:flex;align-items:center;gap:14px;">
    <span style="display:inline-block;background:{{token.primary}};color:#fff;font-size:12px;font-weight:900;padding:4px 10px;border-radius:4px;letter-spacing:1px;"><span leaf="">{{index}}</span></span>
    <p style="font-size:16px;font-weight:800;color:{{token.titleColor}};margin:0;line-height:1.4;flex:1;">
      <span leaf="">{{title}}</span>
    </p>
  </section>
  {{content}}
</section>`,

      paragraph: `<p style="padding:0 20px;margin-bottom:{{layout.paragraphMargin}};font-size:{{layout.fontSize}};line-height:1.8;text-align:justify;">
  <span leaf="">{{content}}</span>
</p>`,

      quote: `<section style="margin:0 20px 24px;background:#fff;border:2px dashed {{token.dividerColor}};border-radius:8px;padding:14px 18px;">
  <p style="font-size:13px;color:{{token.textColor}};margin:0;line-height:1.7;">
    {{content}}
  </p>
</section>`,

      quoteHighlight: `<section style="margin:0 20px 24px;background:{{token.primaryBg}};border:2px solid {{token.primary}};border-radius:8px;padding:16px 20px;text-align:center;box-shadow:4px 4px 0 {{token.primary}};">
  <p style="margin:0;line-height:1.6;">
    <span style="font-size:15px;color:{{token.primaryDark}};font-weight:800;"><span leaf="">{{content}}</span></span>
  </p>
</section>`,

      tipCard: `<section style="margin:0 20px 24px;background:#fff;border:2px solid {{token.primary}};border-radius:8px;padding:14px 18px;box-shadow:4px 4px 0 {{token.primaryBg}};">
  <p style="margin:0 0 8px;">
    <span style="display:inline-block;background:{{token.primary}};color:#fff;font-size:11px;font-weight:700;padding:2px 10px;border-radius:4px;letter-spacing:1px;"><span leaf="">{{title}}</span></span>
  </p>
  <p style="font-size:14px;color:{{token.textColor}};margin:0;line-height:1.8;">
    {{content}}
  </p>
</section>`,

      warningCard: `<section style="margin:0 20px 20px;background:{{token.warningBg}};border:2px solid {{token.warningColor}};border-radius:8px;padding:12px 16px;">
  <p style="font-size:13px;color:{{token.warningTextColor}};margin:0;font-weight:700;">
    <span leaf="">{{content}}</span>
  </p>
</section>`,

      infoCard: `<section style="margin:0 20px 20px;background:{{token.primaryBg}};border:2px solid {{token.primaryLight}};border-radius:8px;padding:12px 16px;">
  <p style="font-size:14px;color:{{token.textColor}};margin:0;line-height:1.8;">
    {{content}}
  </p>
</section>`,

      faqCard: `<section style="margin:0 20px 24px;background:#fff;border:2px solid {{token.borderColor}};border-radius:8px;padding:16px 20px;">
  <p style="font-size:15px;font-weight:800;color:{{token.titleColor}};margin:0 0 12px;">
    <span style="display:inline-block;background:{{token.titleColor}};color:#fff;font-size:12px;font-weight:700;padding:2px 8px;border-radius:4px;margin-right:8px;"><span leaf="">Q</span></span>
    <span leaf="">{{question}}</span>
  </p>
  <section style="padding-left:28px;font-size:14px;color:{{token.textColor}};line-height:1.8;">
    {{content}}
  </section>
</section>`,

      stepItem: `<section style="margin:0 20px 24px;background:#fff;border:2px solid {{token.borderColor}};border-radius:8px;padding:14px 18px;">
  <section style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
    <span style="display:inline-block;background:{{token.primary}};color:#fff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:4px;"><span leaf="">{{index}}</span></span>
    <h4 style="font-size:15px;font-weight:800;color:{{token.titleColor}};margin:0;">
      <span leaf="">{{title}}</span>
    </h4>
  </section>
  <p style="font-size:14px;margin:0;color:{{token.secondaryTextColor}};line-height:1.8;text-align:justify;">
    {{content}}
  </p>
</section>`,

      signature: `<section style="margin:32px 20px 24px;background:#fff;border:2px dashed {{token.dividerColor}};border-radius:12px;padding:24px 20px;text-align:center;">
  <p style="font-size:13px;color:{{token.textColor}};margin:0 0 12px;line-height:1.8;">
    <span leaf="">{{content}}</span>
  </p>
  <p style="font-size:10px;color:{{token.subTextColor}};letter-spacing:2px;margin:0;">
    <span leaf="">— TICKET USED —</span>
  </p>
</section>`,

      codeBlockDark: `<section style="margin:0 20px 20px;border-radius:8px;overflow:hidden;background:{{token.codeBgDark}};border:2px solid {{token.codeHeaderDark}};box-shadow:4px 4px 0 rgba(0,0,0,0.1);">
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

      codeBlockLight: `<section style="margin:0 20px 20px;border-radius:8px;overflow:hidden;background:#fff;border:2px solid {{token.primary}};box-shadow:4px 4px 0 {{token.primaryBg}};">
  <section style="padding:7px 14px;border-bottom:2px dashed {{token.primaryBg}};">
    <span style="font-size:12px;color:{{token.primary}};font-family:Consolas,Monaco,monospace;letter-spacing:1px;font-weight:700;"><span leaf="">{{lang}}</span></span>
  </section>
  <section style="padding:11px 14px;">
    {{content}}
  </section>
</section>`,

      inlineCode: `<code style="background:{{token.primaryBg}};color:{{token.primaryDark}};padding:1px 6px;border-radius:4px;font-family:'SF Mono',Consolas,Monaco,monospace;font-size:13px;">{{content}}</code>`,

      image: `<section style="margin:0 20px 24px;background:#fff;border:2px solid {{token.borderColor}};border-radius:8px;padding:6px;box-shadow:4px 4px 0 rgba(0,0,0,0.05);">
  <span leaf=""><img src="{{src}}" style="max-width:100%;height:auto;display:block;margin:0 auto;border-radius:4px;" /></span>
</section>`,

      imageWithCaption: `<section style="margin:0 20px 8px;background:#fff;border:2px solid {{token.borderColor}};border-radius:8px;padding:6px;box-shadow:4px 4px 0 rgba(0,0,0,0.05);">
  <span leaf=""><img src="{{src}}" style="max-width:100%;height:auto;display:block;margin:0 auto;border-radius:4px;" /></span>
</section>
<p style="font-size:12px;color:{{token.subTextColor}};text-align:center;margin:0 0 24px;">
  <span leaf="">— {{caption}}</span>
</p>`,

      table: `<section style="margin:0 20px 24px;overflow-x:auto;">
  <table style="width:100%;border-collapse:collapse;font-size:13px;background:#fff;border:2px solid {{token.borderColor}};border-radius:8px;overflow:hidden;">
    <thead><tr>{{headers}}</tr></thead>
    <tbody>{{rows}}</tbody>
  </table>
</section>`,

      tableHeader: `<th style="background:{{token.primary}};color:#fff;font-weight:700;padding:10px 12px;text-align:left;border-right:1px solid {{token.primaryLight}};"><span leaf="">{{content}}</span></th>`,

      tableRow: `<tr>{{cells}}</tr>`,

      orderedListItem: `<section style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px;">
  <span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;background:{{token.primary}};color:#fff;font-size:11px;font-weight:700;border-radius:4px;flex-shrink:0;margin-top:1px;border:2px solid {{token.primaryDark}};"><span leaf="">{{index}}</span></span>
  <p style="font-size:14px;color:{{token.textColor}};margin:0;line-height:1.8;flex:1;">
    <span leaf="">{{content}}</span>
  </p>
</section>`,

      unorderedListItem: `<section style="margin-bottom:12px;">
  <p style="margin:0;">
    <span style="font-size:14px;color:{{token.textColor}};line-height:1.8;">
      <span style="display:inline-block;width:8px;height:8px;background:{{token.primary}};border-radius:50%;margin-right:8px;vertical-align:middle;border:2px solid {{token.primaryDark}};"><span leaf=""><br></span></span>
      <span leaf="">{{content}}</span>
    </span>
  </p>
</section>`,

      divider: `<section style="padding:0 20px;margin:32px 0;">
  <section style="border-top:2px dashed {{token.dividerColor}};">
    <span leaf=""><br></span>
  </section>
</section>`,

      inlineStrong: `<strong style="color:{{token.primary}};">{{content}}</strong>`,
      inlineEm: `<em>{{content}}</em>`,
      inlineHighlight: `<mark style="background:{{token.highlightBg}};padding:0 4px;color:{{token.titleColor}};">{{content}}</mark>`,
      inlineUnderline: `<u style="border-bottom:2px solid {{token.underlineColor}};">{{content}}</u>`,
      inlineDelete: `<del style="color:{{token.secondaryTextColor}};">{{content}}</del>`,

      subTitle: `<p style="margin:28px 20px 14px;font-size:16px;font-weight:800;color:{{token.titleColor}};line-height:1.5;">
  <span style="display:inline-block;background:{{token.primary}};color:#fff;padding:4px 12px;border-radius:4px;font-size:14px;margin-right:8px;"><span leaf="">★</span></span>
  <span leaf="">{{content}}</span>
</p>`,

      heading1: `<section style="margin:32px 20px 24px;background:#fff;border:2px solid {{token.primary}};border-radius:8px;box-shadow:6px 6px 0 {{token.primary}};overflow:hidden;">
  <section style="background:{{token.primary}};padding:6px 14px;display:flex;align-items:center;justify-content:space-between;">
    <span style="font-size:10px;color:#fff;font-weight:700;letter-spacing:2px;"><span leaf="">TICKET · H1</span></span>
    <span style="font-size:10px;color:rgba(255,255,255,0.7);"><span leaf="">NO.001</span></span>
  </section>
  <section style="padding:14px 18px;border-top:2px dashed {{token.primaryBg}};">
    <p style="margin:0;font-size:20px;font-weight:900;color:{{token.titleColor}};line-height:1.35;">
      <span leaf="">{{content}}</span>
    </p>
  </section>
</section>`,

      heading3: `<p style="margin:24px 20px 12px;font-size:15px;font-weight:800;color:{{token.titleColor}};line-height:1.5;border-left:4px solid {{token.primary}};padding-left:10px;">
  <span leaf="">{{content}}</span>
</p>`,

      pillTag: `<span style="display:inline-block;background:{{token.primary}};color:#fff;font-size:12px;font-weight:700;padding:3px 10px;border-radius:4px;border:2px solid {{token.primaryDark}};">{{content}}</span>`,

      // 时间线（车票风格）
      timeline: `<section style="margin:0 20px 24px;">{{items}}</section>`,
      timelineItem: `<section style="display:flex;margin-bottom:20px;">
  <section style="display:flex;flex-direction:column;align-items:center;margin-right:16px;flex-shrink:0;">
    <section style="width:16px;height:16px;border-radius:50%;background:{{token.primary}};border:2px solid {{token.primaryDark}};margin-top:2px;">
      <span leaf=""><br></span>
    </section>
    <section style="width:2px;border-left:2px dashed {{token.borderColor}};flex:1;margin-top:4px;min-height:40px;{{#isLast}}display:none;{{/isLast}}">
      <span leaf=""><br></span>
    </section>
  </section>
  <section style="flex:1;padding-bottom:8px;">
    <p style="font-size:12px;font-weight:700;color:{{token.primaryDark}};margin:0 0 6px;">
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
    borderColor: '#111827',
    grayBg: '#F9FAFB',
    lightGrayBg: '#F3F4F6',
    white: '#FFFFFF',
    highlightBg: '#FDE68A',
    tagBg: '#059669',
    tagTextColor: '#ffffff',
    warningColor: '#F59E0B',
    warningBg: '#FFFBEB',
    warningTextColor: '#92400E',
    codeBgDark: '#1E293B',
    codeTextDark: '#E2E8F0',
    codeHeaderDark: '#0F172A',
    inlineCodeBg: '#ECFDF5',
    inlineCodeColor: '#047857'
  }
}
