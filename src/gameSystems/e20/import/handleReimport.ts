import type { MessageOrPartial } from "@rsc-utils/discord-utils";
import type { SageCommand } from "../../../sage-lib/sage/model/SageCommand.js";

export async function handleReimport(sageCommand: SageCommand, _message: MessageOrPartial, _characterId: string): Promise<void> {
	return sageCommand.replyStack.whisper("Sorry, not yet enabled!");
}