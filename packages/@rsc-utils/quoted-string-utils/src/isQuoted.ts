import type { Optional } from "@rsc-utils/type-utils";
import { isQuotedOrMisquoted } from "./isQuotedOrMisquoted.js";

/*
"" simple double quotes
“” fancy double quotes
'' simple single quotes
‘’ fancy single quotes
*/

type QuotedString = `"${string}"` | `“${string}”` | `'${string}'` | `‘${string}’`;

/** Returns true if the value is properly quoted, false otherwise. */
export function isQuoted(value: Optional<string>): value is QuotedString {
	return isQuotedOrMisquoted(value) === "quoted";
}
