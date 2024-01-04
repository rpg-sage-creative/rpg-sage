import type { TCommand } from "../../../../discord";
import { isAuthorBotOrWebhook } from "../../../../discord/handlers";
import type SageReaction from "../../../model/SageReaction";
import { isValidPinAction } from "./isValidPinAction";

export async function isPin(sageReaction: SageReaction): Promise<TCommand | null> {
	// no Game, no pins!
	const game = sageReaction.game;
	if (!game) {
		return null;
	}

	const messageReaction = sageReaction.messageReaction;
	const message = messageReaction.message;

	if (!isValidPinAction(sageReaction)) {
		return null;
	}

	const actorIsGameUser = await game.hasUser(sageReaction.user.id);
	if (!actorIsGameUser) {
		return null;
	}

	const isBotOrWebhook = await isAuthorBotOrWebhook(sageReaction);
	const authorIsGameUser = await game.hasUser(message.author?.id);
	if (!isBotOrWebhook && !authorIsGameUser) {
		return null;
	}

	const canDoPin = !sageReaction.isRemove || messageReaction.count === 0;
	return canDoPin ? { command: "dialog-pin" } : null;
}
