import { escapeRegex, tokenize } from "@rsc-utils/core-utils";

const HtmlRegExp = /<[^>]+>/;

/** Removes the first instance of desc from description while ensuring it doesn't break HTML (ex: Removing "b" from "<b>8</b> b") */
export function removeDesc(description: string, desc: string): string {
	const tokens = tokenize(description, { html:HtmlRegExp, desc:new RegExp(escapeRegex(desc)) });
	const firstDesc = tokens.find(token => token.key === "desc");
	return tokens
		.filter(token => token !== firstDesc)
		.map(token => token.token)
		.join("");
}