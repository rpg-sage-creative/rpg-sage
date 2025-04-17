import { HtmlToMarkdownFormatter } from "./HtmlToMarkdownFormatter.js";

/*
 * https://support.discord.com/hc/en-us/articles/210298617-Markdown-Text-101-Chat-Formatting-Bold-Italic-Underline-
 */

/** Converts HTML text to Markdown text. */
export function toMarkdown(html: string): string {
	if (!html) {
		return html;
	}
	return new HtmlToMarkdownFormatter(html)
		.formatNewLine()
		.formatTable()

		.formatBold()
		.formatCode()
		.formatHeaders()
		.formatHorizontalTab()
		.formatItalics()
		.formatLinks()
		.formatOrderedList()
		.formatParagraph()
		.formatStrikethrough()
		.formatUnderline()
		.formatUnorderedList()

		.formatBlockQuote()

		.toString();
}
