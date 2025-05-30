import { debug, isWrapped, tokenize, warn, type Optional } from "@rsc-utils/core-utils";
import { createKeyValueArgRegex, createQuotedRegex, createWhitespaceRegex, dequote, parseKeyValueArg, type KeyValueArg } from "@rsc-utils/string-utils";
import XRegExp from "xregexp";
import type { DiceMacroBase } from "../../model/Macro.js";
import { getMacroArgRegex, getMacroRemainingArgRegex, parseMacroArgMatch } from "../admin/macro/getMacroArgRegex.js";

/** used in a .reduce to return the macro with the longest name */
function reduceToLongestMacroName(longestMacro?: DiceMacroBase, currentMacro?: DiceMacroBase): DiceMacroBase | undefined {
	if (!currentMacro) return longestMacro;
	if (!longestMacro) return currentMacro;
	return longestMacro.name.length < currentMacro.name.length
		? currentMacro
		: longestMacro;
}

/** Used to find all macros that start with the given macro name and then return the macro with the longest name. */
function findLongestMacroName(macros: DiceMacroBase[], cleanMacroName: string): DiceMacroBase | undefined {
	const matchingMacros = macros.filter(macro => cleanMacroName.match(new RegExp(`^${XRegExp.escape(macro.name)}\\b`, "i")));
	return matchingMacros.reduce(reduceToLongestMacroName, undefined);
}

type TPrefix = {
	count: number;
	keepRolls?: string;
	/** "kh" | "kl" */
	keep?: string;
	keepCount?: string;
	/** "-" | "+"; */
	fortune?: string;
};
function parsePrefix(prefix: string): TPrefix {
	const [_, count, keepDirty, fortune] = prefix.match(/^(?:(?:(\d*)#)|(?:(\d*k[hl]\d*)#)|([\+\-]))/i) ?? ["1"];
	if (keepDirty) {
		const [__, keepRolls, keep, keepCount] = keepDirty.match(/^(\d*)(k[hl])(\d*)$/)!;
		return {
			count: 1,
			keepRolls: keepRolls ? keepRolls : undefined,
			keep,
			keepCount: keepCount ? keepCount : undefined
		};
	}else if (fortune) {
		return { count: 1, fortune };
	}else if (count) {
		return { count: +count };
	}
	return { count:1 };
}

type FindPrefixMacroArgsResults = { prefix:string; macro?:DiceMacroBase; slicedArgs:string; };
function findPrefixMacroArgs(macroTiers: DiceMacroBase[][], input: string): FindPrefixMacroArgsResults {
	const lower = input.toLowerCase();
	const [_, dirtyPrefix, dirtyMacro] = lower.match(/^((?:\d*#)|(?:\d*k[hl]\d*#)|(?:[\+\-]))?(.*?)$/) ?? [];
	const prefix = (dirtyPrefix ?? "").trim();
	const cleanMacro = (dirtyMacro ?? "").trim();

	const isValidMacroName = /^[\w\.-]+\b/.test(cleanMacro);
	if (!isValidMacroName) {
		return { prefix, macro:undefined, slicedArgs:input.slice(prefix.length) };
	}

	// find the longest macro of each tier
	const longestMacros = macroTiers.map(macros => findLongestMacroName(macros, cleanMacro));
	// grab the longest of the longest macros
	const macro = longestMacros.reduce(reduceToLongestMacroName, undefined);
	let sliceIndex = (dirtyPrefix ?? "").length;
	if (macro) {
		sliceIndex = lower.indexOf(macro.name.toLowerCase()) + macro.name.length;
	}
	const slicedArgs = input.slice(sliceIndex);
	return { prefix, macro, slicedArgs };
}

type TArgs = { indexed:string[]; named:KeyValueArg[] };
function parseMacroArgs(argString: string): TArgs {
	const parsers = {
		spaces: createWhitespaceRegex(),
		named: createKeyValueArgRegex(),
		quotes: createQuotedRegex({lengthQuantifier:"*"})
	};
	const tokens = tokenize(argString.trim(), parsers);
	const named = tokens
		.filter(token => token.key === "named")
		.map(token => parseKeyValueArg(token.token)!);
	const indexed = tokens
		.filter(token => !["spaces", "named"].includes(token.key))
		.map(token => dequote(token.token).trim());
	return { indexed, named };
}

type DiceMacroBaseAndArgs = TArgs & { macro?: DiceMacroBase; prefix: TPrefix; };
function parseMacroAndArgs(macroTiers: DiceMacroBase[][], input: string): DiceMacroBaseAndArgs {
	const { prefix, macro, slicedArgs } = findPrefixMacroArgs(macroTiers, input);
	const macroArgs = macro ? parseMacroArgs(slicedArgs) : undefined;
	debug({slicedArgs,macroArgs});
	return {
		indexed: macroArgs?.indexed ?? [],
		macro: macro ?? undefined,
		named: macroArgs?.named ?? [],
		prefix: parsePrefix(prefix)
	};
}

function nonEmptyStringOrDefaultValue(vs: string, arg: Optional<string>, def: Optional<string>): string {
	const argOrEmptyString = arg ?? "";
	const defOrEmptyString = def ?? "";
	const value = argOrEmptyString !== "" ? argOrEmptyString : defOrEmptyString;
	return vs + value;
}

function namedArgValueOrDefaultValue(vs: string, arg: Optional<KeyValueArg>, def: Optional<string>): string {
	if (arg) {
		const value = nonEmptyStringOrDefaultValue(vs, arg.value, def);
		if (arg.keyLower.match(/^(ac|dc|vs)$/) && value && !vs) {
			return arg.key + value;
		}
		return value;
	}
	if (def) {
		return `${vs}${def ?? ""}`;
	}
	return ``;
}

function flattenMacro(macroTiers: DiceMacroBase[][], dice: string, argsStack: TArgs[], stack: string[] = []): string[] {
	// avoid a stack overflow
	if (stack.some((s,i,a)=>a.indexOf(s)!==i)) {
		warn({stack});
		return [];
	}

	// if we have brackets, split on ][ to ensure we grab and parse each block of a multiblock macro
	if (isWrapped(dice, "[]")) {
		// split the dice
		return dice.split("][")
			// remove [ from first and ] from last and [] from an only item
			.map((block, i, a) => a.length === 1 ? block.slice(1, -1) : i == 0 ? block.slice(1) : i === a.length - 1 ? block.slice(0, -1) : block)
			// flatten each block
			.map(block => flattenMacro(macroTiers, block, argsStack, stack.concat(block)))
			// flatten all results into a single array
			.flat();
	}

	const includeUnusedArgs = !!parseMacroAndArgs(macroTiers, dice).macro;

	// apply the args
	dice = applyArgs(dice, argsStack, includeUnusedArgs);

	const { macro, indexed, named } = parseMacroAndArgs(macroTiers, dice);

	// no macro means we have dice we can work with
	if (!macro) {
		return [dice];
	}

	// we have another macro so we need to flatten again
	return flattenMacro(macroTiers, macro.dice, [{ indexed, named }].concat(argsStack), stack.concat(macro.dice));
}

function applyArgs(unwrapped: string, argsStack: TArgs[], includeUnusedArgs: boolean): string {
	const namedArgsUsed = new Set<string>();

	const findNamedArg = (keyLower: string) => argsStack
		.find(({ named }) => named.find(arg => arg.keyLower === keyLower))
		?.named.find(arg => arg.keyLower === keyLower);

	const mapAllUnusedNamedArgs = () => {
		const allNamedArgKeys = new Set(argsStack.map(({ named }) => named.map(arg => arg.keyLower)).flat());
		const unusedKeys = [...allNamedArgKeys].filter(key => !namedArgsUsed.has(key));
		const unusedArgs = unusedKeys.map(findNamedArg) as KeyValueArg[];
		const mappedArgs = unusedArgs.map(arg => `${arg?.key}="${arg?.value}"`).join(" ");
		return includeUnusedArgs ? ` ${mappedArgs}]` : `]`;
	};

	debug;
	let maxIndex = -1;
	return `[${unwrapped}]`

	// indexed / named args
	.replace(getMacroArgRegex(true), match => {
		const { vs, key, keyIndex, isIndexed, defaultValue } = parseMacroArgMatch(match);
		const ret = (out: string) => {
			// debug({match,parsed:{ vs, key, keyIndex, isIndexed, defaultValue },out});
			return out;
		};
		if (isIndexed) {
			maxIndex = Math.max(maxIndex, keyIndex);
			return ret(nonEmptyStringOrDefaultValue(vs, argsStack[0].indexed[keyIndex], defaultValue) ?? `${vs}{${keyIndex}}`);
		}else {
			const keyLower = key.toLowerCase();
			const namedArg = findNamedArg(keyLower);
			namedArgsUsed.add(keyLower);
			return ret(namedArgValueOrDefaultValue(vs, namedArg, defaultValue) ?? `${vs}{${key}}`);
		}
	})

	// remaining args
	.replace(getMacroRemainingArgRegex(true), argsStack[0].indexed.slice(maxIndex + 1).join(" "))

	// fix adjacent plus/minus
	.replace(/-\s*\+/g, "-")
	.replace(/\+\s*-/g, "-")
	.replace(/\+\s*\+/g, "+")

	.replace(/\]$/, mapAllUnusedNamedArgs())
	;
}

type DiceMacroBaseAndOutput = { macro: DiceMacroBase; output: string; };
export function macroToDice(macroTiers: DiceMacroBase[][], input: string): DiceMacroBaseAndOutput | undefined {
	const { prefix, macro, indexed, named } = parseMacroAndArgs(macroTiers, input);
	if (!macro) {
		return undefined;
	}

	const all: string[] = [];

	const flattened = flattenMacro(macroTiers, macro.dice, [{ indexed, named }]);

	flattened.forEach(unwrapped => {
		let dice = `[${unwrapped}]`;
		// debug({dice});
		// dice = applyArgs(dice, { indexed, named });

		if (prefix.keep) {
			dice = dice.replace(/(\d*)([dD]\d+)/, (_, dCount, dSize) =>
				`${prefix.keepRolls ?? dCount}${dSize}${prefix.keep}${prefix.keepCount ?? ""}`
			);
		}else if (prefix.fortune) {
			dice = dice.replace("1d20", `${prefix.fortune}2d20`);
		}

		const output = [dice];
		while (output.length < prefix.count) {
			output.push(dice);
		}

		all.push(...output);
	});

	return {
		macro: macro,
		output: all.join("")
	};
}

/*

{ "name":"first",  "dice":"[1d20 + {atkBonus} {ac} {atkDesc:atk}; 1d{dmgDie:6} + {dmgBonus:0} {dmgDesc:dmg}]" },
{ "name":"second", "dice":"[first atkBonus='{0}'][first atkBonus='{0}-4' atkDesc='agile atk']" },
{ "name":"third",  "dice":"[second {atkBonus} dmgBonus='{b}']" },
{ "name":"fourth", "dice":"[third atkBonus='{a:0}+{a:0}' b='{bonus}', ac='{1}'][1d20 + {0}]" },

*/