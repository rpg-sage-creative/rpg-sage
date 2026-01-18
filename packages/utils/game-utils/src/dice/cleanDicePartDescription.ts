import { cleanWhitespace } from "@rsc-utils/core-utils";

/** This strips a trailing comma (,) or semicolon (;) and compresses whitespace. */
export function cleanDicePartDescription(description?: string): string {
	let clean = description?.trim() ?? "";
	if (clean.endsWith(",") || clean.endsWith(";")) {
		clean = clean.slice(0, -1).trim();
	}
	return cleanWhitespace(clean, { horizontalOnly:true });
}
