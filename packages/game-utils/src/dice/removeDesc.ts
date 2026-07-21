import { escapeRegex, tokenize } from "@rsc-utils/core-utils";

const HtmlRegExp = /<[^>]+>/;
const DiceResultsRegExp = /\[[^\]]+\]\d*d\d+/;

/**
 * Removes the first instance of desc from description.
 * Avoids breaking HTML (ex: Removing "b" from "<b>8</b> b").
 * Avoids breaking dice results (ex: Removing 15 from [15]1d20).
 */
export function removeDesc(description: string, desc: string): string {
	const tokens = tokenize(description, { html:HtmlRegExp, dice:DiceResultsRegExp, desc:new RegExp(escapeRegex(desc)) });
	const firstDesc = tokens.find(token => token.key === "desc");
	return tokens
		.filter(token => token !== firstDesc)
		.map(token => token.token)
		.join("");
}