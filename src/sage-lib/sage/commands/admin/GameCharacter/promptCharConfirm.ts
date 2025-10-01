import type { StringSet } from "@rsc-utils/core-utils";
import { deleteMessages } from "../../../../discord/deletedMessages.js";
import { discordPromptYesNo } from "../../../../discord/prompts.js";
import type { GameCharacter } from "../../../model/GameCharacter.js";
import type { SageMessage } from "../../../model/SageMessage.js";
import { createAdminRenderableContent } from "../../cmd.js";
import { sendGameCharacter } from "./sendGameCharacter.js";
import { sendGameCharacterMods } from "./sendGameCharacterMods.js";

export async function promptModsConfirm(sageMessage: SageMessage, character: GameCharacter, updatedKeys: StringSet, action: (char: GameCharacter) => Promise<boolean>): Promise<void> {
	let yes: boolean;
	const details = await sendGameCharacterMods(sageMessage, character, updatedKeys);
	if (sageMessage.args.nonKeyValuePairs().includes("-y")) {
		yes = true;
	}else {
		const promptRenderable = createAdminRenderableContent(sageMessage.getHasColors());
		promptRenderable.append(`Update ${character.name}?`);
		yes = await discordPromptYesNo(sageMessage, promptRenderable, true) ?? false;
	}
	if (yes === true) {
		const updated = await action(character);
		if (updated) {
			await sageMessage.replyStack.editLast(`Character Updated.`);
		}else {
			await sageMessage.replyStack.whisper({ content:"Unknown Error; Character NOT Updated!" });
		}
	}else {
		await sageMessage.replyStack.editLast(`Character ***NOT*** Updated.`);
		await deleteMessages(details);
	}
}

export async function promptCharConfirm(sageMessage: SageMessage, character: GameCharacter, prompt: string, action: (char: GameCharacter) => Promise<boolean>): Promise<void> {
	let yes: boolean;
	const details = await sendGameCharacter(sageMessage, character);
	if (sageMessage.args.nonKeyValuePairs().includes("-y")) {
		yes = true;
	}else {
		const promptRenderable = createAdminRenderableContent(sageMessage.getHasColors());
		promptRenderable.append(prompt);
		yes = await discordPromptYesNo(sageMessage, promptRenderable, true) ?? false;
	}
	if (yes === true) {
		const updated = await action(character);
		if (updated) {
			await sageMessage.replyStack.editLast(`Character Updated.`);
		}else {
			await sageMessage.replyStack.whisper({ content:"Unknown Error; Character NOT Updated!" });
		}
	}else {
		await sageMessage.replyStack.editLast(`Character ***NOT*** Updated.`);
		await deleteMessages(details);
	}
}