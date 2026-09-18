import { createFullTagSource, createSelfCloseSource, isSelfCloseElement, type Flags } from "./internal/helpers.js";

type Options = {
	element?: string;
	gFlag?: "g" | "";
	iFlag?: "i" | "";
};

type SimpleHtmlCommentGroup = {
	comment: string;
	selfCloseName?: never;
	selfCloseAttributes?: never;
	fullTagName?: never;
	fullTagAttributes?: never;
	inner?: never;
};

type SimpleHtmlNoCloseGroup = {
	comment?: never;
	selfCloseName: string;
	selfCloseAttributes?: string;
	fullTagName?: never;
	fullTagAttributes?: never;
	inner?: never;
};

type SimpleHtmlCloseableGroup = {
	comment?: never;
	selfCloseName?: never;
	selfCloseAttributes?: never;
	fullTagName: string;
	fullTagAttributes?: string;
	inner?: string;
};

export type SimpleHtmlRegExpExecGroup = SimpleHtmlCommentGroup | SimpleHtmlNoCloseGroup | SimpleHtmlCloseableGroup;;
export type SimpleHtmlRegExpExecArray = RegExpExecArray & {
	groups?: SimpleHtmlCloseableGroup;
};

/** groups: { comment, noCloseTag, noCloseTagAttributes, closeableTag, closeableTagAattributes, inner } */
export function getSimpleHtmlElementRegex({ element, gFlag = "", iFlag = "i" }: Options = { }): RegExp {
	const flags = gFlag + iFlag as Flags;

	const elements = element?.toLowerCase().split("|");
	if (elements?.length) {
		const selfClosePattern = elements.filter(el => el.trim() && isSelfCloseElement(el)).join("|") || undefined;
		const selfCloseSource = createSelfCloseSource({ captureGroups:{ tagName:"selfCloseName", attributes:"selfCloseAttributes", quotes:"selfCloseQuotes" }, pattern:selfClosePattern, flags });

		const fullClosePattern = elements.filter(el => el.trim() && !isSelfCloseElement(el)).join("|") || undefined;
		const fullTagSource = createFullTagSource({ captureGroups:{ tagName:"fullTagName", attributes:"fullTagAttributes", quotes:"fullTagQuotes" }, pattern:fullClosePattern, flags });

		if (selfClosePattern && fullClosePattern) {
			return new RegExp(`(${selfCloseSource}|${fullTagSource})`, flags);

		}else if (selfClosePattern) {
			return new RegExp(selfCloseSource, flags);

		}else if (fullClosePattern) {
			return new RegExp(fullTagSource, flags);
		}
	}

	const commentSource = `(?<comment><!--.*?-->)`;
	const selfCloseSource = createSelfCloseSource({ captureGroups:{ tagName:"selfCloseName", attributes:"selfCloseAttributes", quotes:"selfCloseQuotes" }, flags });
	const fullTagSource = createFullTagSource({ captureGroups:{ tagName:"fullTagName", attributes:"fullTagAttributes", quotes:"fullTagQuotes" }, flags });
	return new RegExp(`(${commentSource}|${selfCloseSource}|${fullTagSource})`, flags);
}
