/**
 * Markdown 转 微信公众号 HTML 转换器
 *
 * 功能：
 * 1. 支持4种主题风格
 * 2. 使用 section 替代 ul/ol/li 解决微信空行问题
 * 3. 链接转文末脚注
 * 4. CSS 内联
 * 5. 代码语法高亮
 */

const { marked } = require('marked');
const juice = require('juice');
const hljs = require('highlight.js');

// ============ 主题样式定义 ============

const themes = {
    // 简约专业 - 蓝色主色调
    professional: {
        primary: '#1a73e8',
        secondary: '#5f6368',
        background: '#ffffff',
        codeBackground: '#1e1e1e',
        styles: `
      .wx-container { max-width: 100%; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; line-height: 1.8; color: #333; background: #ffffff; }
      .wx-container h1 { font-size: 24px; font-weight: bold; color: #1a73e8; margin: 30px 0 20px; padding-bottom: 10px; border-bottom: 2px solid #1a73e8; }
      .wx-container h2 { font-size: 20px; font-weight: bold; color: #1a73e8; margin: 25px 0 15px; padding-left: 10px; border-left: 4px solid #1a73e8; }
      .wx-container h3 { font-size: 18px; font-weight: bold; color: #333; margin: 20px 0 10px; }
      .wx-container h4 { font-size: 16px; font-weight: bold; color: #5f6368; margin: 15px 0 10px; }
      .wx-container p { margin: 15px 0; text-align: justify; }
      .wx-container strong { color: #1a73e8; font-weight: bold; }
      .wx-container em { font-style: italic; color: #5f6368; }
      .wx-container code { background: #f5f5f5; color: #d63384; padding: 2px 6px; border-radius: 4px; font-family: "SF Mono", Monaco, Consolas, monospace; font-size: 14px; }
      .wx-container pre { background: #1e1e1e; color: #d4d4d4; padding: 15px; border-radius: 8px; overflow-x: auto; margin: 15px 0; }
      .wx-container pre code { background: transparent; color: #d4d4d4; padding: 0; }
      .wx-container blockquote { border-left: 4px solid #1a73e8; background: #f8f9fa; padding: 15px 20px; margin: 15px 0; color: #5f6368; }
      .wx-container .list-item { display: block; margin: 8px 0; padding-left: 20px; }
      .wx-container .list-bullet { color: #1a73e8; font-weight: bold; margin-right: 8px; }
      .wx-container a, .wx-container .footnote-ref { color: #1a73e8; text-decoration: none; }
      .wx-container img { max-width: 100%; border-radius: 8px; margin: 15px 0; }
      .wx-container hr { border: none; border-top: 1px solid #e0e0e0; margin: 30px 0; }
      .wx-container table { width: 100%; border-collapse: collapse; margin: 15px 0; }
      .wx-container th { background: #1a73e8; color: white; padding: 12px; text-align: left; }
      .wx-container td { border: 1px solid #e0e0e0; padding: 10px; }
      .wx-container tr:nth-child(even) { background: #f8f9fa; }
      .wx-container .footnotes { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 14px; color: #5f6368; }
    `
    },

    // 优雅文艺 - 墨绿主色调
    elegant: {
        primary: '#2d5a27',
        secondary: '#666666',
        background: '#fefefe',
        codeBackground: '#2d2d2d',
        styles: `
      .wx-container { max-width: 100%; padding: 25px; font-family: "Noto Serif SC", "Source Han Serif SC", Georgia, serif; line-height: 2; color: #333; background: #fefefe; }
      .wx-container h1 { font-size: 26px; font-weight: bold; color: #2d5a27; margin: 35px 0 25px; text-align: center; }
      .wx-container h2 { font-size: 22px; font-weight: bold; color: #2d5a27; margin: 30px 0 20px; }
      .wx-container h3 { font-size: 18px; font-weight: bold; color: #2d5a27; margin: 25px 0 15px; }
      .wx-container h4 { font-size: 16px; font-weight: bold; color: #666; margin: 20px 0 10px; }
      .wx-container p { margin: 20px 0; text-align: justify; text-indent: 2em; }
      .wx-container strong { color: #2d5a27; font-weight: bold; }
      .wx-container em { font-style: italic; color: #666; }
      .wx-container code { background: #f0f4f0; color: #2d5a27; padding: 2px 6px; border-radius: 3px; font-family: "SF Mono", Monaco, monospace; font-size: 14px; }
      .wx-container pre { background: #2d2d2d; color: #f8f8f2; padding: 20px; border-radius: 6px; overflow-x: auto; margin: 20px 0; }
      .wx-container pre code { background: transparent; color: #f8f8f2; padding: 0; text-indent: 0; }
      .wx-container blockquote { border-left: 3px solid #2d5a27; background: #f5f7f5; padding: 20px 25px; margin: 20px 0; color: #666; font-style: italic; }
      .wx-container .list-item { display: block; margin: 12px 0; padding-left: 25px; text-indent: 0; }
      .wx-container .list-bullet { color: #2d5a27; margin-right: 10px; }
      .wx-container a, .wx-container .footnote-ref { color: #2d5a27; text-decoration: underline; }
      .wx-container img { max-width: 100%; border-radius: 6px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
      .wx-container hr { border: none; height: 1px; background: linear-gradient(to right, transparent, #2d5a27, transparent); margin: 40px 0; }
      .wx-container table { width: 100%; border-collapse: collapse; margin: 20px 0; }
      .wx-container th { background: #2d5a27; color: white; padding: 14px; text-align: left; }
      .wx-container td { border: 1px solid #ddd; padding: 12px; }
      .wx-container tr:nth-child(even) { background: #f5f7f5; }
      .wx-container .footnotes { margin-top: 50px; padding-top: 25px; border-top: 1px solid #2d5a27; font-size: 14px; color: #666; }
    `
    },

    // 活力橙 - 橙色主色调
    vibrant: {
        primary: '#ff6b35',
        secondary: '#555555',
        background: '#ffffff',
        codeBackground: '#2b2b2b',
        styles: `
      .wx-container { max-width: 100%; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif; line-height: 1.8; color: #333; background: #ffffff; }
      .wx-container h1 { font-size: 26px; font-weight: bold; color: #ff6b35; margin: 30px 0 20px; text-align: center; background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
      .wx-container h2 { font-size: 22px; font-weight: bold; color: #ff6b35; margin: 25px 0 15px; padding: 10px 15px; background: linear-gradient(90deg, rgba(255,107,53,0.1) 0%, transparent 100%); border-radius: 0 20px 20px 0; }
      .wx-container h3 { font-size: 18px; font-weight: bold; color: #ff6b35; margin: 20px 0 10px; }
      .wx-container h4 { font-size: 16px; font-weight: bold; color: #555; margin: 15px 0 10px; }
      .wx-container p { margin: 15px 0; text-align: justify; }
      .wx-container strong { color: #ff6b35; font-weight: bold; }
      .wx-container em { font-style: italic; color: #555; }
      .wx-container code { background: #fff5f0; color: #ff6b35; padding: 2px 8px; border-radius: 4px; font-family: "SF Mono", Monaco, monospace; font-size: 14px; }
      .wx-container pre { background: #2b2b2b; color: #f8f8f2; padding: 15px; border-radius: 10px; overflow-x: auto; margin: 15px 0; border-left: 4px solid #ff6b35; }
      .wx-container pre code { background: transparent; color: #f8f8f2; padding: 0; }
      .wx-container blockquote { border-left: 4px solid #ff6b35; background: linear-gradient(90deg, #fff5f0 0%, #ffffff 100%); padding: 15px 20px; margin: 15px 0; color: #555; border-radius: 0 10px 10px 0; }
      .wx-container .list-item { display: block; margin: 10px 0; padding-left: 25px; }
      .wx-container .list-bullet { color: #ff6b35; font-weight: bold; margin-right: 10px; }
      .wx-container a, .wx-container .footnote-ref { color: #ff6b35; font-weight: bold; text-decoration: none; }
      .wx-container img { max-width: 100%; border-radius: 10px; margin: 15px 0; box-shadow: 0 4px 15px rgba(255,107,53,0.2); }
      .wx-container hr { border: none; height: 3px; background: linear-gradient(90deg, #ff6b35, #f7931e, #ff6b35); margin: 30px 0; border-radius: 2px; }
      .wx-container table { width: 100%; border-collapse: collapse; margin: 15px 0; border-radius: 10px; overflow: hidden; }
      .wx-container th { background: linear-gradient(135deg, #ff6b35, #f7931e); color: white; padding: 12px; text-align: left; }
      .wx-container td { border: 1px solid #ffe0d0; padding: 10px; }
      .wx-container tr:nth-child(even) { background: #fff5f0; }
      .wx-container .footnotes { margin-top: 40px; padding-top: 20px; border-top: 2px solid #ff6b35; font-size: 14px; color: #555; }
    `
    },

    // 暗黑极客 - 深色背景
    dark: {
        primary: '#61dafb',
        secondary: '#aaaaaa',
        background: '#1a1a2e',
        codeBackground: '#0d0d1a',
        styles: `
      .wx-container { max-width: 100%; padding: 25px; font-family: "JetBrains Mono", "SF Mono", Monaco, Consolas, monospace; line-height: 1.8; color: #e0e0e0; background: #1a1a2e; }
      .wx-container h1 { font-size: 24px; font-weight: bold; color: #61dafb; margin: 30px 0 20px; padding-bottom: 10px; border-bottom: 2px solid #61dafb; }
      .wx-container h2 { font-size: 20px; font-weight: bold; color: #61dafb; margin: 25px 0 15px; padding-left: 12px; border-left: 4px solid #61dafb; }
      .wx-container h3 { font-size: 18px; font-weight: bold; color: #bb86fc; margin: 20px 0 10px; }
      .wx-container h4 { font-size: 16px; font-weight: bold; color: #aaa; margin: 15px 0 10px; }
      .wx-container p { margin: 15px 0; text-align: justify; color: #e0e0e0; }
      .wx-container strong { color: #61dafb; font-weight: bold; }
      .wx-container em { font-style: italic; color: #bb86fc; }
      .wx-container code { background: #2d2d4a; color: #61dafb; padding: 3px 8px; border-radius: 4px; font-size: 14px; }
      .wx-container pre { background: #0d0d1a; color: #d4d4d4; padding: 20px; border-radius: 8px; overflow-x: auto; margin: 20px 0; border: 1px solid #333; }
      .wx-container pre code { background: transparent; color: #d4d4d4; padding: 0; }
      .wx-container blockquote { border-left: 4px solid #61dafb; background: #252545; padding: 15px 20px; margin: 15px 0; color: #aaa; }
      .wx-container .list-item { display: block; margin: 10px 0; padding-left: 25px; color: #e0e0e0; }
      .wx-container .list-bullet { color: #61dafb; font-weight: bold; margin-right: 10px; }
      .wx-container a, .wx-container .footnote-ref { color: #61dafb; text-decoration: none; }
      .wx-container img { max-width: 100%; border-radius: 8px; margin: 15px 0; border: 1px solid #333; }
      .wx-container hr { border: none; height: 1px; background: linear-gradient(90deg, transparent, #61dafb, transparent); margin: 30px 0; }
      .wx-container table { width: 100%; border-collapse: collapse; margin: 15px 0; }
      .wx-container th { background: #2d2d4a; color: #61dafb; padding: 12px; text-align: left; border: 1px solid #444; }
      .wx-container td { border: 1px solid #444; padding: 10px; color: #e0e0e0; }
      .wx-container tr:nth-child(even) { background: #252545; }
      .wx-container .footnotes { margin-top: 40px; padding-top: 20px; border-top: 1px solid #444; font-size: 14px; color: #aaa; }
    `
    }
};

// ============ 转换器类 ============

class WechatConverter {
    constructor(themeName = 'professional') {
        this.theme = themes[themeName] || themes.professional;
        this.links = [];
        this.linkIndex = 0;
        this.setupRenderer();
    }

    setupRenderer() {
        const self = this;
        const renderer = new marked.Renderer();

        // 标题
        renderer.heading = function (text, level) {
            return `<h${level}>${text}</h${level}>`;
        };

        // 段落
        renderer.paragraph = function (text) {
            return `<p>${text}</p>`;
        };

        // 加粗
        renderer.strong = function (text) {
            return `<strong>${text}</strong>`;
        };

        // 斜体
        renderer.em = function (text) {
            return `<em>${text}</em>`;
        };

        // 行内代码
        renderer.codespan = function (code) {
            return `<code>${code}</code>`;
        };

        // 代码块 - 使用 highlight.js
        renderer.code = function (code, language) {
            let highlighted;
            if (language && hljs.getLanguage(language)) {
                highlighted = hljs.highlight(code, { language }).value;
            } else {
                highlighted = hljs.highlightAuto(code).value;
            }
            return `<pre><code class="hljs">${highlighted}</code></pre>`;
        };

        // 引用块
        renderer.blockquote = function (quote) {
            return `<blockquote>${quote}</blockquote>`;
        };

        // 列表 - 使用 section 替代 ul/ol
        renderer.list = function (body, ordered) {
            return body; // 直接返回列表项，不包装 ul/ol
        };

        // 列表项 - 使用 section 替代 li
        renderer.listitem = function (text, task, checked) {
            // 这里需要特殊处理，marked 会先调用 listitem 再调用 list
            return `<!--LISTITEM-->${text}<!--/LISTITEM-->`;
        };

        // 链接 - 转为脚注
        renderer.link = function (href, title, text) {
            self.linkIndex++;
            self.links.push({ index: self.linkIndex, text, href });
            return `${text}<sup class="footnote-ref">[${self.linkIndex}]</sup>`;
        };

        // 图片
        renderer.image = function (href, title, text) {
            const alt = text || title || '';
            return `<img src="${href}" alt="${alt}" />`;
        };

        // 分割线
        renderer.hr = function () {
            return '<hr />';
        };

        // 表格
        renderer.table = function (header, body) {
            return `<table><thead>${header}</thead><tbody>${body}</tbody></table>`;
        };

        renderer.tablerow = function (content) {
            return `<tr>${content}</tr>`;
        };

        renderer.tablecell = function (content, flags) {
            const tag = flags.header ? 'th' : 'td';
            const align = flags.align ? ` style="text-align: ${flags.align}"` : '';
            return `<${tag}${align}>${content}</${tag}>`;
        };

        marked.setOptions({
            renderer,
            gfm: true,
            breaks: false
        });
    }

    // 处理列表项，使用 section 替代
    processListItems(html, theme) {
        const primary = theme.primary;
        let orderedIndex = 0;

        // 检测是否为有序列表（通过上下文判断）
        // 简化处理：统一使用圆点
        return html.replace(/<!--LISTITEM-->([\s\S]*?)<!--\/LISTITEM-->/g, (match, content) => {
            orderedIndex++;
            // 这里简化为无序列表样式
            return `<section class="list-item"><span class="list-bullet">•</span>${content.trim()}</section>`;
        });
    }

    // 生成脚注区域
    generateFootnotes() {
        if (this.links.length === 0) return '';

        let footnotes = '<section class="footnotes"><p><strong>📚 参考链接</strong></p>';
        for (const link of this.links) {
            footnotes += `<p>[${link.index}] ${link.text}: ${link.href}</p>`;
        }
        footnotes += '</section>';
        return footnotes;
    }

    // 主转换函数
    convert(markdown) {
        // 重置链接收集器
        this.links = [];
        this.linkIndex = 0;

        // 1. 使用 marked 转换
        let html = marked.parse(markdown);

        // 2. 处理列表项
        html = this.processListItems(html, this.theme);

        // 3. 添加容器和脚注
        const footnotes = this.generateFootnotes();
        html = `<section class="wx-container">${html}${footnotes}</section>`;

        // 4. 添加样式并内联
        const styledHtml = `<style>${this.theme.styles}</style>${html}`;
        html = juice(styledHtml);

        // 5. 移除换行符，防止微信渲染空行
        html = html.replace(/>\s*\n\s*</g, '><');

        return html;
    }
}

// ============ 导出 ============

module.exports = {
    WechatConverter,
    themes,
    convert: function (markdown, themeName = 'professional') {
        const converter = new WechatConverter(themeName);
        return converter.convert(markdown);
    }
};
