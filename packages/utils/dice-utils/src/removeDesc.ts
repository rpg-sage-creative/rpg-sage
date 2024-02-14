import { tokenize } from "@rsc-utils/string-utils";
import * as XRegExp from "xregexp";

/** Removes the first instance of desc from description while ensuring it doesn't break HTML (ex: Removing "b" from "<b>8</b> b") */
export function removeDesc(description: string, desc: string): string {
	const tokens = tokenize(description, { html:/<[^>]+>/, desc:XRegExp(XRegExp.escape(desc)) });
	const firstDesc = tokens.find(token => token.key === "desc");
	return tokens
		.filter(token => token !== firstDesc)
		.map(token => token.token)
		.join("");
}