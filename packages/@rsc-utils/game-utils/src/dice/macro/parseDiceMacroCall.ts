import { ArgsManager, unwrap, type KeyValueArg } from "@rsc-utils/core-utils";
import { parseDiceMacroPrefix, type DiceMacroPrefix } from "./parseDiceMacroPrefix.js";
import type { DiceMacroBase } from "./types.js";

export type DiceMacroArgs = {
	// macro args that are referenced by an index (value args)
	indexed: string[];
	/** macro args that are referenced by name (key/value args) */
	named: KeyValueArg[];
};

export type DiceMacroParseResults = DiceMacroArgs & {
	/** the macro, if found */
	macro: DiceMacroBase;
	/** MacroPrefix from parseMacroPrefix; non-optional as it defaults to { rollCount: 1 } */
	prefix?: DiceMacroPrefix;
};

/** Finds the macro with the longest name that matches the start of the given macroAndArgs. */
function findBestTierMacro(macroTier: DiceMacroBase[], macroAndArgs: Lowercase<string>): DiceMacroBase | undefined {
	let macro: DiceMacroBase | undefined;

	// iterate all macros in the tier
	for (const tierMacro of macroTier) {

		// lowercase for comparison
		const name = tierMacro.name.toLowerCase();

		// see if the macro starts with the macro name
		if (macroAndArgs.startsWith(name)) {

			// now we need the macroAndArgs to be the same length as the macro name or we need a space after the macro name
			if (name.length === macroAndArgs.length || macroAndArgs[name.length] === " ") {

				// now we keep it if we don't have a macro yet or this name is longer
				if (!macro || name.length > macro.name.length) {
					macro = tierMacro;
				}

			}

		}

	}

	return macro;
}

/**
 * Finds the best macro of each tier and returns the one with the longest name.
 * By iterating through tiers and only keeping later matches with longer names we ensure that lower tiers are prioritized in the case of duplicate names.
 */
function findBestMacro(macroTiers: DiceMacroBase[][], macroAndArgs: string): DiceMacroBase | undefined {
	let macro: DiceMacroBase | undefined;

	// lowercase for comparison
	const macroAndArgsLower = macroAndArgs.toLowerCase();

	// iterate all macros in the tier
	for (const macroTier of macroTiers) {

		// match best of this tier
		const bestOfTier = findBestTierMacro(macroTier, macroAndArgsLower);

		// only continue if we have a match
		if (bestOfTier) {

			// now we keep it if we don't have a macro yet or this name is longer
			if (!macro || bestOfTier.name.length > macro.name.length) {
				macro = bestOfTier;
			}

		}

	}

	return macro;
}

/**
 * Parses a dice macro call into prefix, macro, and args: [macro_name 0 ac="10"]
 */
export function parseDiceMacroCall(diceMacroCall: string, macroTiers: DiceMacroBase[][]): DiceMacroParseResults | undefined {
	const unwrappedMacroCall = unwrap(diceMacroCall, "[]").trim();

	// first grab the prefix
	const prefix = parseDiceMacroPrefix(unwrappedMacroCall);

	// next slice the macro and args from the prefix (trim in case we have a space)
	const macroAndArgs = prefix ? unwrappedMacroCall.slice(prefix.prefixLength).trim() : unwrappedMacroCall;

	// go find the best macro
	const macro = findBestMacro(macroTiers, macroAndArgs);

	// ensure we have a macro
	if (!macro) return undefined;

	// now slice the args from the macro
	const slicedArgs = macroAndArgs.slice(macro.name.length);

	// then parse the args
	const args = ArgsManager.from(slicedArgs);
	const indexed = args.nonKeyValueStrings().map(s => s ?? "");
	const named = args.keyValueArgs();

	// return it all
	return { prefix, macro, indexed, named };
}
