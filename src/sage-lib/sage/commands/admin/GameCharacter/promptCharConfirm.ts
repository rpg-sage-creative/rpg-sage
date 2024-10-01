import { discordPromptYesNo } from "../../../../discord/prompts.js";
import type { GameCharacter } from "../../../model/GameCharacter.js";
import type { SageMessage } from "../../../model/SageMessage.js";
import { createAdminRenderableContent } from "../../cmd.js";
import { sendGameCharacter } from "./sendGameCharacter.js";
import { sendGameCharacterMods } from "./sendGameCharacterMods.js";

export async function promptModsConfirm(sageMessage: SageMessage, character: GameCharacter, statModKeys: string[], action: (char: GameCharacter) => Promise<boolean>): Promise<void> {
	await sendGameCharacterMods(sageMessage, character, statModKeys);
	const promptRenderable = createAdminRenderableContent(sageMessage.getHasColors());
	promptRenderable.append(`Update ${character.name}?`);
	const yes = await discordPromptYesNo(sageMessage, promptRenderable, true);
	if (yes === true) {
		const updated = await action(character);
		await sageMessage.reactSuccessOrFailure(updated);
	}
}

export async function promptCharConfirm(sageMessage: SageMessage, character: GameCharacter, prompt: string, action: (char: GameCharacter) => Promise<boolean>): Promise<void> {
	await sendGameCharacter(sageMessage, character);
	const promptRenderable = createAdminRenderableContent(sageMessage.getHasColors());
	promptRenderable.append(prompt);
	const yes = await discordPromptYesNo(sageMessage, promptRenderable, true);
	if (yes === true) {
		const updated = await action(character);
		await sageMessage.reactSuccessOrFailure(updated);
	}
}