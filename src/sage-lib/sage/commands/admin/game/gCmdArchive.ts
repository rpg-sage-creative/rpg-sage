import { discordPromptYesNo } from "../../../../discord/prompts.js";
import type { SageCommand } from "../../../model/SageCommand.js";
import { gSendDetails } from "./gSendDetails.js";

export async function gCmdArchive(sageCommand: SageCommand): Promise<void> {
	sageCommand.replyStack.startThinking();

	if (!sageCommand.game) {
		return sageCommand.replyStack.whisper("There is no Game to archive!");
	}

	if (!await sageCommand.validatePermission("canManageGame")) {
		return sageCommand.replyStack.whisper("Sorry, you aren't allowed to archive this Game.");
	}

	await gSendDetails(sageCommand);

	sageCommand.replyStack.stopThinking();

	const archive = await discordPromptYesNo(sageCommand, `Archive Game?`, true);
	if (archive) {
		const archived = await sageCommand.game.archive();
		if (archived) {
			await sageCommand.replyStack.editLast("Game Archived.");

		}else {
			await sageCommand.replyStack.whisper("Unknown Error; Game NOT Archived!");

		}
	}else {
		await sageCommand.replyStack.editLast("Game ***NOT*** Archived.");

	}

}