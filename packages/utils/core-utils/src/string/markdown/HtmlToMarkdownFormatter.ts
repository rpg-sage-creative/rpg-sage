import { HORIZONTAL_TAB } from "../consts.js";
import { htmlToMarkdown } from "./htmlToMarkdown.js";

/** @internal */
export class HtmlToMarkdownFormatter {
	public constructor(public text: string) { }

	public formatBlockQuote(): this {
		this.text = htmlToMarkdown(this.text, "blockquote", innerHtml => innerHtml.split("\n").map(s => "> " + s).join("\n"));
		return this;
	}

	public formatBold(): this {
		this.text = htmlToMarkdown(this.text, "b|strong", "**");
		return this;
	}

	public formatCode(): this {
		this.text = htmlToMarkdown(this.text, "code", "`");
		return this;
	}

	public formatHeaders(): this {
		this.text = htmlToMarkdown(this.text, "h1", innerHtml => `\n# ` + innerHtml);
		this.text = htmlToMarkdown(this.text, "h2", innerHtml => `\n## ` + innerHtml);
		this.text = htmlToMarkdown(this.text, "h3", innerHtml => `\n### ` + innerHtml);
		this.text = htmlToMarkdown(this.text, "h\\d", "\n__**");
		return this;
	}

	public formatHorizontalTab(): this {
		if (this.text) {
			// ensures blockquotes aren't broken
			this.text = this.text.replace(/\t([^>]|$)/g, HORIZONTAL_TAB + "$1");
		}
		return this;
	}

	public formatItalics(): this {
		this.text = htmlToMarkdown(this.text, "i|em", "*");
		return this;
	}

	public formatLinks(): this {
		this.text = htmlToMarkdown(this.text, "a", (text, attributes) => {
			if (!attributes?.has("href")) {
				return text;
			}
			const titleText = attributes.has("title") ? ` "${attributes.get("title")}"` : ``;
			return `[${text}](${attributes.get("href")}${titleText})`;
		});
		return this;
	}

	public formatNewLine(): this {
		if (this.text) {
			this.text = this.text.replace(/<br\/?>/gi, "\n");
		}
		return this;
	}

	public formatOrderedList(): this {
		this.text = htmlToMarkdown(this.text, "ol", (list, attributes) => {
			const start = isNaN(+attributes.get("start")!) ? 1 : +attributes.get("start")!;
			let index = 0;
			return htmlToMarkdown(list, "li", value => `\n **${start + index++}.** ${value}`);
		});
		return this;
	}

	public formatParagraph(): this {
		/** @todo format <p> tags */
		return this;
	}

	public formatStrikethrough(): this {
		this.text = htmlToMarkdown(this.text, "s|strike", "~~");
		return this;
	}

	public formatTable(): this {
		const stripRegex = /<[^>]+>/gi;
		this.text = htmlToMarkdown(this.text, "table", tableHtml => {
			const table = [] as string[][];
			htmlToMarkdown(tableHtml, "tr", rowHtml => {
				const row = [] as string[];
				htmlToMarkdown(rowHtml, "th|td", cellHtml => {
					row.push(cellHtml.replace(stripRegex, ""));
					return "";
				});
				table.push(row);
				return "";
			});
			return table.map((row, rowIndex) => {
				const underline = rowIndex ? "" : "__";
				const cells = row.join(" | ");
				return `> ${underline}${cells}${underline}`;
			}).join("\n");
		});
		return this;
	}

	public formatUnderline(): this {
		this.text = htmlToMarkdown(this.text, "u", "__");
		return this;
	}

	public formatUnorderedList(): this {
		this.text = htmlToMarkdown(this.text, "ul", parentList => {
			const childHandled = htmlToMarkdown(parentList, "ul", nestedList => htmlToMarkdown(nestedList, "li", value => `\n - ${value}`));
			return htmlToMarkdown(childHandled, "li", value => `\n- ${value}`);
		});
		return this;
	}

	public toString(): string {
		return this.text;
	}
}
