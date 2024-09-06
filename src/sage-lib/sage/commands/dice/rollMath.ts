import { doSimple } from "@rsc-utils/dice-utils";
import type { TDiceOutput } from "../../../../sage-dice/index.js";
import type { SageCommand } from "../../model/SageCommand.js";

/** Returns the output data for the given math equation. */
export function rollMath(_: SageCommand, input: string): TDiceOutput[] {
	const result = doSimple(input) ?? "INVALID!";
	return [{
		hasSecret: false,
		inlineOutput: result,
		input: input,
		output: `${result} ${"\u27f5"} ${input.replace(/\*/g, "\\*")}`
	}];
}