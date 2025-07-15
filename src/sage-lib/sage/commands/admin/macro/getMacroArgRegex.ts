import { isWholeNumberString } from "@rsc-utils/dice-utils";

let argRegex: RegExp;

/** Creates the regex used to match the arg syntax for macros. */
export function getMacroArgRegex(global: boolean): RegExp {
	argRegex ??= /(?<vs>\b(?:ac|dc|vs)\s*)?\{(?<key>\w+)(:(?!:)(?<defaultValue>[^}]*))?\}/;
	return global ? new RegExp(argRegex, "g") : argRegex;
}

export function testMacroArgRegex(value?: string): boolean {
	return value ? getMacroArgRegex(false).test(value) : false;
}

let remainingArgRegex: RegExp;

/** Creates the regex used to match the "remaining" args syntax for macros. */
export function getMacroRemainingArgRegex(global: boolean): RegExp {
	remainingArgRegex ??= /\{(?:\.{3}|…)\}/;
	return global ? new RegExp(remainingArgRegex, "g") : remainingArgRegex;
}

export function testMacroRemainingArgRegex(value?: string): boolean {
	return value ? getMacroRemainingArgRegex(false).test(value) : false;
}

/** A named arg pair that has a key and optional defaultValue. */
type NamedArgPair = { keyIndex?:never; isIndexed?:never, key:string; defaultValue?:string; vs:string; };

/** An indexed arg pair that has a keyIndex and optional defaultvalue. */
type IndexedArgPair = { keyIndex:number; isIndexed:true, key?:never; defaultValue?:string; vs:string; };

/** An arg pair that conforms to either NamedArgPair or IndexedArgPair. */
export type MacroArgPair = NamedArgPair | IndexedArgPair;

/** Accepts a string value that is a match result of getMacroArgRegex() and parses it into a MacroArgPair. */
export function parseMacroArgMatch(value: string): MacroArgPair {
	const { vs = "", key, defaultValue } = getMacroArgRegex(false).exec(value)?.groups ?? {};
	if (isWholeNumberString(key)) {
		return { vs, keyIndex:+key, isIndexed:true, defaultValue };
	}
	return { vs, key, defaultValue };
}

/** Matches all macro arg pairs in a string (typically a macro definition) and parses them all. */
export function matchAllMacroArgPairs(value?: string): MacroArgPair[] {
	const macroArgs = value?.matchAll(getMacroArgRegex(true)) ?? [];
	const macroArgPairs = [...macroArgs].map(match => parseMacroArgMatch(match[0]));
	return macroArgPairs.filter((pair, index, pairs) => index === pairs.findIndex(p => pair.key === p.key));
}
