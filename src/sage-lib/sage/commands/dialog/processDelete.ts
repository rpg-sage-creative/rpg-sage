import { type Snowflake } from "@rsc-utils/core-utils";
import { DiscordApiError, isDiscordApiError, toHumanReadable, toMessageUrl } from "@rsc-utils/discord-utils";
import { AttachmentBuilder, User } from "discord.js";
import { deleteMessage } from "../../../discord/deletedMessages.js";
import { registerReactionListener } from "../../../discord/handlers.js";
import { ReactionType, type TCommand } from "../../../discord/index.js";
import { EmojiType } from "../../model/HasEmojiCore.js";
import { type SageReaction } from "../../model/SageReaction.js";
import { includeDeleteButton } from "../../model/utils/deleteButton.js";
import { DialogMessageRepository } from "../../repo/DialogMessageRepository.js";

async function isDelete(sageReaction: SageReaction): Promise<TCommand | null> {
	// check the appropriate delete emoji
	const deleteEmoji = sageReaction.getEmoji(EmojiType.CommandDelete);
	const emoji = sageReaction.emoji;
	if (emoji.name !== deleteEmoji) {
		return null;
	}

	// we now need the message, so fetch the reaction
	const messageReaction = await sageReaction.fetchMessageReaction().catch(err => {
		return isDiscordApiError(err, 10008) ? null : DiscordApiError.process(err);
	});
	if (messageReaction === null) {
		await sageReaction.replyStack.whisper(`We're sorry, the message you tried to delete doesn't exist.\n\n> Note: If you are trying to delete a dialog post that has been reposted (or "proxied") in character, it is possible that you are trying to delete an "echo" of the original post. An "echo" occurs sometimes when Discord receives dialog delete/repost messages simultaneously. If this is the case, closing and reopening Discord should make the "echo" go away.`, { forceEphemeral:true });
		return null;
	}
	if (!messageReaction) return null;

	// grab the message now that we have a valid message reaction
	const { message } = messageReaction;

	// check deletable
	if (!message.deletable) {
		return null;
	}

	const userDid = sageReaction.user.id;
	const dialogMessage = await DialogMessageRepository.read(sageReaction.discordKey, () => null);
	if (dialogMessage?.userDid === userDid) {
		// This covers PCs inside a game *AND* outside a game
		return { command: "CommandDelete|Add" };
	}

	const { game } = sageReaction;
	if (game) {
		/** @todo allow admins */
		// make sure the reactor is in the game
		const user = await sageReaction.user.fetch();
		const actorIsGameUser = await game.hasUser(user.id);
		if (!actorIsGameUser) {
			return null;
		}

		// make sure the post was by Sage or a game player
		const isAuthorSageOrWebhook = await sageReaction.isAuthorSageOrWebhook();
		const authorIsGameUser = await game?.hasUser(message.author?.id);
		if (!isAuthorSageOrWebhook && !authorIsGameUser) {
			return null;
		}

		// ensure the reactor is a GM
		const isGm = game.hasGameMaster(userDid);
		if (!isGm) {
			return null;
		}

		return { command: "CommandDelete|Add" };
	}

	return null;
}

async function doDelete(sageReaction: SageReaction): Promise<void> {
	const message = await sageReaction.fetchMessage();

	const sendDm = async (user: User, actor = "You") => {
		if (user) {
			const content = [
				`${actor} deleted: ${toMessageUrl(message)}`,
				`The original content has been attached to this message.`,
				"To stop receiving these messages, reply to this message with:```sage! user update dmOnDelete=false```"
			].join("\n");
			let originalContent = message.content ?? "";
			message.embeds.forEach(embed => {
				originalContent += "\n";
				if (embed.title) originalContent += "\n" + embed.title;
				if (embed.description) originalContent += "\n" + embed.description;
			});
			const files = [new AttachmentBuilder(Buffer.from(originalContent.trim(), "utf-8"), { name:`deleted-content.md` })];
			await user.send(includeDeleteButton({ content, files }, user.id as Snowflake));
		}
	};

	const actor = sageReaction.sageUser;
	let actorUser: User | undefined;
	if (actor.dmOnDelete) {
		const actorUser = await sageReaction.discord.fetchUser(actor.did);
		if (actorUser) await sendDm(actorUser);
	}

	const dialogMessage = await DialogMessageRepository.read(sageReaction.discordKey, () => null);
	if (dialogMessage && !actor.equals(dialogMessage.userDid)) {
		const poster = await sageReaction.sageCache.users.getByDid(dialogMessage.userDid);
		if (poster?.dmOnDelete) {
			const user = await sageReaction.discord.fetchUser(poster.did);
			if (user) await sendDm(user, toHumanReadable(actorUser))
		}
	}

	await deleteMessage(message);
}

export function registerDeleteReaction(): void {
	registerReactionListener(isDelete, doDelete, { type:ReactionType.Add });
}