import { TCommand } from "../../../../discord";
import { isAuthorBotOrWebhook } from "../../../../discord/handlers";
import { SageReaction } from "../../../model/SageReaction";
import { DialogMessageRepository } from "../../../repo/DialogMessageRepository";
import { isValidDeleteAction } from "./isValidDeleteAction";

export async function isDelete(sageReaction: SageReaction): Promise<TCommand | null> {
	if (!isValidDeleteAction(sageReaction)) {
		return null;
	}

	const userDid = sageReaction.user.id;
	const dialogMessage = await DialogMessageRepository.read(sageReaction.discordKey, () => null);
	if (dialogMessage?.userDid === userDid) {
		// This covers PCs inside a game *AND* outside a game
		return { command: "dialog-delete" };
	}

	const { game } = sageReaction;
	if (game) {
		const actorIsGameUser = await game?.hasUser(sageReaction.user.id);
		if (!actorIsGameUser) {
			return null;
		}

		const isBotOrWebhook = await isAuthorBotOrWebhook(sageReaction);
		const authorIsGameUser = await game?.hasUser(sageReaction.message.author?.id);
		if (!isBotOrWebhook && !authorIsGameUser) {
			return null;
		}

		const isGm = game.hasGameMaster(userDid);
		if (!isGm) {
			return null;
		}

		return { command: "dialog-delete" };
	}

	return null;
}