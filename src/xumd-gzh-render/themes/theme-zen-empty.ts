/**
 * 主题：留白禅意
 * 风格：极简超大留白、东方禅意气质、衬线大字金句
 * 适用：禅意冥想、极简生活、深度随笔、艺术留白
 */

import type { Theme } from '../types'

export const zenEmpty: Theme = {
  structure: {
    id: 'zen-empty',
    name: '留白禅意',
    description: '极简超大留白、东方禅意气质、衬线大字金句，适合深度随笔、艺术留白',
    scenarios: ['禅意冥想', '极简生活', '深度随笔', '艺术留白'],

    layout: {
      fontSize: '15px',
      lineHeight: '1.9',
      letterSpacing: '0.3px',
      maxWidth: '677px',
      contentPadding: '0 16px',
      paragraphMargin: '26px',
      chapterMargin: '64px',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
      titleFontFamily: "'Noto Serif SC', Georgia, 'Times New Roman', serif"
    },

    components: {
      container: `<section style="max-width:{{layout.maxWidth}};margin:0 auto;background:#FFFFFF;font-family:{{layout.fontFamily}};color:{{token.textColor}};line-height:{{layout.lineHeight}};letter-spacing:{{layout.letterSpacing}};overflow-x:hidden;padding:20px 0;">{{content}}</section>`,

      coverWithImage: `<section style="margin:32px 16px 48px;border-top:1px solid {{token.dividerColor}};border-bottom:1px solid {{token.dividerColor}};">
  <section style="padding:18px 24px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid {{token.dividerColor}};">
    <span style="font-size:11px;color:{{token.primary}};font-weight:500;letter-spacing:2px;"><span leaf="">{{top}}</span></span>
    <span style="font-size:11px;color:{{token.subTextColor}};letter-spacing:1px;"><span leaf="">{{topRight}}</span></span>
  </section>
  <section style="padding:36px 24px 28px;">
    <section style="display:flex;align-items:flex-start;gap:24px;">
      <section style="flex:1;min-width:0;">
        <p style="font-family:'Noto Serif SC',Georgia,'Times New Roman',serif;font-size:20px;font-weight:600;color:{{token.titleColor}};margin:0 0 16px;line-height:1.7;letter-spacing:0.5px;">
          <span leaf="">{{title}}</span>
        </p>
        <p style="font-size:13px;color:{{token.secondaryTextColor}};margin:0;line-height:1.8;">
          <span leaf="">{{subtitle}}</span>
        </p>
      </section>
      <section style="flex-shrink:0;width:100px;height:100px;overflow:hidden;border:1px solid {{token.dividerColor}};">
        <img src="{{image}}" style="width:100%;height:100%;object-fit:cover;" />
      </section>
    </section>
    <section style="margin-top:28px;padding-top:20px;border-top:1px solid {{token.dividerColor}};">
      {{tagsHtml}}
    </section>
  </section>
  <section style="padding:14px 24px;border-top:1px solid {{token.dividerColor}};background:{{token.grayBg}};">
    <p style="font-size:11px;color:{{token.subTextColor}};margin:0;letter-spacing:1.5px;text-align:center;background:#FFFFFF;">
      <span leaf="">{{bottomText}}</span>
    </p>
  </section>
</section>`,

      coverNoImage: `<section style="margin:32px 16px 48px;border-top:1px solid {{token.dividerColor}};border-bottom:1px solid {{token.dividerColor}};text-align:center;background:#FFFFFF;">
  <section style="padding:18px 24px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid {{token.dividerColor}};">
    <span style="font-size:11px;color:{{token.primary}};font-weight:500;letter-spacing:2px;"><span leaf="">{{top}}</span></span>
    <span style="font-size:11px;color:{{token.subTextColor}};letter-spacing:1px;"><span leaf="">{{topRight}}</span></span>
  </section>
  <section style="padding:40px 24px 28px;">
    <p style="font-family:'Noto Serif SC',Georgia,'Times New Roman',serif;font-size:22px;font-weight:600;color:{{token.titleColor}};margin:0 0 18px;line-height:1.7;letter-spacing:0.8px;">
      <span leaf="">{{title}}</span>
    </p>
    <p style="font-size:13px;color:{{token.secondaryTextColor}};margin:0;line-height:1.9;">
      <span leaf="">{{subtitle}}</span>
    </p>
    <section style="margin-top:32px;padding-top:20px;border-top:1px solid {{token.dividerColor}};text-align:left;">
      <span style="font-size:11px;color:{{token.primary}};letter-spacing:1px;">
        <span leaf="">{{tagLabel}}</span>
      </span>
    </section>
  </section>
  <section style="padding:14px 24px;border-top:1px solid {{token.dividerColor}};background:{{token.grayBg}};">
    <p style="font-size:11px;color:{{token.subTextColor}};margin:0;letter-spacing:1.5px;text-align:center;background:#FFFFFF;">
      <span leaf="">{{bottomText}}</span>
    </p>
  </section>
</section>`,

      toc: `<section style="padding:0 16px 48px;">
  <p style="font-size:11px;color:{{token.subTextColor}};margin:0 0 20px;letter-spacing:2px;text-transform:uppercase;">
    <span leaf="">本文脉络</span>
  </p>
  <section style="border-top:1px solid {{token.dividerColor}};">
    <section style="display:flex;">
      {{items}}
    </section>
  </section>
</section>`,

      tocItem: `<section style="flex:1;padding:18px 12px 18px 0;border-bottom:1px solid {{token.dividerColor}};border-right:1px solid {{token.dividerColor}};margin-right:16px;">
  <p style="font-size:11px;color:{{token.primary}};font-weight:600;margin:0 0 6px;letter-spacing:1px;"><span leaf="">{{index}}</span></p>
  <p style="font-size:13px;color:{{token.titleColor}};margin:0;font-weight:500;line-height:1.5;"><span leaf="">{{title}}</span></p>
</section>`,

      tocItemActive: `<section style="flex:1;padding:18px 12px 18px 0;border-bottom:2px solid {{token.primary}};border-right:1px solid {{token.dividerColor}};margin-right:16px;background:{{token.primaryBg}};">
  <p style="font-size:11px;color:{{token.primary}};font-weight:700;margin:0 0 6px;letter-spacing:1px;"><span leaf="">{{index}}</span></p>
  <p style="font-size:13px;color:{{token.titleColor}};margin:0;font-weight:600;line-height:1.5;"><span leaf="">{{title}}</span></p>
</section>`,

      chapterTitle: `<section style="margin-top:64px;margin-bottom:36px;padding:0 16px;">
  <p style="font-size:11px;color:{{token.subTextColor}};margin:0 0 12px;letter-spacing:3px;text-transform:uppercase;">
    <span leaf="">{{index}}</span>
  </p>
  <p style="font-family:'Noto Serif SC',Georgia,'Times New Roman',serif;font-size:20px;font-weight:600;color:{{token.titleColor}};margin:0;line-height:1.6;letter-spacing:0.5px;">
    <span leaf="">{{title}}</span>
  </p>
  <section style="height:1px;background:{{token.dividerColor}};margin-top:20px;">
    <span leaf=""><br></span>
  </section>
  {{content}}
</section>`,

      paragraph: `<p style="padding:0 16px;margin-bottom:{{layout.paragraphMargin}};font-size:{{layout.fontSize}};line-height:1.9;text-align:justify;">
  <span leaf="">{{content}}</span>
</p>`,

      quote: `<section style="margin:0 16px 32px;padding:24px 0;border-top:1px solid {{token.dividerColor}};border-bottom:1px solid {{token.dividerColor}};">
  <p style="font-family:'Noto Serif SC',Georgia,'Times New Roman',serif;font-size:16px;color:{{token.titleColor}};margin:0;line-height:2;text-align:center;background:#FFFFFF;">
    {{content}}
  </p>
</section>`,

      quoteHighlight: `<section style="margin:0 16px 40px;padding:32px 0;text-align:center;background:#FFFFFF;">
  <p style="font-family:'Noto Serif SC',Georgia,'Times New Roman',serif;font-size:18px;font-weight:600;color:{{token.titleColor}};margin:0;line-height:2;">
    <span style="background:{{token.highlightBg}};padding:2px 4px;"><span leaf="">{{content}}</span></span>
  </p>
</section>`,

      tipCard: `<section style="margin:0 16px 28px;padding:20px 0;border-top:1px solid {{token.dividerColor}};border-bottom:1px solid {{token.dividerColor}};">
  <p style="margin:0 0 12px;">
    <span style="font-size:11px;color:{{token.primary}};font-weight:600;letter-spacing:2px;"><span leaf="">{{title}}</span></span>
  </p>
  <p style="font-size:14px;color:{{token.textColor}};margin:0;line-height:1.9;">
    {{content}}
  </p>
</section>`,

      warningCard: `<section style="margin:0 16px 24px;padding:16px 0;border-top:1px solid {{token.warningColor}};border-bottom:1px solid {{token.warningColor}};">
  <p style="margin:0 0 8px;text-align:center;">
    <span style="font-size:11px;color:{{token.warningColor}};font-weight:600;letter-spacing:2px;"><span leaf="">{{title}}</span></span>
  </p>
  <p style="font-size:13px;color:{{token.warningTextColor}};margin:0;font-weight:600;text-align:center;background:#FFFFFF;">
    <span leaf="">{{content}}</span>
  </p>
</section>`,

      infoCard: `<section style="margin:0 16px 24px;padding:16px 0;border-left:1px solid {{token.primary}};padding-left:20px;">
  <p style="margin:0 0 6px;">
    <span style="font-size:11px;color:{{token.primary}};font-weight:600;letter-spacing:2px;"><span leaf="">{{title}}</span></span>
  </p>
  <p style="font-size:14px;color:{{token.textColor}};margin:0;line-height:1.9;">
    {{content}}
  </p>
</section>`,

      faqCard: `<section style="margin:0 16px 28px;padding:24px 0;border-top:1px solid {{token.dividerColor}};border-bottom:1px solid {{token.dividerColor}};">
  <p style="font-family:'Noto Serif SC',Georgia,'Times New Roman',serif;font-size:16px;font-weight:600;color:{{token.titleColor}};margin:0 0 16px;">
    <span style="font-size:12px;color:{{token.primary}};font-weight:600;margin-right:8px;"><span leaf="">Q</span></span>
    <span leaf="">{{question}}</span>
  </p>
  <section style="padding-left:24px;font-size:14px;color:{{token.textColor}};line-height:1.9;">
    {{content}}
  </section>
</section>`,

      stepItem: `<section style="margin:0 16px 28px;">
  <p style="font-size:11px;color:{{token.primary}};font-weight:600;letter-spacing:2px;margin:0 0 8px;"><span leaf="">{{index}}</span></p>
  <h4 style="font-size:16px;font-weight:600;color:{{token.titleColor}};margin:0 0 12px;font-family:'Noto Serif SC',Georgia,'Times New Roman',serif;">
    <span leaf="">{{title}}</span>
  </h4>
  <p style="font-size:14px;margin:0 0 16px;color:{{token.textColor}};line-height:1.9;text-align:justify;">
    {{content}}
  </p>
</section>`,

      signature: `<section style="margin:64px 16px 24px;padding:40px 0;border-top:1px solid {{token.dividerColor}};text-align:center;background:#FFFFFF;">
  <p style="font-size:13px;color:{{token.textColor}};margin:0 0 20px;line-height:2;">
    <span leaf="">{{content}}</span>
  </p>
  <p style="font-size:10px;color:{{token.subTextColor}};letter-spacing:4px;margin:0;">
    <span leaf="">· 终 ·</span>
  </p>
</section>`,

      codeBlockDark: `<section style="margin:0 16px 24px;border-radius:0;overflow:hidden;background:{{token.grayBg}};border:1px solid {{token.dividerColor}};">
  <section style="padding:8px 14px;border-bottom:1px solid {{token.dividerColor}};">
    <span style="font-size:11px;color:{{token.subTextColor}};font-family:Consolas,Monaco,monospace;letter-spacing:1px;"><span leaf="">{{lang}}</span></span>
  </section>
  <section style="padding:12px 14px;">
    {{content}}
  </section>
</section>`,

      codeBlockLight: `<section style="margin:0 16px 24px;border-radius:0;overflow:hidden;background:{{token.grayBg}};border:1px solid {{token.dividerColor}};">
  <section style="padding:8px 14px;border-bottom:1px solid {{token.dividerColor}};">
    <span style="font-size:11px;color:{{token.subTextColor}};font-family:Consolas,Monaco,monospace;letter-spacing:1px;"><span leaf="">{{lang}}</span></span>
  </section>
  <section style="padding:12px 14px;">
    {{content}}
  </section>
</section>`,

      inlineCode: `<code style="background:{{token.grayBg}};color:{{token.primaryDark}};padding:1px 6px;border-radius:2px;font-family:'SF Mono',Consolas,Monaco,monospace;font-size:13px;">{{content}}</code>`,

      image: `<section style="text-align:center;margin:0 16px 28px;">
  <span leaf=""><img src="{{src}}" style="max-width:100%;height:auto;display:block;margin:0 auto;" /></span>
</section>`,

      imageWithCaption: `<section style="margin:0 16px 8px;">
  <span leaf=""><img src="{{src}}" style="max-width:100%;height:auto;display:block;margin:0 auto;" /></span>
</section>
<p style="font-size:12px;color:{{token.subTextColor}};text-align:center;margin:0 0 28px;">
  <span leaf="">— {{caption}}</span>
</p>`,

      table: `<section style="margin:0 16px 28px;overflow-x:auto;">
  <table style="width:100%;border-collapse:collapse;font-size:13px;">
    <thead><tr>{{headers}}</tr></thead>
    <tbody>{{rows}}</tbody>
  </table>
</section>`,

      tableHeader: `<th style="background:#fff;color:{{token.titleColor}};font-weight:600;padding:12px 8px;text-align:left;border-bottom:1px solid {{token.dividerColor}};"><span leaf="">{{content}}</span></th>`,

      tableRow: `<tr>{{cells}}</tr>`,

      orderedListItem: `<section style="margin-bottom:14px;"><span style="display:inline-block;color:{{token.primary}};font-size:12px;font-weight:600;margin-right:12px;vertical-align:top;font-family:'Noto Serif SC',Georgia,serif;"><span leaf="">{{index}}</span></span><span style="display:inline-block;font-size:14px;color:{{token.textColor}};line-height:1.9;vertical-align:top;"><span leaf="">{{content}}</span></span></section>`,

      unorderedListItem: `<section style="margin-bottom:14px;">
  <div style="margin:0;">
    <span style="font-size:14px;color:{{token.textColor}};line-height:1.9;">
      <span style="color:{{token.primary}};margin-right:8px;"><span leaf="">·</span></span>
      <span leaf="">{{content}}</span>
    </span>
  </div>
</section>`,

      // 分割线（多种样式，颜色跟随主题）
      dividerSolid: `<section style="padding:0 16px;margin:64px 0;text-align:center;background:#FFFFFF;">
  <section style="display:inline-block;width:60%;border-top:1px solid {{token.dividerColor}};">
    <span leaf=""><br></span>
  </section>
</section>`,
      dividerDashed: `<section style="padding:0 16px;margin:64px 0;text-align:center;background:#FFFFFF;">
  <section style="display:inline-block;width:60%;border-top:1px dashed {{token.dividerColor}};">
    <span leaf=""><br></span>
  </section>
</section>`,
      dividerDouble: `<section style="padding:0 16px;margin:64px 0;text-align:center;background:#FFFFFF;">
  <section style="display:inline-block;width:60%;border-top:1px solid {{token.dividerColor}};border-bottom:1px solid {{token.dividerColor}};height:3px;">
    <span leaf=""><br></span>
  </section>
</section>`,
      dividerDot: `<section style="padding:0 16px;margin:64px 0;text-align:center;background:#FFFFFF;">
  <span style="display:inline-block;width:32%;border-top:1px solid {{token.dividerColor}};vertical-align:middle;"><span leaf=""><br></span></span>
  <span style="display:inline-block;color:{{token.primary}};font-size:12px;margin:0 12px;vertical-align:middle;"><span leaf="">●</span></span>
  <span style="display:inline-block;width:32%;border-top:1px solid {{token.dividerColor}};vertical-align:middle;"><span leaf=""><br></span></span>
</section>`,
      dividerDiamond: `<section style="padding:0 16px;margin:64px 0;text-align:center;background:#FFFFFF;">
  <span style="display:inline-block;width:32%;border-top:1px solid {{token.dividerColor}};vertical-align:middle;"><span leaf=""><br></span></span>
  <span style="display:inline-block;color:{{token.primary}};font-size:12px;margin:0 12px;vertical-align:middle;"><span leaf="">◆</span></span>
  <span style="display:inline-block;width:32%;border-top:1px solid {{token.dividerColor}};vertical-align:middle;"><span leaf=""><br></span></span>
</section>`,
      dividerText: `<section style="padding:0 16px;margin:64px 0;text-align:center;background:#FFFFFF;">
  <span style="display:inline-block;width:22%;border-top:1px solid {{token.dividerColor}};vertical-align:middle;"><span leaf=""><br></span></span>
  <span style="display:inline-block;color:{{token.primary}};font-size:13px;font-weight:600;letter-spacing:2px;margin:0 12px;vertical-align:middle;white-space:nowrap;"><span leaf="">{{text}}</span></span>
  <span style="display:inline-block;width:22%;border-top:1px solid {{token.dividerColor}};vertical-align:middle;"><span leaf=""><br></span></span>
</section>`,

      // 分割线（整条线带主题主色）
      dividerPrimary: `<section style="padding:0 16px;margin:64px 0;text-align:center;background:#FFFFFF;">
  <section style="display:inline-block;width:100%;border-top:2px solid {{token.primary}};">
    <span leaf=""><br></span>
  </section>
</section>`,
      dividerPrimaryBold: `<section style="padding:0 16px;margin:64px 0;text-align:center;background:#FFFFFF;">
  <section style="display:inline-block;width:100%;border-top:4px solid {{token.primary}};">
    <span leaf=""><br></span>
  </section>
</section>`,
      dividerPrimaryGradient: `<section style="padding:0 16px;margin:64px 0;text-align:center;background:#FFFFFF;">
  <span style="display:inline-block;width:60%;height:3px;border-radius:2px;background:linear-gradient(to right,{{token.primary}},rgba(0,0,0,0),{{token.primary}});vertical-align:middle;"><span leaf=""><br></span></span>
</section>`,
      dividerPrimaryDotted: `<section style="padding:0 16px;margin:64px 0;text-align:center;background:#FFFFFF;">
  <span style="display:inline-block;width:32%;border-top:1px dashed {{token.primary}};vertical-align:middle;"><span leaf=""><br></span></span>
  <span style="display:inline-block;color:{{token.primary}};font-size:10px;margin:0 12px;vertical-align:middle;"><span leaf="">●</span></span>
  <span style="display:inline-block;width:32%;border-top:1px dashed {{token.primary}};vertical-align:middle;"><span leaf=""><br></span></span>
</section>`,

      inlineStrong: `<strong style="color:{{token.titleColor}};">{{content}}</strong>`,
      inlineEm: `<em>{{content}}</em>`,
      inlineHighlight: `<mark style="background:{{token.highlightBg}};padding:2px 4px;">{{content}}</mark>`,
      inlineUnderline: `<u style="border-bottom:1.5px solid {{token.underlineColor}};">{{content}}</u>`,
      inlineDelete: `<del style="color:{{token.subTextColor}};">{{content}}</del>`,

      subTitle: `<p style="margin:32px 16px 16px;font-size:17px;font-weight:600;color:{{token.titleColor}};line-height:1.6;font-family:'Noto Serif SC',Georgia,'Times New Roman',serif;">
  <span leaf="">{{content}}</span>
</p>`,

      heading1: `<section style="margin:48px 16px 32px;text-align:center;background:#FFFFFF;">
  <p style="margin:0 0 16px;font-size:11px;color:{{token.subTextColor}};letter-spacing:4px;font-weight:400;">
    <span leaf="">— 壹 —</span>
  </p>
  <p style="margin:0;font-family:'Noto Serif SC',Georgia,'Times New Roman',serif;font-size:22px;font-weight:600;color:{{token.titleColor}};line-height:1.7;letter-spacing:1px;">
    <span leaf="">{{content}}</span>
  </p>
  <p style="margin:16px 0 0;font-size:11px;color:{{token.primary}};letter-spacing:6px;">
    <span leaf="">◆</span>
  </p>
</section>`,

      heading3: `<p style="margin:28px 16px 14px;font-size:15px;font-weight:600;color:{{token.titleColor}};line-height:1.6;">
  <span leaf="">{{content}}</span>
</p>`,

      pillTag: `<span style="display:inline-block;background:{{token.tagBg}};color:{{token.tagTextColor}};font-size:12px;font-weight:500;padding:3px 10px;border-radius:2px;">{{content}}</span>`,

      // 时间线（极简留白风格）
      timeline: `<section style="margin:0 16px 32px;">{{items}}</section>`,
      timelineItem: `<section style="display:flex;margin-bottom:24px;">
  <section style="display:flex;flex-direction:column;align-items:center;margin-right:20px;flex-shrink:0;">
    <section style="width:8px;height:8px;border-radius:50%;background:{{token.primary}};margin-top:6px;">
      <span leaf=""><br></span>
    </section>
    <section style="width:1px;background:{{token.dividerColor}};flex:1;margin-top:6px;min-height:48px;{{#isLast}}display:none;{{/isLast}}">
      <span leaf=""><br></span>
    </section>
  </section>
  <section style="flex:1;padding-bottom:4px;">
    <p style="font-size:12px;color:{{token.secondaryTextColor}};margin:0 0 8px;font-weight:500;letter-spacing:1px;">
      <span leaf="">{{date}}</span>
    </p>
    <p style="font-size:14px;margin:0;color:{{token.textColor}};line-height:1.9;">
      <span leaf="">{{text}}</span>
    </p>
  </section>
</section>`,

      // ===== 以下为 wemd 扩展语法组件（水平滑动图组 / GitHub 提示块 / 任务列表 / 下划线 / 数学公式 / Mermaid） =====

      // 水平滑动图组
      carousel: `<section class="xumd-carousel" style="margin:0 auto 24px;">
  <section style="overflow-x:scroll;-webkit-overflow-scrolling:touch;white-space:nowrap;width:100%;font-size:0;">
    {{slides}}
  </section>
  <p style="text-align:center;font-size:12px;color:{{token.subTextColor}};margin:8px 0 0;">
    <span leaf="">← 左右滑（共 {{count}} 张）→</span>
  </p>
</section>`,

      // 水平滑动图组单张
      carouselItem: `<section style="display:inline-block;width:48%;margin-right:2%;white-space:normal;vertical-align:top;">
  <img src="{{src}}" alt="{{alt}}" style="width:100%;height:auto;display:block;border-radius:12px;" />
  <p style="font-size:12px;color:{{token.subTextColor}};margin:6px 0 0;text-align:center;">
    <span leaf="">{{alt}}</span>
  </p>
</section>`,

      // GitHub 风格提示块（颜色按 type 由渲染逻辑注入 alertColor / alertBg）
      githubAlert: `<section style="margin:0 0 20px;padding:14px 16px;border-radius:10px;border-left:4px solid {{alertColor}};background:{{alertBg}};">
  <p style="margin:0 0 8px;font-size:14px;font-weight:800;color:{{alertColor}};">
    <span leaf="">{{title}}</span>
  </p>
  <div style="font-size:14px;color:{{token.textColor}};line-height:1.7;">{{body}}</div>
</section>`,

      // 任务列表项
      taskItem: `<p style="margin:0 0 10px;display:flex;align-items:flex-start;font-size:14px;color:{{token.textColor}};line-height:1.7;">
  <span style="flex-shrink:0;width:18px;height:18px;margin-right:8px;border-radius:4px;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;{{checkboxStyle}}">{{checkboxMark}}</span>
  <span style="{{textStyle}}"><span leaf="">{{text}}</span></span>
</p>`,

      // 下划线 ++xx++（与主题 underlineColor 一致）
      underline: `<span style="border-bottom:2px solid {{token.underlineColor}};padding-bottom:1px;">{{content}}</span>`,

      // 数学公式（块级 / 行内）— katexOut 由 KaTeX 渲染注入
      mathBlock: `<section style="margin:16px 0;text-align:center;overflow-x:auto;">{{katexOut}}</section>`,
      mathInline: `<span style="display:inline-block;vertical-align:middle;">{{katexOut}}</span>`,

      // Mermaid 图表 — svgOut 由 mermaid 渲染注入
      mermaid: `<section style="margin:16px 0;text-align:center;">{{svgOut}}</section>`

    }
  },

  tokens: {
    primary: '#4A5D52',
    primaryDark: '#3D5046',
    primaryLight: '#6B8073',
    primaryBg: '#EEF3F0',
    underlineColor: '#B5C8BC',
    titleColor: '#2B2B2B',
    textColor: '#525252',
    subTextColor: '#A3A3A3',
    secondaryTextColor: '#737373',
    dividerColor: '#E8E8E8',
    borderColor: '#E8E8E8',
    grayBg: '#FAFAFA',
    lightGrayBg: '#F5F5F5',
    white: '#FFFFFF',
    highlightBg: '#D6E4DC',
    tagBg: '#EEF3F0',
    tagTextColor: '#3D5046',
    warningColor: '#B45309',
    warningBg: '#FFFBEB',
    warningTextColor: '#92400E',
    codeBgDark: '#1E293B',
    codeTextDark: '#E2E8F0',
    codeHeaderDark: '#0F172A',
    inlineCodeBg: '#F5F5F5',
    inlineCodeColor: '#4A5D52'
  }
}
