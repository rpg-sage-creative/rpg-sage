import type { SageCommand } from "../../../model/SageCommand.js";
import { registerCharForm, showCharForm } from "./form/showCharForm.js";
import { registerCharImages } from "./form/showCharImagesModal.js";
import { registerCharNames } from "./form/showCharNamesModal.js";
import { registerCharStats } from "./form/showCharStatsModal.js";

/*
1. prompt modal dialog input
2. handle modal dialog input
2. save input to /games/game_id/users/user_id/characters/nil_snowflake.json
3. prompt confirmation
4. handle confirmation
5. create character
6. delete tmp character
*/

export async function gcCmdCreate(sageCommand: SageCommand): Promise<void> {
	sageCommand.replyStack.deferAndDelete();
	await showCharForm(sageCommand);
}

export function registerCharModal(): void {
	registerCharForm();
	registerCharNames();
	registerCharImages();
	registerCharStats();
}
