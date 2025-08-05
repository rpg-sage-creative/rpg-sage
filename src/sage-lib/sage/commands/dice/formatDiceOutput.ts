import { DicePostType } from "@rsc-sage/types";
import { DiceSecretMethodType } from "@rsc-utils/game-utils";
import type { TDiceOutput } from "../../../../sage-dice/index.js";
import type { SageCommand } from "../../model/SageCommand.js";
import type { FormattedDiceOutput } from "./FormattedDiceOutput.js";

/** Formats the output based on secret method and determines if we are posting or embedding. Also includes notification text in case needed. */
export function formatDiceOutput(sageCommand: SageCommand, diceRoll: TDiceOutput, noGmTargetChannel: boolean): FormattedDiceOutput {
	const isEmbed = sageCommand.dicePostType === DicePostType.SingleEmbed || sageCommand.dicePostType === DicePostType.MultipleEmbeds;
	const formatted = sageCommand.sageCache.format(diceRoll.output);
	const output = diceRoll.hasSecret && (sageCommand.diceSecretMethodType === DiceSecretMethodType.Hide || noGmTargetChannel)
		? `||${formatted}||`
		: formatted;
	return {
		hasSecret: diceRoll.hasSecret,
		postContent: isEmbed ? undefined : output,
		embedContent: isEmbed ? output : undefined,
		notificationContent: sageCommand.sageCache.format(`${diceRoll.input} [die]`)
	};
}