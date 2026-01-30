import type { Optional } from "@rsc-utils/core-utils";
import { parseDiceMacroArgPlaceholder, type DiceMacroArgPlaceholder, type DiceMacroIndexedArgPlaceholder, type DiceMacroNamedArgPlaceholder } from "./parseDiceMacroArgPlaceholder.js";
import { DiceMacroArgPlaceholderRegExpG } from "./regexp.js";

/** Returns true only if the arg has a unique key value. */
function isUniqueKey({ keyLower }: DiceMacroNamedArgPlaceholder, index: number, args: DiceMacroArgPlaceholder[]) {
	for (let i = 0; i < args.length; i++) {
		if (keyLower === args[i]?.keyLower) return i === index;
	}
	return false;
}

/** Returns true only if the arg has a unique keyIndex value. */
function isUniqueKeyIndex({ keyIndex }: DiceMacroIndexedArgPlaceholder, index: number, args: DiceMacroArgPlaceholder[]) {
	for (let i = 0; i < args.length; i++) {
		if (keyIndex === args[i]?.keyIndex) return i === index;
	}
	return false;
}

/** Calls the appropriate isUnique tester as needed for the arg given. */
function isUnique(arg: DiceMacroArgPlaceholder, index: number, args: DiceMacroArgPlaceholder[]) {
	return arg.isNamed
		? isUniqueKey(arg, index, args)
		: isUniqueKeyIndex(arg, index, args);
}

/** Accepts a string value that is a match result of getMacroArgRegex() and parses it into a MacroArgPair. */
export function parseDiceMacroArgPlaceholdersForModal(value: Optional<string>): DiceMacroArgPlaceholder[] {
	if (!value) return [];
	const matches = value.match(DiceMacroArgPlaceholderRegExpG) ?? [];
	const mapped = matches.map(parseDiceMacroArgPlaceholder) as DiceMacroArgPlaceholder[];
	return mapped.filter(isUnique);
}