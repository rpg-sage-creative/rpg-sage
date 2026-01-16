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

/**
 * Parses a dice macro call into prefix, macro, and args: [macro_name 0 ac="10"]
 */
export function parseDiceMacroCall(diceMacroCall: string, macroTiers: DiceMacroBase[][]): DiceMacroParseResults | undefined {
	const unwrappedMacroCall = unwrap(diceMacroCall, "[]");

	// first grab the prefix
	const prefix = parseDiceMacroPrefix(unwrappedMacroCall);

	// next slice the macro and args from the prefix (trim in case we have a space)
	const macroAndArgs = prefix ? unwrappedMacroCall.slice(prefix.prefixLength).trim() : unwrappedMacroCall;

	// then ensure we have a valid macro name
	const macroNameLower = macroAndArgs.split(" ")[0]!.toLowerCase();

	// try finding the macro with the matching name in the lowest tier
	let macro: DiceMacroBase | undefined;
	for (const macroTier of macroTiers) {
		for (const tierMacro of macroTier) {
			if (tierMacro.name.toLowerCase() === macroNameLower) {
				macro = tierMacro;
				break; // breaks for (const tierMacro of macroTier) {
			}
		}
		if (macro) break; // breaks for (const macroTier of macroTiers) {
	}

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
