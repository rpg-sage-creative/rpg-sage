import { flattenDiceMacro } from "./flattenDiceMacro.js";
import { parseDiceMacroCall } from "./parseDiceMacroCall.js";
import type { DiceMacroBase } from "./types.js";

/** Not "g" cause we only use this to replace the first instance. */
const ReplaceDiceMacroPrefixKeepRegExp = /(\d*)(d\d+)/i;

type DiceMacroBaseAndOutput = {
	macro: DiceMacroBase;
	output: string;
};

export function processDiceMacroCall(diceString: string, macroTiers: DiceMacroBase[][]): DiceMacroBaseAndOutput | undefined {
	// confirm that we have a dice macro
	const parsedMacro = parseDiceMacroCall(diceString, macroTiers);
	if (!parsedMacro) {
		return undefined;
	}

	const { prefix, macro, indexed, named } = parsedMacro;

	// flatten the macro down to component dice strings
	const flattened = flattenDiceMacro(macro.dice, macroTiers, [{ indexed, named }]);

	// without a prefix, we are done
	if (!prefix) {
		return { macro, output:flattened.join("") };
	}

	const output: string[] = [];

	// process each of the flattened dice strings against the prefix
	for (let dice of flattened) {

		if (prefix?.keep) {
			const { diceCount, specifier, keepCount = "" } = prefix.keep;
			// replace the first XdY with the prefix's keep high/low data
			dice = dice.replace(ReplaceDiceMacroPrefixKeepRegExp, (_, dCount, dSize) =>
				`${diceCount ?? dCount}${dSize}${specifier}${keepCount}`
			);

		}else if (prefix?.fortuneSign) {
			dice = dice.replace("1d20", `${prefix.fortuneSign}2d20`);
		}

		// ensure we have a default *and* a minimum of 1
		let rollCount = Math.max(1, prefix?.rollCount ?? 1);
		while (rollCount--) {
			output.push(dice);
		}
	}

	return {
		macro: macro,
		output: output.join("")
	};
}
