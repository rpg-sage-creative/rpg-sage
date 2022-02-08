import { HORIZONTAL_TAB, BULLET } from "./consts";

type TAttributes = { [key:string]: string; };

function parseAttributes(attributesString: string): TAttributes {
	if (!attributesString) {
		return {};
	}
	const matches = attributesString.match(/\w+="[^"]+"/gi);
	if (!matches) {
		return {};
	}
	const attributes: TAttributes = { };
	matches.forEach(pair => {
		const match = pair.match(/(\w+)="([^"]+)"/i);
		if (match) {
			attributes[match[1]] = match[2];
		}
	});
	return attributes;
}

type THtmlToMarkdownHandler = (innerHtml: string, attributes: TAttributes, nodeName: string, outerHtml: string) => string;
function htmlToMarkdown(text: string, elementName: string, handler: THtmlToMarkdownHandler): string {
	if (!text) {
		return text;
	}
	const regex = new RegExp(`<(${elementName})( [^>]+)?>((?:.|\\n)*?)<\\/(?:${elementName})>`, "gi");
	return text.replace(regex, (outer, nodeName, attributes, inner) => handler(inner, parseAttributes(attributes), nodeName, outer));
}

function nodeToMarkdown(text: string, nodeName: string, openMarkdown: string): string {
	if (!text) {
		return text;
	}
	const closeMarkdown = Array.from(openMarkdown).reverse().join("");
	if (openMarkdown !== closeMarkdown) {
		return text
			.replace(new RegExp(`<(?:${nodeName})(?: [^>]+)?>`, "gi"), openMarkdown)
			.replace(new RegExp(`<\\/(?:${nodeName})>`, "gi"), closeMarkdown);
	}
	return text.replace(new RegExp(`<(?:${nodeName})(?: [^>]+)?>|<\\/(?:${nodeName})>`, "gi"), openMarkdown);
}

function stripHtml(text: string): string {
	return text.replace(/<[^>]+>/gi, "");
}

class Formatter {
	public constructor(public text: string) { }

	public formatBlockQuote(): Formatter {
		this.text = htmlToMarkdown(this.text, "BLOCKQUOTE", innerHtml => innerHtml.split("\n").map(s => "> " + s).join("\n"));
		return this;
	}
	public formatBold(): Formatter {
		this.text = nodeToMarkdown(this.text, "b|strong", "**");
		return this;
	}
	public formatCode(): Formatter {
		this.text = nodeToMarkdown(this.text, "code", "`");
		return this;
	}
	public formatHeaders(): Formatter {
		this.text = nodeToMarkdown(this.text, "h\\d", "\n__**");
		return this;
	}
	public formatHorizontalTab(): Formatter {
		if (this.text) {
			// ensures blockquotes aren't broken
			this.text = this.text.replace(/\t([^>]|$)/g, HORIZONTAL_TAB + "$1");
		}
		return this;
	}
	public formatItalics(): Formatter {
		this.text = nodeToMarkdown(this.text, "i", "*");
		return this;
	}
	public formatLinks(): Formatter {
		this.text = htmlToMarkdown(this.text, "A", (text, attributes) => {
			if (!attributes || !attributes.href) {
				return text;
			}
			const titleText = attributes.title ? ` "${attributes.title}"` : ``;
			return `[${text}](${attributes.href}${titleText})`;
		});
		return this;
	}
	public formatNewLine(): Formatter {
		this.text = nodeToMarkdown(this.text, "BR\/?", "\n");
		return this;
	}
	public formatOrderedList(): Formatter {
		this.text = htmlToMarkdown(this.text, "OL", (list, attributes) => {
			const start = isNaN(+attributes.start) ? 1 : +attributes.start;
			let index = 0;
			return htmlToMarkdown(list, "LI", value => `\n> **${start + index++}.** ${value}`);
		});
		return this;
	}
	public formatParagraph(): Formatter {
		//TODO: format <P> tags
		return this;
	}
	public formatStrikethrough(): Formatter {
		this.text = nodeToMarkdown(this.text, "s|strike", "~~");
		return this;
	}
	public formatTable(): Formatter {
		this.text = htmlToMarkdown(this.text, "TABLE", tableHtml => {
			const table = (tableHtml.match(createHtmlRegex("TR", "gi")) ?? []).map(trHtml =>
				(trHtml.match(createHtmlRegex("TH|TD", "gi")) ?? []).map(s => (s.match(createHtmlRegex("TH|TD", "i")) ?? [])[1] ?? "")
			);
			return table.map((row, rowIndex) => `> ${rowIndex ? "" : "__"}${row.map(stripHtml).join(" | ")}${rowIndex ? "" : "__"}`).join("\n");
		});
		return this;
		function createHtmlRegex(elementName: string, flags: "gi" | "i"): RegExp {
			return new RegExp(`<(?:${elementName})(?: [^>]+)?>((?:.|\\n)*?)<\\/(?:${elementName})>`, flags);
		}
	}
	public formatUnderline(): Formatter {
		this.text = nodeToMarkdown(this.text, "U", "__");
		return this;
	}
	public formatUnorderedList(): Formatter {
		this.text = htmlToMarkdown(this.text, "UL", list =>
			htmlToMarkdown(list, "LI", value => `\n> **${BULLET}** ${value}`)
		);
		return this;
	}
	public toString(): string {
		return this.text;
	}
}

export function format(text: string): string {
	if (!text) {
		return text;
	}
	return new Formatter(text)
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
