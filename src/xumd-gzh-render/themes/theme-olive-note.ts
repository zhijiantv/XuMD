/**
 * 主题：橄榄手记
 * 风格：编辑部内刊质感，墨黑配橙，分节形式多样
 * 适用：内刊手记、深度评测、案例复盘、系统性说明文档
 */

import type { Theme } from '../types'

export const oliveNote: Theme = {
  structure: {
    id: 'olive-note',
    name: '橄榄手记',
    description: '编辑部内刊质感，墨黑配橙色，分节形式多样，适合深度评测、案例复盘',
    scenarios: ['内刊手记', '深度评测', '案例复盘', '系统文档'],

    layout: {
      fontSize: '14px',
      lineHeight: '1.8',
      letterSpacing: '0.3px',
      maxWidth: '677px',
      contentPadding: '0 24px',
      paragraphMargin: '18px',
      chapterMargin: '52px',
      fontFamily: "-apple-system,BlinkMacSystemFont,'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif"
    },

    components: {
      container: `<section style="max-width:{{layout.maxWidth}};margin:0 auto;background:#FBFAF7;font-family:{{layout.fontFamily}};color:{{token.textColor}};line-height:{{layout.lineHeight}};letter-spacing:{{layout.letterSpacing}};overflow-x:hidden;padding:24px 0;">{{content}}</section>`,

      coverWithImage: `<section style="margin:0 24px 36px;background:#1e1f23;color:#fff;border-radius:0;overflow:hidden;">
  <section style="padding:32px 28px;">
    <section style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
      <span style="font-size:11px;color:{{token.warningColor}};font-weight:700;letter-spacing:3px;"><span leaf="">{{top}}</span></span>
      <span style="font-size:10px;color:rgba(255,255,255,0.5);letter-spacing:1px;"><span leaf="">{{topRight}}</span></span>
    </section>
    <p style="font-size:24px;font-weight:800;color:#fff;margin:0 0 12px;line-height:1.35;">
      <span leaf="">{{title}}</span>
    </p>
    <p style="font-size:13px;color:rgba(255,255,255,0.6);margin:0;line-height:1.7;">
      <span leaf="">{{subtitle}}</span>
    </p>
    <section style="margin-top:20px;padding-top:16px;border-top:1px dashed rgba(255,255,255,0.15);">
      <span style="display:inline-block;font-size:11px;font-weight:600;color:{{token.warningColor}};background:rgba(237,123,47,0.1);padding:4px 12px;border-radius:2px;letter-spacing:0.5px;border-left:2px solid {{token.warningColor}};">
        <span leaf="">{{tagLabel}}</span>
      </span>
    </section>
  </section>
  <section style="border-top:1px solid rgba(255,255,255,0.1);padding:10px 28px;display:flex;align-items:center;justify-content:flex-end;">
    <span style="font-size:10px;color:{{token.warningColor}};font-weight:700;letter-spacing:1px;"><span leaf="">{{bottomText}}</span></span>
  </section>
</section>`,

      coverNoImage: `<section style="margin:0 24px 36px;background:#1e1f23;color:#fff;border-radius:0;overflow:hidden;">
  <section style="padding:36px 28px;">
    <section style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;">
      <span style="font-size:11px;color:{{token.warningColor}};font-weight:700;letter-spacing:3px;"><span leaf="">{{top}}</span></span>
      <span style="font-size:10px;color:rgba(255,255,255,0.5);letter-spacing:1px;"><span leaf="">{{topRight}}</span></span>
    </section>
    <p style="font-size:26px;font-weight:800;color:#fff;margin:0 0 14px;line-height:1.35;">
      <span leaf="">{{title}}</span>
    </p>
    <p style="font-size:13px;color:rgba(255,255,255,0.6);margin:0;line-height:1.7;">
      <span leaf="">{{subtitle}}</span>
    </p>
    <section style="margin-top:22px;padding-top:18px;border-top:1px dashed rgba(255,255,255,0.15);">
      <span style="display:inline-block;font-size:11px;font-weight:600;color:{{token.warningColor}};background:rgba(237,123,47,0.1);padding:4px 12px;border-radius:2px;letter-spacing:0.5px;border-left:2px solid {{token.warningColor}};">
        <span leaf="">{{tagLabel}}</span>
      </span>
    </section>
  </section>
  <section style="border-top:1px solid rgba(255,255,255,0.1);padding:10px 28px;display:flex;align-items:center;justify-content:flex-end;">
    <span style="font-size:10px;color:{{token.warningColor}};font-weight:700;letter-spacing:1px;"><span leaf="">{{bottomText}}</span></span>
  </section>
</section>`,

      toc: `<section style="margin:0 24px 36px;background:#fff;border:1px solid {{token.borderColor}};padding:20px;">
  <p style="font-size:11px;color:{{token.primary}};font-weight:700;letter-spacing:2px;margin:0 0 16px;">
    <span leaf="">目 录 / CONTENTS</span>
  </p>
  <section style="display:flex;flex-direction:column;gap:10px;">
    {{items}}
  </section>
</section>`,

      tocItem: `<section style="display:flex;align-items:center;gap:12px;padding-bottom:10px;border-bottom:1px solid {{token.lightGrayBg}};">
  <span style="font-size:11px;color:{{token.subTextColor}};font-weight:700;font-family:Consolas,monospace;flex-shrink:0;"><span leaf="">{{index}}</span></span>
  <p style="font-size:14px;font-weight:600;color:{{token.textColor}};margin:0;flex:1;"><span leaf="">{{title}}</span></p>
  <span style="font-size:11px;color:{{token.subTextColor}};"><span leaf="">→</span></span>
</section>`,

      tocItemActive: `<section style="display:flex;align-items:center;gap:12px;padding-bottom:10px;border-bottom:2px solid {{token.warningColor}};">
  <span style="font-size:11px;color:{{token.warningColor}};font-weight:700;font-family:Consolas,monospace;flex-shrink:0;"><span leaf="">{{index}}</span></span>
  <p style="font-size:14px;font-weight:700;color:{{token.primary}};margin:0;flex:1;"><span leaf="">{{title}}</span></p>
  <span style="font-size:11px;color:{{token.warningColor}};"><span leaf="">●</span></span>
</section>`,

      chapterTitle: `<section style="margin-top:52px;margin-bottom:32px;padding:0 24px;">
  <section style="border-top:2px solid {{token.primary}};padding-top:16px;">
    <section style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:12px;">
      <span style="font-size:11px;color:{{token.warningColor}};font-weight:700;letter-spacing:2px;"><span leaf="">{{index}}</span></span>
      <span style="font-size:10px;color:{{token.subTextColor}};letter-spacing:1px;"><span leaf="">CHAPTER</span></span>
    </section>
    <p style="font-size:20px;font-weight:800;color:{{token.primary}};margin:0;line-height:1.4;">
      <span leaf="">{{title}}</span>
    </p>
  </section>
  {{content}}
</section>`,

      paragraph: `<p style="padding:0 24px;margin-bottom:{{layout.paragraphMargin}};font-size:{{layout.fontSize}};line-height:1.85;text-align:justify;">
  <span leaf="">{{content}}</span>
</p>`,

      quote: `<section style="margin:0 24px 24px;background:#fff;border-left:3px solid {{token.warningColor}};padding:14px 18px;">
  <p style="font-size:13px;color:{{token.textColor}};margin:0;line-height:1.8;font-style:italic;">
    {{content}}
  </p>
</section>`,

      quoteHighlight: `<section style="margin:0 24px 28px;background:#1e1f23;padding:20px 24px;text-align:center;">
  <p style="margin:0;line-height:1.7;">
    <span style="font-size:15px;color:{{token.warningColor}};font-weight:700;letter-spacing:0.5px;"><span leaf="">{{content}}</span></span>
  </p>
</section>`,

      tipCard: `<section style="margin:0 24px 24px;background:#fff;border:1px solid {{token.borderColor}};border-left:3px solid {{token.warningColor}};padding:14px 18px;">
  <p style="margin:0 0 8px;">
    <span style="display:inline-block;background:{{token.warningColor}};color:#fff;font-size:11px;font-weight:700;padding:2px 10px;border-radius:2px;letter-spacing:1px;"><span leaf="">{{title}}</span></span>
  </p>
  <p style="font-size:14px;color:{{token.textColor}};margin:0;line-height:1.8;">
    {{content}}
  </p>
</section>`,

      warningCard: `<section style="margin:0 24px 20px;background:{{token.warningBg}};border:1px solid {{token.warningColor}};padding:12px 16px;">
  <p style="font-size:13px;color:{{token.warningTextColor}};margin:0;font-weight:700;">
    <span leaf="">{{content}}</span>
  </p>
</section>`,

      infoCard: `<section style="margin:0 24px 20px;background:#fff;border:1px solid {{token.borderColor}};padding:14px 18px;">
  <p style="font-size:14px;color:{{token.textColor}};margin:0;line-height:1.8;">
    {{content}}
  </p>
</section>`,

      faqCard: `<section style="margin:0 24px 24px;background:#fff;border:1px solid {{token.borderColor}};padding:16px 20px;">
  <p style="font-size:15px;font-weight:700;color:{{token.primary}};margin:0 0 12px;">
    <span style="display:inline-block;background:{{token.primary}};color:#fff;font-size:12px;font-weight:700;padding:2px 8px;border-radius:2px;margin-right:8px;"><span leaf="">Q</span></span>
    <span leaf="">{{question}}</span>
  </p>
  <section style="padding-left:28px;font-size:14px;color:{{token.textColor}};line-height:1.8;">
    {{content}}
  </section>
</section>`,

      stepItem: `<section style="margin:0 24px 24px;background:#fff;border:1px solid {{token.borderColor}};padding:14px 18px;">
  <section style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
    <span style="display:inline-block;background:{{token.primary}};color:#fff;font-size:10px;font-weight:700;padding:3px 10px;border-radius:2px;font-family:Consolas,monospace;"><span leaf="">{{index}}</span></span>
    <h4 style="font-size:15px;font-weight:700;color:{{token.primary}};margin:0;">
      <span leaf="">{{title}}</span>
    </h4>
  </section>
  <p style="font-size:14px;margin:0;color:{{token.secondaryTextColor}};line-height:1.8;text-align:justify;">
    {{content}}
  </p>
</section>`,

      signature: `<section style="margin:40px 24px 24px;background:#1e1f23;padding:28px 24px;text-align:center;">
  <p style="font-size:13px;color:rgba(255,255,255,0.8);margin:0 0 16px;line-height:1.8;">
    <span leaf="">{{content}}</span>
  </p>
  <p style="font-size:10px;color:{{token.warningColor}};letter-spacing:2px;margin:0;">
    <span leaf="">— END OF NOTE —</span>
  </p>
</section>`,

      codeBlockDark: `<section style="margin:0 24px 20px;border-radius:0;overflow:hidden;background:#1e1f23;border:1px solid #333;">
  <section style="display:flex;align-items:center;padding:8px 14px;background:#2a2b2f;border-bottom:1px solid #333;">
    <span style="font-size:11px;color:{{token.warningColor}};font-family:Consolas,Monaco,monospace;letter-spacing:1px;font-weight:700;"><span leaf="">{{lang}}</span></span>
  </section>
  <section style="padding:11px 14px;">
    {{content}}
  </section>
</section>`,

      codeBlockLight: `<section style="margin:0 24px 20px;border-radius:0;overflow:hidden;background:#fff;border:1px solid {{token.borderColor}};">
  <section style="padding:7px 14px;border-bottom:1px solid {{token.borderColor}};background:{{token.grayBg}};">
    <span style="font-size:11px;color:{{token.secondaryTextColor}};font-family:Consolas,Monaco,monospace;letter-spacing:1px;font-weight:600;"><span leaf="">{{lang}}</span></span>
  </section>
  <section style="padding:11px 14px;">
    {{content}}
  </section>
</section>`,

      inlineCode: `<code style="background:{{token.grayBg}};color:{{token.warningColor}};padding:1px 6px;border-radius:2px;font-family:'SF Mono',Consolas,Monaco,monospace;font-size:13px;">{{content}}</code>`,

      image: `<section style="margin:0 24px 24px;background:#fff;border:1px solid {{token.borderColor}};padding:8px;">
  <span leaf=""><img src="{{src}}" style="max-width:100%;height:auto;display:block;margin:0 auto;" /></span>
</section>`,

      imageWithCaption: `<section style="margin:0 24px 8px;background:#fff;border:1px solid {{token.borderColor}};padding:8px;">
  <span leaf=""><img src="{{src}}" style="max-width:100%;height:auto;display:block;margin:0 auto;" /></span>
</section>
<p style="font-size:12px;color:{{token.subTextColor}};text-align:center;margin:0 0 24px;font-style:italic;">
  <span leaf="">— {{caption}}</span>
</p>`,

      table: `<section style="margin:0 24px 24px;overflow-x:auto;">
  <table style="width:100%;border-collapse:collapse;font-size:13px;background:#fff;border:1px solid {{token.borderColor}};">
    <thead><tr>{{headers}}</tr></thead>
    <tbody>{{rows}}</tbody>
  </table>
</section>`,

      tableHeader: `<th style="background:{{token.primary}};color:#fff;font-weight:700;padding:10px 12px;text-align:left;border-right:1px solid #333;"><span leaf="">{{content}}</span></th>`,

      tableRow: `<tr>{{cells}}</tr>`,

      orderedListItem: `<section style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;">
  <span style="font-size:12px;color:{{token.warningColor}};font-weight:700;flex-shrink:0;margin-top:2px;font-family:Consolas,monospace;"><span leaf="">{{index}}.</span></span>
  <p style="font-size:14px;color:{{token.textColor}};margin:0;line-height:1.8;flex:1;">
    <span leaf="">{{content}}</span>
  </p>
</section>`,

      unorderedListItem: `<section style="margin-bottom:12px;">
  <p style="margin:0;">
    <span style="font-size:14px;color:{{token.textColor}};line-height:1.8;">
      <span style="color:{{token.warningColor}};margin-right:8px;font-weight:700;"><span leaf="">▸</span></span>
      <span leaf="">{{content}}</span>
    </span>
  </p>
</section>`,

      divider: `<section style="padding:0 24px;margin:36px 0;text-align:center;">
  <section style="display:inline-block;position:relative;padding:0 16px;">
    <span style="font-size:10px;color:{{token.subTextColor}};letter-spacing:2px;background:#FBFAF7;position:relative;z-index:1;padding:0 8px;"><span leaf="">◆</span></span>
    <span style="display:block;height:1px;background:{{token.borderColor}};position:relative;margin-top:-6px;z-index:0;"><span leaf=""><br></span></span>
  </section>
</section>`,

      inlineStrong: `<strong style="color:{{token.primary}};">{{content}}</strong>`,
      inlineEm: `<em>{{content}}</em>`,
      inlineHighlight: `<mark style="background:{{token.highlightBg}};padding:0 4px;color:{{token.primary}};">{{content}}</mark>`,
      inlineUnderline: `<u style="border-bottom:2px solid {{token.underlineColor}};">{{content}}</u>`,
      inlineDelete: `<del style="color:{{token.subTextColor}};">{{content}}</del>`,

      subTitle: `<p style="margin:28px 24px 14px;font-size:16px;font-weight:800;color:{{token.primary}};line-height:1.5;">
  <span style="display:inline-block;width:3px;height:16px;background:{{token.warningColor}};margin-right:10px;vertical-align:middle;"><span leaf=""><br></span></span>
  <span leaf="">{{content}}</span>
</p>`,

      heading1: `<section style="margin:36px 24px 24px;border-top:3px solid {{token.primary}};padding-top:14px;">
  <section style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
    <span style="background:{{token.warningColor}};color:#fff;font-size:10px;font-weight:700;padding:2px 10px;letter-spacing:2px;"><span leaf="">CHAPTER</span></span>
    <span style="font-size:10px;color:{{token.subTextColor}};font-family:Consolas,monospace;letter-spacing:1px;"><span leaf="">No. 01</span></span>
  </section>
  <p style="margin:0;font-size:22px;font-weight:800;color:{{token.primary}};line-height:1.35;letter-spacing:0.5px;">
    <span leaf="">{{content}}</span>
  </p>
</section>`,

      heading3: `<p style="margin:24px 24px 12px;font-size:15px;font-weight:700;color:{{token.primary}};line-height:1.5;">
  <span style="color:{{token.warningColor}};margin-right:6px;font-weight:700;"><span leaf="">01</span></span>
  <span leaf="">{{content}}</span>
</p>`,

      pillTag: `<span style="display:inline-block;background:{{token.primary}};color:#fff;font-size:12px;font-weight:600;padding:2px 8px;border-radius:2px;">{{content}}</span>`,

      // 时间线（橄榄笔记风格）
      timeline: `<section style="margin:0 24px 28px;">{{items}}</section>`,
      timelineItem: `<section style="display:flex;margin-bottom:20px;">
  <section style="display:flex;flex-direction:column;align-items:center;margin-right:16px;flex-shrink:0;">
    <section style="width:12px;height:12px;border-radius:50%;background:{{token.primary}};margin-top:4px;">
      <span leaf=""><br></span>
    </section>
    <section style="width:1px;background:{{token.borderColor}};flex:1;margin-top:4px;min-height:40px;{{#isLast}}display:none;{{/isLast}}">
      <span leaf=""><br></span>
    </section>
  </section>
  <section style="flex:1;padding-bottom:8px;">
    <p style="font-size:12px;font-weight:600;color:{{token.primary}};margin:0 0 6px;">
      <span leaf="">{{date}}</span>
    </p>
    <p style="font-size:14px;margin:0;color:{{token.textColor}};line-height:1.75;">
      <span leaf="">{{text}}</span>
    </p>
  </section>
</section>`
    }
  },

  tokens: {
    primary: '#1e1f23',
    primaryDark: '#0f0f12',
    primaryLight: '#3a3b40',
    primaryBg: '#F5F5F4',
    underlineColor: '#ed7b2f',
    titleColor: '#1e1f23',
    textColor: '#2D2E32',
    subTextColor: '#8B8D93',
    secondaryTextColor: '#5C5E63',
    dividerColor: '#E5E4E0',
    borderColor: '#D9D8D3',
    grayBg: '#F5F4F1',
    lightGrayBg: '#FAF9F6',
    white: '#FFFFFF',
    highlightBg: '#FEF3C7',
    tagBg: '#1e1f23',
    tagTextColor: '#ffffff',
    warningColor: '#ed7b2f',
    warningBg: '#FFF7ED',
    warningTextColor: '#C2410C',
    codeBgDark: '#1e1f23',
    codeTextDark: '#E5E7EB',
    codeHeaderDark: '#2a2b2f',
    inlineCodeBg: '#F5F4F1',
    inlineCodeColor: '#ed7b2f'
  }
}
