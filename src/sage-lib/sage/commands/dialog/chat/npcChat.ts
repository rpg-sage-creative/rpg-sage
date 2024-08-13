import type { SageMessage } from "../../../model/SageMessage";
import type { DialogContent } from "../DialogContent";
import { findNpc } from "../find/findNpc";
import { getColorType } from "../getColorType";
import type { ChatOptions } from "./ChatOptions";
import { doChat } from "./doChat";

export async function npcChat(sageMessage: SageMessage, dialogContent: DialogContent, options: ChatOptions): Promise<void> {
	const characterName = dialogContent.name?.trim();
	if (characterName) {
		const character = characterName ? findNpc(sageMessage, characterName, { auto:true, first:false }) : null;
		if (character) {
			await doChat(sageMessage, { character, colorType:getColorType(dialogContent.type), dialogContent }, options);
		}else {
			await sageMessage.reactWarn(`Unable to find NPC for dialog: "${characterName}"`);
		}
	}else {
		await sageMessage.reactWarn(`Missing NPC name for dialog!`);
	}
}