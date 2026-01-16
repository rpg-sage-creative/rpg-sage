import { isWholeNumberString } from "@rsc-utils/core-utils";
import { DiceMacroArgPlaceholderRegExp } from "./regexp.js";

/** A named arg pair that has a key and optional defaultValue. */
type NamedPlaceholder = { keyIndex?:never; isIndexed?:never; isNamed:true; key:string; defaultValue?:string; vs:string; };

/** An indexed arg pair that has a keyIndex and optional defaultvalue. */
type IndexedPlaceholder = { keyIndex:number; isIndexed:true; isNamed?:never; key?:never; defaultValue?:string; vs:string; };

/** An arg pair that conforms to either NamedArgPair or IndexedArgPair. */
export type DiceMacroArgPlaceholder = NamedPlaceholder | IndexedPlaceholder;

/** Accepts a string value that is a match result of getMacroArgRegex() and parses it into a MacroArgPair. */
export function parseDiceMacroArgPlaceholder(value: string): DiceMacroArgPlaceholder | undefined {
	const match = DiceMacroArgPlaceholderRegExp.exec(value);
	if (!match) return undefined;

	const { vs = "", key, defaultValue } = match.groups;

	if (isWholeNumberString(key)) {
		// indexed
		return { vs, keyIndex:+key, isIndexed:true, defaultValue:defaultValue?.trim() };
	}

	// named
	return { vs, key, isNamed:true, defaultValue:defaultValue?.trim() };
}