import type { SageCommand } from "../../../model/SageCommand.js";

export function checkForEmojiOverride(sageMessage: SageCommand, usage: string): boolean {
	return sageMessage.sageCache.emojify(usage) !== usage;
}