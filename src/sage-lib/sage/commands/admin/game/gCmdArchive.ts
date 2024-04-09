import { discordPromptYesNo } from "../../../../discord/prompts.js";
import type { SageCommand } from "../../../model/SageCommand.js";
import { gSendDetails } from "./gSendDetails.js";

export async function gCmdArchive(sageCommand: SageCommand): Promise<void> {
	if (!sageCommand.game) {
		await sageCommand.whisper("There is no Game to archive!");
		return;
	}

	if (!sageCommand.canAdminGame) {
		await sageCommand.reply("Sorry, you aren't allowed to archive this Game.", true);
		return;
	}

	sageCommand.noDefer();

	await gSendDetails(sageCommand);
	const archive = await discordPromptYesNo(sageCommand, `Archive Game?`);
	if (!archive) {
		return;
	}

	const archived = await sageCommand.game.archive();
	if (archived) {
		await sageCommand.whisper("Game Archived.");

	}else {
		await sageCommand.whisper("Unknown Error; Game NOT Archived!");

	}

}