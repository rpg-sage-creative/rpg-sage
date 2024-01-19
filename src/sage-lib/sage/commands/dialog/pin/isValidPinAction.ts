import { EmojiType } from "../../../model/HasEmojiCore";
import { SageReaction } from "../../../model/SageReaction";

export function isValidPinAction(sageReaction: SageReaction): boolean {
	const message = sageReaction.messageReaction.message;
	// check pinnable
	if (!message.pinnable) {
		return false;
	}
	// check it isn't already pinned AND we are adding emoji
	if (message.pinned && sageReaction.isAdd) {
		return false;
	}
	// check it is already pinned AND we are removing emoji
	if (!message.pinned && sageReaction.isRemove) {
		return false;
	}

	// check the appropriate pin emoji
	const { game, server, bot } = sageReaction;
	const pinEmoji = (game ?? server ?? bot).getEmoji(EmojiType.CommandPin);
	const emoji = sageReaction.messageReaction.emoji;
	if (emoji.name !== pinEmoji) {
		return false;
	}

	return true;
}
