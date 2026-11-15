import type { Optional } from "@rsc-utils/type-utils";
import { MisquotedContentRegExp } from "./MisquotedContentRegExp.js";
import { QuotedContentRegExp } from "./QuotedContentRegExp.js";

/**
 * Returns "quoted" for properly quoted values, "misquoted" for mismatched open/close quotes, and false otherwise.
 * Proper pairs are checked first, so they never report as misquoted.
 */
export function isQuotedOrMisquoted(value: Optional<string>): "quoted" | "misquoted" | false {
	if (!value) return false;

	// catches valid quotes
	const quotedMatch = QuotedContentRegExp.exec(value);
	if (quotedMatch?.index === 0 && quotedMatch[0].length === value.length) {
		return "quoted";
	}

	// by checking this second, we ensure we don't have mismatched quotes
	const misquotedMatch = MisquotedContentRegExp.exec(value);
	if (misquotedMatch?.index === 0 && misquotedMatch[0].length === value.length) {
		return "misquoted";
	}

	return false;
}
