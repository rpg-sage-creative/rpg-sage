import type { KeyValueArg, Optional } from "@rsc-utils/core-utils";
import { parseDiceMacroArgPlaceholder } from "./parseDiceMacroArgPlaceholder.js";
import type { DiceMacroArgs } from "./parseDiceMacroCall.js";
import { DiceMacroArgPlaceholderRegExpG, DiceMacroRemainingArgPlaceholderRegExpG } from "./regexp.js";

/** @todo Determine if these -+ +- ++ replacements are needed since doSimple() can process them */

/** Used to replace "- +" with "-" */
const MinusPlusRegExpG = /-\s*\+/g;

/** Used to replace "+ -" with "-" */
const PlusMinusRegExpG = /\+\s*-/g;

/** Used to replace "+ +" with "+" */
const PlusPlusRegExpG = /\+\s*\+/g;

/**
 * Returns either the arg value from the stack (if not empty) or the default value (defaults to empty string).
 * @todo determine if we need to consider returning undefined if both arg and def values are null/undefined.
 * @param vs captured "vs" value prefixed to the arg placeholder
 * @param arg value from the arg stack
 * @param def default value from the arg placeholder
 * @returns
 */
function nonEmptyStringOrDefaultValue(vs: string, arg: Optional<string>, def: Optional<string>): string {
	const argOrEmptyString = arg ?? "";
	const defOrEmptyString = def ?? "";
	const value = argOrEmptyString !== "" ? argOrEmptyString : defOrEmptyString;
	return vs + value;
}

/**
 * Returns either the arg value from the stack (if not empty) or the default value (defaults to empty string).
 * If the named key is ac/dc/vs and we don't have a vs prefix, then we include the key in the output.
 * @todo determine if we need to consider returning undefined if both arg and def values are null/undefined.
 * @param vs captured "vs" value prefixed to the arg placeholder
 * @param arg key value arg from the arg stack
 * @param def default value from the arg placeholder
 * @returns
 */
function namedArgValueOrDefaultValue(vs: string, arg: Optional<KeyValueArg>, def: Optional<string>): string {
	// we did get an arg, so us the value and test the key
	if (arg) {
		const value = nonEmptyStringOrDefaultValue(vs, arg.value, def);

		// if we didn't have a prefixed vs but the key fits, include it
		if (value && !vs && (arg.keyLower === "ac" || arg.keyLower === "dc" || arg.keyLower === "vs")) {
			return arg.key + value;
		}

		// other vs values will be included in the return from nonEmptyStringOrDefaultValue
		return value;
	}

	// we didn't get an arg from the stack but we have a default value, so we just default to vs and default value
	if (def) {
		return vs + def;
	}

	// no arg and no default so we return empty string to avoid a hanging AC/DC/VS in the dice output
	return "";
}

/** Looks through the args stack to find the KeyValueArg for the given key. */
function findNamedArg(argsStack: DiceMacroArgs[], keyLower: Lowercase<string>): KeyValueArg | undefined {
	for (const args of argsStack) {
		for (const arg of args.named) {
			if (arg.keyLower === keyLower) {
				return arg;
			}
		}
	}
	return undefined;
}

/** Finds all unique unused named args and joins them together with a space before each. */
function appendUnusedNamedArgs(argsStack: DiceMacroArgs[], usedArgKeys: Set<Lowercase<string>>): string {
	// we only need unique keys
	const allArgKeys = new Set<Lowercase<string>>();
	for (const args of argsStack) {
		for (const arg of args.named) {
			allArgKeys.add(arg.keyLower);
		}
	}

	// no keys, nothing more to do
	if (!allArgKeys.size) return "";

	const rawArgs: string[] = [];

	// we only want args that haven't been used
	for (const keyLower of allArgKeys) {
		if (!usedArgKeys.has(keyLower)) {
			const arg = findNamedArg(argsStack, keyLower);
			if (arg) {
				// raw is valid; but include a space before it
				rawArgs.push(" " + arg.raw);
			}
		}
	}

	return rawArgs.join("");
}

/**
 * Finds the arg placeholders and replaces them with the values from the given argStack.
 * Optionally appends all unused named args at the end of the macro call.
 * @param diceMacroCall an unwrapped dice macro call
 * @param argsStack
 * @param includeUnusedArgs
 * @returns a wrapped dice macro call
 */
export function applyDiceMacroArgs(diceMacroCall: string, argsStack?: DiceMacroArgs[], includeUnusedArgs?: boolean): string {
	if (!argsStack?.length) return `[${diceMacroCall}]`;

	const namedArgsUsed = new Set<Lowercase<string>>();

	// we only ever access the indexed args from the first call
	const indexedArgs = argsStack[0]?.indexed ?? [];

	// we track the highest index used so that we can slice indexedArgs for remaining args
	let maxIndex = -1;

	// indexed / named args
	diceMacroCall = diceMacroCall.replace(DiceMacroArgPlaceholderRegExpG, match => {
		const { vs, key, keyIndex, isIndexed, defaultValue } = parseDiceMacroArgPlaceholder(match)!;
		// const ret = (out: string) => {
		// 	console.debug({match,vs,key,keyIndex,isIndexed,defaultValue,out});
		// 	return out;
		// };
		if (isIndexed) {
			maxIndex = Math.max(maxIndex, keyIndex);
			// return ret(nonEmptyStringOrDefaultValue(vs, indexedArgs[keyIndex], defaultValue) ?? `${vs}{${keyIndex}}`);
			return nonEmptyStringOrDefaultValue(vs, indexedArgs[keyIndex], defaultValue) ?? `${vs}{${keyIndex}}`;
		}else {
			const keyLower = key.toLowerCase();
			const namedArg = findNamedArg(argsStack, keyLower);
			namedArgsUsed.add(keyLower);
			// return ret(namedArgValueOrDefaultValue(vs, namedArg, defaultValue) ?? `${vs}{${key}}`);
			return namedArgValueOrDefaultValue(vs, namedArg, defaultValue) ?? `${vs}{${key}}`;
		}
	});

	// remaining args
	const remainingArgs = indexedArgs.slice(maxIndex + 1);
	const remainingString = remainingArgs.length ? " " + remainingArgs.join(" ") : ""; // whitespace before each arg
	diceMacroCall = diceMacroCall.replace(DiceMacroRemainingArgPlaceholderRegExpG, remainingString);

	// fix adjacent plus/minus
	diceMacroCall = diceMacroCall.replace(MinusPlusRegExpG, "-");
	diceMacroCall = diceMacroCall.replace(PlusMinusRegExpG, "-");
	diceMacroCall = diceMacroCall.replace(PlusPlusRegExpG, "+");

	if (includeUnusedArgs) {
		diceMacroCall += appendUnusedNamedArgs(argsStack, namedArgsUsed);
	}

	// wrap the return value
	return `[${diceMacroCall}]`;
}
