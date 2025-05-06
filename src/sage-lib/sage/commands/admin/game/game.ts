import { registerListeners } from "../../../../discord/handlers/registerListeners.js";
import { discordPromptYesNo } from "../../../../discord/prompts.js";
import type { SageMessage } from "../../../model/SageMessage.js";

async function gameToggleDicePing(sageMessage: SageMessage): Promise<void> {
	const gameChannel = sageMessage.gameChannel;
	if (gameChannel && (sageMessage.isGameMaster || sageMessage.isPlayer)) {
		const message = sageMessage.isGameMaster
			? "Do you want to get a ping when dice are rolled in this game?"
			: "Do you want to get a ping when you roll dice in this game?";
		const yesNo = await discordPromptYesNo(sageMessage, message);
		if (yesNo === true || yesNo === false) {
			const updated = await sageMessage.game?.updateDicePing(sageMessage.actorId, yesNo);
			sageMessage.reactSuccessOrFailure(updated === true);
		}
	}
	return Promise.resolve();
}

export function registerGame(): void {
	registerListeners({ commands:["game|toggle|dice|ping"], message:gameToggleDicePing });
}
