import XRegExp from "xregexp";
import { parseKeyValueArgs } from "../keyValueArg/parseKeyValueArgs.js";

type HtmlToMarkdownHandler = (innerHtml: string, attributes: Map<string, string>, nodeName: string, outerHtml: string) => string;

/** @internal Handles nested html tags */
export function htmlToMarkdown(text: string, elementName: string, openMarkdown: string): string;
export function htmlToMarkdown(text: string, elementName: string, handler: HtmlToMarkdownHandler): string;
export function htmlToMarkdown(text: string, elementName: string, handlerOrOpenMarkdown: string | HtmlToMarkdownHandler): string {
	if (!text) {
		return text;
	}

	let handler: HtmlToMarkdownHandler;
	if (typeof handlerOrOpenMarkdown === "function") {
		handler = handlerOrOpenMarkdown;
	}else {
		const openMarkdown = handlerOrOpenMarkdown;
		const closeMarkdown = Array.from(openMarkdown).reverse().join("");
		handler = (inner: string) => openMarkdown + inner + closeMarkdown;
	}

	const regex = XRegExp(`<(${elementName})( [^>]+)?>((?:.|\\n)*?)<\\/(?:${elementName})>`, "gi");
	return text.replace(regex, (outer, nodeName, attributes, inner) => {
		const attributeMap = parseKeyValueArgs(attributes).reduce((map, arg) => {
			map.set(arg.key, arg.value);
			return map;
		}, new Map<string, string>());
		return handler(inner, attributeMap, nodeName, outer);
	});
}