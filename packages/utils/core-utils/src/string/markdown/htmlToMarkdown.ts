import { regex } from "regex";
import type { Pattern } from "regex/dist/cjs/pattern.js";
import { parseKeyValueArgs } from "../../args/parseKeyValueArgs.js";

type HtmlToMarkdownHandler = (innerHtml: string, attributes: Map<string, string>, nodeName: string, outerHtml: string) => string;

/** @internal Handles nested html tags */
export function htmlToMarkdown(text: string, element: string | Pattern, openMarkdown: string): string;
export function htmlToMarkdown(text: string, element: string | Pattern, handler: HtmlToMarkdownHandler): string;
export function htmlToMarkdown(text: string, element: string | Pattern, handlerOrOpenMarkdown: string | HtmlToMarkdownHandler): string {
	// if we don't have text to convert, just return what we got
	if (!text) {
		return text;
	}

	// create the output handler from the args
	let handler: HtmlToMarkdownHandler;

	if (typeof handlerOrOpenMarkdown === "function") {
		// use the function given
		handler = handlerOrOpenMarkdown;

	}else {
		// create a function using the given markdown
		const openMarkdown = handlerOrOpenMarkdown;
		const closeMarkdown = Array.from(openMarkdown).reverse().join("");
		handler = (inner: string) => openMarkdown + inner + closeMarkdown;
	}

	// create the html element regex
	const regexp = regex("gi")`<(?<nodeName>${element})(?<attributes>\s[^>]+)?>(?<inner>(.|\n)*?)</(?:${element})>`;

	// search/replace all
	return text.replace(regexp, (outer, nodeName, attributes, inner) => {
		// create attribute map
		const attributeMap = parseKeyValueArgs(attributes).reduce((map, arg) => {
			map.set(arg.key, arg.value);
			return map;
		}, new Map<string, string>());

		// handle output
		return handler(inner, attributeMap, nodeName, outer);
	});
}