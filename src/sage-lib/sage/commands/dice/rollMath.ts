import type { TDiceOutput } from "../../../../sage-dice";
import type { SageInteraction } from "../../model/SageInteraction";
import type { SageMessage } from "../../model/SageMessage";
import { doMath } from "./doMath";

type TInteraction = SageMessage | SageInteraction;

export function rollMath(_: TInteraction, input: string): TDiceOutput[] {
	const result = doMath(input) ?? "INVALID!";
	return [{
		hasSecret: false,
		inlineOutput: result,
		input: input,
		output: `${result} ${"\u27f5"} ${input.replace(/\*/g, "\\*")}`
	}];
}