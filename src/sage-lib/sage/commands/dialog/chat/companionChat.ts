import type { SageMessage } from "../../../model/SageMessage";
import type { DialogContent } from "../DialogContent";
import { findCompanion } from "../find/findCompanion";
import { getColorType } from "../getColorType";
import type { ChatOptions } from "./ChatOptions";
import { doChat } from "./doChat";

export async function companionChat(sageMessage: SageMessage, dialogContent: DialogContent, options: ChatOptions): Promise<any> {
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