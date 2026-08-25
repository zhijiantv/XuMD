/**
 * 主题：红白色系
 * 风格：经典编辑风，红白干净 + 克制点睛
 * 适用：深度分析、观点、力量感话题
 */

import type { Theme } from '../types'

export const redWhite: Theme = {
  structure: {
    id: 'red-white',
    name: '红白色系',
    description: '经典编辑风，红白干净+克制点睛，编号章节+引言卡+签名区，适合深度分析、观点',
    scenarios: ['深度分析', '观点', '力量感话题'],

    layout: {
      fontSize: '15px',
      lineHeight: '1.8',
      letterSpacing: '0.5px',
      maxWidth: '677px',
      contentPadding: '0 10px',
      paragraphMargin: '20px',
      chapterMargin: '56px',
      fontFamily: "-apple-system,BlinkMacSystemFont,'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif"
    },

    components: {
      // 全局容器
      container: `<section style="max-width:{{layout.maxWidth}};margin:0 auto;background:#ffffff;font-family:{{layout.fontFamily}};color:{{token.textColor}};line-height:{{layout.lineHeight}};letter-spacing:{{layout.letterSpacing}};overflow-x:hidden;padding:20px 0;">{{content}}</section>`,

      // 封面（引言卡风格 - 白底红色光晕阴影）
      coverWithImage: `<section style="margin:10px 10px 32px;background:#ffffff;border-radius:12px;box-shadow:0 4px 24px -4px rgba(220,38,38,0.15);overflow:hidden;">
  <section style="padding:28px 24px 22px;">
    <section style="display:flex;align-items:center;gap:8px;margin-bottom:20px;">
      <span style="width:6px;height:6px;background:{{token.primary}};border-radius:50%;"><span leaf=""><br></span></span>
      <span style="font-size:11px;font-weight:700;letter-spacing:2px;color:{{token.primary}};"><span leaf="">{{top}}</span></span>
      <section style="flex:1;height:1px;overflow:hidden;background:linear-gradient(to right,{{token.primaryBg}},transparent);"><span leaf=""><br></span></section>
      <span style="font-size:10px;color:{{token.subTextColor}};font-weight:600;"><span leaf="">{{topRight}}</span></span>
    </section>
    <section style="display:flex;align-items:center;gap:20px;">
      <section style="flex:1;min-width:0;">
        <p style="font-size:42px;color:{{token.primary}};font-weight:900;margin:0;line-height:0.6;">
          <span leaf="">"</span>
        </p>
        <p style="font-size:16px;font-weight:800;color:{{token.titleColor}};margin:12px 0 8px;line-height:1.75;padding-left:4px;">
          <span style="background:{{token.primary}};color:#FFFFFF;padding:2px 8px;border-radius:4px;"><span leaf="">{{highlight}}</span></span>
          <span leaf="">{{title}}</span>
        </p>
        <p style="font-size:13px;color:{{token.secondaryTextColor}};margin:8px 0 0;line-height:1.8;">
          <span leaf="">{{subtitle}}</span>
        </p>
      </section>
      <section style="flex-shrink:0;width:100px;height:100px;border-radius:10px;overflow:hidden;border:1px solid {{token.borderColor}};box-shadow:0 4px 12px rgba(220,38,38,0.1);">
        <img src="{{image}}" style="width:100%;height:100%;object-fit:cover;" />
      </section>
    </section>
    <section style="margin-top:20px;padding-top:16px;border-top:1px dashed {{token.borderColor}};">
      {{tagsHtml}}
    </section>
  </section>
  <section style="background:linear-gradient(135deg,{{token.primary}},{{token.primaryDark}});padding:12px 24px;">
    <p style="font-size:12px;color:rgba(255,255,255,0.9);margin:0;font-weight:600;letter-spacing:0.5px;">
      <span leaf="">{{bottomText}}</span>
    </p>
  </section>
</section>`,

      coverNoImage: `<section style="margin:10px 10px 32px;background:#ffffff;border-radius:12px;box-shadow:0 4px 24px -4px rgba(220,38,38,0.15);overflow:hidden;">
  <section style="padding:28px 24px 22px;">
    <section style="display:flex;align-items:center;gap:8px;margin-bottom:20px;">
      <span style="width:6px;height:6px;background:{{token.primary}};border-radius:50%;"><span leaf=""><br></span></span>
      <span style="font-size:11px;font-weight:700;letter-spacing:2px;color:{{token.primary}};"><span leaf="">{{top}}</span></span>
      <section style="flex:1;height:1px;overflow:hidden;background:linear-gradient(to right,{{token.primaryBg}},transparent);"><span leaf=""><br></span></section>
      <span style="font-size:10px;color:{{token.subTextColor}};font-weight:600;"><span leaf="">{{topRight}}</span></span>
    </section>
    <p style="font-size:42px;color:{{token.primary}};font-weight:900;margin:0;line-height:0.6;">
      <span leaf="">"</span>
    </p>
    <p style="font-size:16px;font-weight:800;color:{{token.titleColor}};margin:12px 0 8px;line-height:1.75;padding-left:4px;">
      <span style="background:{{token.primary}};color:#FFFFFF;padding:2px 8px;border-radius:4px;"><span leaf="">{{highlight}}</span></span>
      <span leaf="">{{title}}</span>
    </p>
    <p style="font-size:13px;color:{{token.secondaryTextColor}};margin:12px 0 0;line-height:1.8;">
      <span leaf="">{{subtitle}}</span>
    </p>
    <section style="margin-top:20px;padding-top:16px;border-top:1px dashed {{token.borderColor}};">
      {{tagsHtml}}
    </section>
  </section>
  <section style="background:linear-gradient(135deg,{{token.primary}},{{token.primaryDark}});padding:12px 24px;">
    <p style="font-size:12px;color:rgba(255,255,255,0.9);margin:0;font-weight:600;letter-spacing:0.5px;">
      <span leaf="">{{bottomText}}</span>
    </p>
  </section>
</section>`,

      // 目录（三列卡片）
      toc: `<section style="padding:0 10px 32px;">
  <p style="font-size:14px;color:{{token.subTextColor}};margin:0 0 14px;letter-spacing:1px;">
    <span leaf="">📌 本文看点</span>
  </p>
  <section style="display:flex;justify-content:space-between;">
    {{items}}
  </section>
</section>`,

      tocItem: `<section style="flex:1;background:{{token.primaryBg}};border-radius:10px;padding:16px 12px;margin-right:8px;text-align:center;border:1px solid {{token.primaryLight}};">
  <p style="display:inline-block;background:{{token.primary}};color:#FFFFFF;font-size:12px;font-weight:800;padding:2px 10px;border-radius:4px;margin:0 0 8px;"><span leaf="">{{index}}</span></p>
  <p style="font-size:13px;font-weight:700;color:{{token.titleColor}};margin:0;"><span leaf="">{{title}}</span></p>
</section>`,

      tocItemActive: `<section style="flex:1;background:{{token.primary}};border-radius:10px;padding:16px 12px;margin-right:8px;text-align:center;background:#FFFFFF;">
  <p style="display:inline-block;background:#fff;color:{{token.primary}};font-size:12px;font-weight:800;padding:2px 10px;border-radius:4px;margin:0 0 8px;"><span leaf="">{{index}}</span></p>
  <p style="font-size:13px;font-weight:700;color:#fff;margin:0;"><span leaf="">{{title}}</span></p>
</section>`,

      // 章节标题
      chapterTitle: `<section style="margin-top:56px;margin-bottom:32px;padding:0 10px;">
  <section style="height:1px;background:linear-gradient(to right,transparent,{{token.primaryLight}},{{token.primary}},{{token.primaryLight}},transparent);margin:0 0 28px;">
    <span leaf=""><br></span>
  </section>
  <p style="font-size:18px;font-weight:900;color:{{token.titleColor}};margin:0 0 8px;line-height:1.5;">
    <span style="color:{{token.primary}};font-weight:900;margin-right:8px;"><span leaf="">{{index}}</span></span>
    <span leaf="">{{title}}</span>
  </p>
  {{content}}
</section>`,

      // 正文段落
      paragraph: `<p style="padding:0 10px;margin-bottom:{{layout.paragraphMargin}};font-size:{{layout.fontSize}};line-height:1.8;text-align:justify;">
  <span leaf="">{{content}}</span>
</p>`,

      // 引用/金句
      quote: `<section style="margin:0 10px 24px;background:{{token.grayBg}};border-left:4px solid {{token.dividerColor}};padding:14px 18px;border-radius:0 8px 8px 0;">
  <p style="font-size:14px;color:{{token.textColor}};margin:0;line-height:1.8;">
    {{content}}
  </p>
</section>`,

      quoteHighlight: `<section style="margin:0 10px 32px;background:#ffffff;border-radius:12px;box-shadow:0 4px 24px -4px rgba(220,38,38,0.15);padding:24px;text-align:center;background:#FFFFFF;">
  <p style="font-size:16px;font-weight:800;color:{{token.titleColor}};margin:0;line-height:1.75;">
    <span style="background:{{token.primary}};color:#FFFFFF;padding:2px 8px;border-radius:4px;"><span leaf="">{{content}}</span></span>
  </p>
</section>`,

      // 提示卡
      tipCard: `<section style="margin:0 10px 24px;background:{{token.primaryBg}};border-radius:0 8px 8px 0;border-left:4px solid {{token.primary}};padding:14px 18px;">
  <p style="margin:0 0 6px;">
    <span style="display:inline-block;background:{{token.primary}};color:#FFFFFF;font-size:11px;font-weight:700;padding:2px 10px;border-radius:4px;letter-spacing:1px;"><span leaf="">{{title}}</span></span>
  </p>
  <p style="font-size:14px;color:{{token.textColor}};margin:0;line-height:1.8;">
    {{content}}
  </p>
</section>`,

      warningCard: `<section style="margin:0 10px 20px;background:{{token.warningBg}};border:1px solid {{token.highlightBg}};border-radius:8px;padding:12px 16px;">
  <p style="margin:0 0 6px;">
    <span style="display:inline-block;background:{{token.warningColor}};color:#FFFFFF;font-size:11px;font-weight:700;padding:2px 10px;border-radius:4px;letter-spacing:1px;"><span leaf="">{{title}}</span></span>
  </p>
  <p style="font-size:13px;color:{{token.warningTextColor}};margin:0;font-weight:700;">
    <span leaf="">{{content}}</span>
  </p>
</section>`,

      infoCard: `<section style="margin:0 10px 20px;background:{{token.primaryBg}};border-radius:8px;padding:12px 16px;border-left:4px solid {{token.primary}};">
  <p style="margin:0 0 6px;">
    <span style="display:inline-block;background:{{token.primary}};color:#FFFFFF;font-size:11px;font-weight:700;padding:2px 10px;border-radius:4px;letter-spacing:1px;"><span leaf="">{{title}}</span></span>
  </p>
  <p style="font-size:14px;color:{{token.textColor}};margin:0;line-height:1.8;">
    {{content}}
  </p>
</section>`,

      // FAQ 问答卡
      faqCard: `<section style="margin:0 10px 24px;background:{{token.grayBg}};border-radius:10px;padding:16px 20px;">
  <p style="font-size:15px;font-weight:800;color:{{token.titleColor}};margin:0 0 10px;">
    <span style="display:inline-block;background:{{token.primary}};color:#fff;font-size:12px;font-weight:700;padding:2px 10px;border-radius:4px;margin-right:8px;"><span leaf="">Q</span></span>
    <span leaf="">{{question}}</span>
  </p>
  <section style="padding-left:28px;font-size:14px;color:{{token.textColor}};line-height:1.8;">
    {{content}}
  </section>
</section>`,

      // 步骤列表
      stepItem: `<section style="margin:0 10px 24px;">
  <section style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
    <span style="display:inline-block;background:{{token.primary}};color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:4px;"><span leaf="">{{index}}</span></span>
    <h4 style="font-size:15px;font-weight:800;color:{{token.titleColor}};margin:0;">
      <span leaf="">{{title}}</span>
    </h4>
  </section>
  <p style="font-size:14px;margin:0 0 16px;color:{{token.textColor}};line-height:1.8;text-align:justify;">
    {{content}}
  </p>
</section>`,

      // 签名块
      signature: `<section style="margin:40px 10px 24px;padding:24px;border-top:1px solid {{token.dividerColor}};text-align:center;background:#FFFFFF;">
  <p style="font-size:14px;color:{{token.textColor}};margin:0 0 12px;line-height:1.8;">
    <span leaf="">{{content}}</span>
  </p>
  <p style="font-size:11px;color:{{token.subTextColor}};letter-spacing:2px;margin:0;">
    <span leaf="">— END —</span>
  </p>
</section>`,

      // 代码块
      codeBlockDark: `<section style="margin:0 10px 20px;border-radius:8px;overflow:hidden;background:{{token.codeBgDark}};box-shadow:0 4px 16px -8px rgba(15,23,42,0.4);">
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

      codeBlockLight: `<section style="margin:0 10px 20px;border-radius:8px;overflow:hidden;background:{{token.lightGrayBg}};border:1px solid {{token.borderColor}};border-left:3px solid {{token.primary}};">
  <section style="padding:7px 14px;border-bottom:1px solid {{token.borderColor}};">
    <span style="font-size:12px;color:{{token.subTextColor}};font-family:Consolas,Monaco,monospace;letter-spacing:1px;"><span leaf="">{{lang}}</span></span>
  </section>
  <section style="padding:11px 14px;">
    {{content}}
  </section>
</section>`,

      inlineCode: `<code style="background:{{token.inlineCodeBg}};color:{{token.inlineCodeColor}};padding:1px 6px;border-radius:4px;font-family:'SF Mono',Consolas,Monaco,monospace;font-size:13px;">{{content}}</code>`,

      // 图片
      image: `<section style="text-align:center;margin:0 10px 24px;border-radius:8px;overflow:hidden;">
  <span leaf=""><img src="{{src}}" style="max-width:100%;height:auto;display:block;margin:0 auto;" /></span>
</section>`,

      imageWithCaption: `<section style="margin:0 10px 8px;border-radius:8px;overflow:hidden;border:1px solid {{token.borderColor}};">
  <span leaf=""><img src="{{src}}" style="max-width:100%;height:auto;display:block;" /></span>
</section>
<p style="font-size:12px;color:{{token.subTextColor}};text-align:center;margin:0 0 24px;">
  <span leaf="">— {{caption}}</span>
</p>`,

      // 表格
      table: `<section style="margin:0 10px 24px;overflow-x:auto;">
  <table style="width:100%;border-collapse:collapse;font-size:13px;border:1px solid {{token.borderColor}};">
    <thead><tr>{{headers}}</tr></thead>
    <tbody>{{rows}}</tbody>
  </table>
</section>`,

      tableHeader: `<th style="background:{{token.primary}};color:#fff;font-weight:700;padding:8px 12px;text-align:left;border-right:1px solid {{token.primaryLight}};"><span leaf="">{{content}}</span></th>`,

      tableRow: `<tr>{{cells}}</tr>`,

      // 有序列表
      orderedListItem: `<section style="margin-bottom:12px;"><span style="display:inline-block;width:22px;height:22px;line-height:22px;text-align:center;font-size:11px;font-weight:700;color:#fff;background:{{token.primary}};border-radius:4px;margin-right:10px;vertical-align:top;"><span leaf="">{{index}}</span></span><span style="display:inline-block;font-size:14px;color:{{token.textColor}};line-height:1.8;vertical-align:top;"><span leaf="">{{content}}</span></span></section>`,

      // 无序列表
      unorderedListItem: `<section style="margin-bottom:14px;">
  <div style="margin:0 0 6px;">
    <span style="display:inline-block;font-size:14px;color:{{token.textColor}};line-height:1.8;">
      <span style="display:inline-block;width:6px;height:6px;background:{{token.primary}};border-radius:50%;margin-right:8px;vertical-align:middle;"><span leaf=""><br></span></span>
      <span leaf="">{{content}}</span>
    </span>
  </div>
</section>`,

      // 分割线（多种样式，颜色跟随主题）
      dividerSolid: `<section style="padding:0 10px;margin:40px 0;">
  <section style="border-top:1px solid {{token.dividerColor}};">
    <span leaf=""><br></span>
  </section>
</section>`,
      dividerDashed: `<section style="padding:0 10px;margin:40px 0;">
  <section style="border-top:1px dashed {{token.dividerColor}};">
    <span leaf=""><br></span>
  </section>
</section>`,
      dividerDouble: `<section style="padding:0 10px;margin:40px 0;">
  <section style="border-top:1px solid {{token.dividerColor}};border-bottom:1px solid {{token.dividerColor}};height:3px;">
    <span leaf=""><br></span>
  </section>
</section>`,
      dividerDot: `<section style="padding:0 10px;margin:40px 0;text-align:center;">
  <span style="display:inline-block;width:32%;border-top:1px solid {{token.dividerColor}};vertical-align:middle;"><span leaf=""><br></span></span>
  <span style="display:inline-block;color:{{token.primary}};font-size:12px;margin:0 12px;vertical-align:middle;"><span leaf="">●</span></span>
  <span style="display:inline-block;width:32%;border-top:1px solid {{token.dividerColor}};vertical-align:middle;"><span leaf=""><br></span></span>
</section>`,
      dividerDiamond: `<section style="padding:0 10px;margin:40px 0;text-align:center;">
  <span style="display:inline-block;width:32%;border-top:1px solid {{token.dividerColor}};vertical-align:middle;"><span leaf=""><br></span></span>
  <span style="display:inline-block;color:{{token.primary}};font-size:12px;margin:0 12px;vertical-align:middle;"><span leaf="">◆</span></span>
  <span style="display:inline-block;width:32%;border-top:1px solid {{token.dividerColor}};vertical-align:middle;"><span leaf=""><br></span></span>
</section>`,
      dividerText: `<section style="padding:0 10px;margin:40px 0;text-align:center;">
  <span style="display:inline-block;width:22%;border-top:1px solid {{token.dividerColor}};vertical-align:middle;"><span leaf=""><br></span></span>
  <span style="display:inline-block;color:{{token.primary}};font-size:13px;font-weight:600;letter-spacing:2px;margin:0 12px;vertical-align:middle;white-space:nowrap;"><span leaf="">{{text}}</span></span>
  <span style="display:inline-block;width:22%;border-top:1px solid {{token.dividerColor}};vertical-align:middle;"><span leaf=""><br></span></span>
</section>`,

      // 分割线（整条线带主题主色）
      dividerPrimary: `<section style="padding:0 10px;margin:40px 0;">
  <section style="border-top:2px solid {{token.primary}};">
    <span leaf=""><br></span>
  </section>
</section>`,
      dividerPrimaryBold: `<section style="padding:0 10px;margin:40px 0;">
  <section style="border-top:4px solid {{token.primary}};">
    <span leaf=""><br></span>
  </section>
</section>`,
      dividerPrimaryGradient: `<section style="padding:0 10px;margin:40px 0;text-align:center;">
  <span style="display:inline-block;width:60%;height:3px;border-radius:2px;background:linear-gradient(to right,{{token.primary}},rgba(0,0,0,0),{{token.primary}});vertical-align:middle;"><span leaf=""><br></span></span>
</section>`,
      dividerPrimaryDotted: `<section style="padding:0 10px;margin:40px 0;text-align:center;">
  <span style="display:inline-block;width:32%;border-top:1px dashed {{token.primary}};vertical-align:middle;"><span leaf=""><br></span></span>
  <span style="display:inline-block;color:{{token.primary}};font-size:10px;margin:0 12px;vertical-align:middle;"><span leaf="">●</span></span>
  <span style="display:inline-block;width:32%;border-top:1px dashed {{token.primary}};vertical-align:middle;"><span leaf=""><br></span></span>
</section>`,

      // 行内样式
      inlineStrong: `<strong style="color:{{token.primary}};">{{content}}</strong>`,
      inlineEm: `<em>{{content}}</em>`,
      inlineHighlight: `<mark style="background:{{token.highlightBg}};padding:0 4px;color:{{token.titleColor}};">{{content}}</mark>`,
      inlineUnderline: `<u style="border-bottom:2px solid {{token.underlineColor}};">{{content}}</u>`,
      inlineDelete: `<del style="color:{{token.secondaryTextColor}};">{{content}}</del>`,

      // 子标题
      subTitle: `<p style="margin:28px 10px 14px;font-size:16px;font-weight:800;color:{{token.titleColor}};line-height:1.5;border-left:4px solid {{token.primary}};padding-left:12px;">
  <span leaf="">{{content}}</span>
</p>`,

      heading1: `<section style="margin:36px 10px 24px;">
  <section style="height:2px;background:linear-gradient(to right,{{token.primary}},{{token.primaryLight}},transparent);margin-bottom:16px;">
    <span leaf=""><br></span>
  </section>
  <p style="margin:0;font-size:22px;font-weight:900;color:{{token.titleColor}};line-height:1.35;letter-spacing:0.5px;">
    <span style="background:{{token.primary}};color:#FFFFFF;padding:2px 10px;border-radius:4px;font-size:14px;font-weight:800;margin-right:10px;vertical-align:middle;"><span leaf="">H1</span></span>
    <span leaf="">{{content}}</span>
  </p>
  <section style="height:1px;background:linear-gradient(to right,transparent,{{token.primaryLight}},{{token.primary}},{{token.primaryLight}},transparent);margin-top:14px;">
    <span leaf=""><br></span>
  </section>
</section>`,

      heading3: `<p style="margin:24px 10px 12px;font-size:15px;font-weight:800;color:{{token.primary}};line-height:1.5;">
  <span leaf="">{{content}}</span>
</p>`,

      pillTag: `<span style="display:inline-block;background:{{token.primaryBg}};color:{{token.primaryDark}};font-size:12px;font-weight:700;padding:2px 8px;border-radius:4px;">{{content}}</span>`,

      // 时间线
      timeline: `<section style="margin:0 10px 24px;">{{items}}</section>`,
      timelineItem: `<section style="display:flex;margin-bottom:20px;">
  <section style="display:flex;flex-direction:column;align-items:center;margin-right:14px;flex-shrink:0;">
    <section style="width:12px;height:12px;border-radius:50%;background:{{token.primary}};margin-top:4px;">
      <span leaf=""><br></span>
    </section>
    <section style="width:1px;background:{{token.dividerColor}};flex:1;margin-top:4px;min-height:40px;{{#isLast}}display:none;{{/isLast}}">
      <span leaf=""><br></span>
    </section>
  </section>
  <section style="flex:1;padding-bottom:8px;">
    <p style="font-size:12px;font-weight:700;color:{{token.primary}};margin:0 0 6px;">
      <span leaf="">{{date}}</span>
    </p>
    <p style="font-size:14px;margin:0;color:{{token.textColor}};line-height:1.7;">
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
    primary: '#DC2626',
    primaryDark: '#991B1B',
    primaryLight: '#FCA5A5',
    primaryBg: '#FEF2F2',
    underlineColor: '#FECACA',
    titleColor: '#1C1917',
    textColor: '#374151',
    subTextColor: '#9CA3AF',
    secondaryTextColor: '#6B7280',
    dividerColor: '#E5E7EB',
    borderColor: '#FEE2E2',
    grayBg: '#F9FAFB',
    lightGrayBg: '#F3F4F6',
    white: '#FFFFFF',
    highlightBg: '#FEE2E2',
    tagBg: '#FEF2F2',
    tagTextColor: '#DC2626',
    warningColor: '#F59E0B',
    warningBg: '#FFFBEB',
    warningTextColor: '#92400E',
    codeBgDark: '#1E293B',
    codeTextDark: '#E2E8F0',
    codeHeaderDark: '#0F172A',
    inlineCodeBg: '#F3F4F6',
    inlineCodeColor: '#DC2626'
  }
}
