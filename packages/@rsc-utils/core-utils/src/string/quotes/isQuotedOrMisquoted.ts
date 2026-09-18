import type { Optional } from "@rsc-utils/type-utils";
import { MisquotedContentRegExp } from "./MisquotedContentRegExp.js";
import { QuotedContentRegExp } from "./QuotedContentRegExp.js";

/** Returns true if the value is properly quoted, false otherwise. */
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
