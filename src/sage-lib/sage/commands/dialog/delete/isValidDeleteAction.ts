import { EmojiType } from "../../../model/HasEmojiCore";
import type { SageReaction } from "../../../model/SageReaction";

export function isValidDeleteAction(sageReaction: SageReaction): boolean {
	const message = sageReaction.messageReaction.message;
	// check deletable
	if (!message.deletable) {
		return false;
	}
	// check we are adding the emoji
	if (sageReaction.isRemove) {
		return false;
	}

	// check the appropriate delete emoji
	const { game, server, bot } = sageReaction;
	const deleteEmoji = (game ?? server ?? bot).getEmoji(EmojiType.CommandDelete);
	const emoji = sageReaction.messageReaction.emoji;
	if (emoji.name !== deleteEmoji) {
		return false;
	}

	return true;
}