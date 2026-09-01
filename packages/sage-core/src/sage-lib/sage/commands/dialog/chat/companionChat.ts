import type { DialogContent } from "@rsc-utils/game-utils";
import type { SageMessage } from "../../../model/SageMessage.js";
import { findCompanion } from "../find/findCompanion.js";
import { getColorType } from "../getColorType.js";
import type { ChatOptions } from "./ChatOptions.js";
import { doChat } from "./doChat.js";

export async function companionChat(sageMessage: SageMessage, dialogContent: DialogContent, options: ChatOptions): Promise<void> {
	const findOpts = { auto:true, first:true };
	let character = findCompanion(sageMessage, dialogContent.name, findOpts);

	// this logic allows for dyanmic display names; without it things get weird
	if (!character && dialogContent.displayName) {
		character = findCompanion(sageMessage, `${dialogContent.name} (${dialogContent.displayName})`, findOpts);
		if (character) dialogContent.displayName = undefined;
	}

	if (character) {
		await doChat(sageMessage, { character, colorType:getColorType(dialogContent.type), dialogContent }, options);
	}else {
		await sageMessage.reactWarn(`Unable to find Alt/Companion for dialog: "${dialogContent.name ?? ""}"`);
	}
}