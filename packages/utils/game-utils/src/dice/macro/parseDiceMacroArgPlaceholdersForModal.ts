import type { Optional } from "@rsc-utils/core-utils";
import { parseDiceMacroArgPlaceholder, type DiceMacroArgPlaceholder } from "./parseDiceMacroArgPlaceholder.js";
import { DiceMacroArgPlaceholderRegExpG } from "./regexp.js";

/** Accepts a string value that is a match result of getMacroArgRegex() and parses it into a MacroArgPair. */
export function parseDiceMacroArgPlaceholdersForModal(value: Optional<string>): DiceMacroArgPlaceholder[] {
	if (!value) return [];
	const matches = value.match(DiceMacroArgPlaceholderRegExpG) ?? [];
	return matches.map(parseDiceMacroArgPlaceholder) as DiceMacroArgPlaceholder[];
}