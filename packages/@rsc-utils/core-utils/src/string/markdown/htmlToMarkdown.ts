import { parseKeyValueArgs } from "../../args/parseKeyValueArgs.js";
import { getSimpleHtmlElementRegex, type SimpleHtmlRegExpExecGroup } from "../html/getSimpleHtmlElementRegex.js";

type HtmlToMarkdownHandler = (innerHtml: string, attributes: Map<string, string>, nodeName: Lowercase<string>, outerHtml: string) => string;

const RegExpMap: Record<string, RegExp> = { };

/** @internal Handles nested html tags */
export function htmlToMarkdown(text: string, element: string, openMarkdown: string): string;
export function htmlToMarkdown(text: string, element: string, handler: HtmlToMarkdownHandler): string;
export function htmlToMarkdown(text: string, element: string, handlerOrOpenMarkdown: string | HtmlToMarkdownHandler): string {
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
	const regexp = RegExpMap[element] ??= getSimpleHtmlElementRegex({ element, gFlag:"g", iFlag:"i" });

	// search/replace all
	return text.replace(regexp, (...values: unknown[]) => {
		const groups = values[values.length - 1] as SimpleHtmlRegExpExecGroup;

		if (groups.comment) return "";

		// create attribute map
		const attributeMap = new Map<string, string>();
		const attributes = groups.fullTagAttributes ?? groups.selfCloseAttributes;
		if (attributes) {
			parseKeyValueArgs(attributes).forEach(arg => {
				attributeMap.set(arg.key, arg.value ?? "");
			});
		}

		const elementName = groups.fullTagName ?? groups.selfCloseName;
		const elementNameLower = elementName?.toLowerCase();

		if (!elementNameLower) return "";

		// handle output
		return handler(groups.inner ?? "", attributeMap, elementNameLower, values[0] as string);
	});
}