import { HORIZONTAL_TAB } from "../consts.js";
import { htmlToMarkdown } from "./htmlToMarkdown.js";
import { parseNumeric } from "../../number/parseNumeric.js";
import { toSubscript } from "../../number/toSubscript.js";
import { toSuperscript } from "../../number/toSuperscript.js";

const AsciiEscapeRegExp = /&#(?:x([0-9a-f]+)|(\d+));/gi;
const HorizontalTabRegExp = /\t([^>]|$)/g;
/** @deprecated This needs to be smarter about attributes */
const StripHtmlRegExp = /<[^>]+>/gi;

function handleListItem(level: number, dashOrNumber: "-" | number, content: string) {
	const indent = "".padEnd(level * 2, " ");
	const dot = dashOrNumber === "-" ? "" : ".";
	return `\n${indent}${dashOrNumber}${dot} ${content}`;
}

function handleOrdered(content: string, level: number): string {
	return htmlToMarkdown(content, "ol", (olInnerHtml, atts) => {
		// setup list item indexer
		let indexer = 0;

		// get number start value
		const start = isNaN(+atts.get("start")!) ? 1 : +atts.get("start")!;

		// process children
		return htmlToMarkdown(olInnerHtml, "ul|li", (childInnerHtml, _, childNodeName, childOuterHtml) => {
			switch (childNodeName) {
				case "ol": return handleOrdered(childOuterHtml, level + 1);
				case "ul": return handleUnordered(childOuterHtml, level + 1);
				default: return handleListItem(level, start + indexer++, childInnerHtml);
			}
		});
	});
}

function handleUnordered(content: string, level: number): string {
	return htmlToMarkdown(content, "ul", ulInnerHtml => {
		// process children
		return htmlToMarkdown(ulInnerHtml, "ol|li", (childInnerHtml, _, childNodeName, childOuterHtml) => {
			switch (childNodeName) {
				case "ol": return handleOrdered(childOuterHtml, level + 1);
				case "ul": return handleUnordered(childOuterHtml, level + 1);
				default: return handleListItem(level, "-", childInnerHtml);
			}
		});
	});
}

/** @internal */
export class HtmlToMarkdownFormatter {
	public constructor(public text: string) { }

	public formatAsciiEscape(): this {
		if (this.text) {
			this.text = this.text.replace(AsciiEscapeRegExp, (_, hex, dec) => String.fromCodePoint(parseInt(hex ?? dec, hex ? 16 : 10)));
		}
		return this;
	}

	public formatBlockQuote(): this {
		this.text = htmlToMarkdown(this.text, "blockquote", innerHtml => "\n" + innerHtml.split("\n").map(s => `> ${s}`).join("\n") + "\n");
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
		this.text = htmlToMarkdown(this.text, "h1", innerHtml => `\n# ${innerHtml}`);
		this.text = htmlToMarkdown(this.text, "h2", innerHtml => `\n## ${innerHtml}`);
		this.text = htmlToMarkdown(this.text, "h3", innerHtml => `\n### ${innerHtml}`);
		this.text = htmlToMarkdown(this.text, "h4|h5|h6", "\n__**");
		return this;
	}

	public formatHorizontalTab(): this {
		if (this.text) {
			// ensures blockquotes aren't broken
			this.text = this.text.replace(HorizontalTabRegExp, `${HORIZONTAL_TAB}$1`);
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

	public formatLists(): this {
		this.text = htmlToMarkdown(this.text, "ol|ul", (_innerHtml, _atts, nodeName, outerHtml) => {
			if (nodeName === "ol") {
				return handleOrdered(outerHtml, 0);
			}
			return handleUnordered(outerHtml, 0);
		});
		return this;
	}

	public formatNewLine(): this {
		this.text = htmlToMarkdown(this.text, "br", () => "\n");
		return this;
	}

	public formatParagraph(): this {
		/** @todo format <p> tags */
		return this;
	}

	public formatFooter(): this {
		this.text = htmlToMarkdown(this.text, "footer", innerHtml => `-# ${innerHtml}`);
		return this;
	}

	public formatStrikethrough(): this {
		this.text = htmlToMarkdown(this.text, "del|s|strike", "~~");
		return this;
	}

	public formatSub(): this {
		this.text = htmlToMarkdown(this.text, "sub", inner => {
			const numeric = parseNumeric(inner);
			const sub = toSubscript(numeric);
			return sub === "NaN" ? inner : sub;
		});
		return this;
	}

	public formatSup(): this {
		this.text = htmlToMarkdown(this.text, "sup", inner => {
			const numeric = parseNumeric(inner);
			const sup = toSuperscript(numeric);
			return sup === "NaN" ? inner : sup;
		});
		return this;
	}

	public formatTable(): this {
		this.text = htmlToMarkdown(this.text, "table", tableHtml => {
			const table = [] as string[][];
			htmlToMarkdown(tableHtml, "tr", rowHtml => {
				const row = [] as string[];
				htmlToMarkdown(rowHtml, "th|td", cellHtml => {
					row.push(cellHtml.replace(StripHtmlRegExp, ""));
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

	public toString(): string {
		return this.text;
	}
}
