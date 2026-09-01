import type { DialogContent } from "@rsc-utils/game-utils";
import type { SageMessage } from "../../../model/SageMessage.js";
import { findNpc } from "../find/findNpc.js";
import { getColorType } from "../getColorType.js";
import type { ChatOptions } from "./ChatOptions.js";
import { doChat } from "./doChat.js";

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