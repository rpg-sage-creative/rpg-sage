import { processMath } from "@rsc-utils/dice-utils";
import type { TDiceOutput } from "../../../../sage-dice/index.js";
import type { SageCommand } from "../../model/SageCommand.js";

/**
 * Returns the output data for the given math equation.
 * @param _ unused SageCommand
 * @param input unwrapped math (NO BRACES)
 * @returns
 */
export function rollMath(_: SageCommand, input: string): TDiceOutput[] {
	const result = processMath(input) ?? "INVALID!";
	return [{
		hasSecret: false,
		inlineOutput: result,
		input: input,
		output: `${result} ${"\u27f5"} ${input.replace(/\*/g, "\\*")}`
	}];
}