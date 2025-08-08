import { registerReactionListener } from "../../../discord/handlers.js";
import { ReactionType, type TCommand } from "../../../discord/index.js";
import { EmojiType } from "../../model/HasEmojiCore.js";
import type { SageReaction } from "../../model/SageReaction.js";

async function isPin(sageReaction: SageReaction): Promise<TCommand | null> {
	// check the appropriate pin emoji, allows us to avoid caching messages we don't need to
	const pinEmoji = sageReaction.getEmoji(EmojiType.CommandPin);
	const emoji = sageReaction.emoji;
	if (emoji.name !== pinEmoji) {
		return null;
	}

	// no Game, no pins!
	const game = sageReaction.game;
	if (!game) {
		return null;
	}

	const messageReaction = await sageReaction.fetchMessageReaction();
	const { message } = messageReaction;

	// check pinnable
	if (!message.pinnable) {
		return null;
	}

	// check it isn't already pinned AND we are adding emoji
	if (message.pinned && sageReaction.isAdd) {
		return null;
	}

	// check it is already pinned AND we are removing emoji
	if (!message.pinned && sageReaction.isRemove) {
		return null;
	}

	// make sure the reactor is in the game or an admin
	const canManageGame = await sageReaction.validatePermission("canManageGame");
	if (!canManageGame && !sageReaction.actor.isGamePlayer) {
		return null;
	}

	// make sure the post was by Sage or a game player
	const isAuthorSageOrWebhook = await sageReaction.isAuthorSageOrWebhook();
	if (!isAuthorSageOrWebhook) {
		// not a sage/webhook post, check the author
		const author = await sageReaction.eventCache.validateAuthor();
		if (!author.isGameUser) {
			return null;
		}
	}

	// trigger any add, but only a remove if it was the last pin reaction removed
	const canDoPin = !sageReaction.isRemove || messageReaction.count === 0;
	if (canDoPin) {
		return { command: "dialog-pin" };
	}

	return null;
}

async function doPin(sageReaction: SageReaction): Promise<void> {
	const message = await sageReaction.fetchMessage();
	if (sageReaction.isAdd) {
		await message.pin();
	} else if (sageReaction.isRemove) {
		await message.unpin();
	}
}

export function registerPinReaction(): void {
	registerReactionListener(isPin, doPin, { type:ReactionType.Both });
}