import type { Snowflake } from "@rsc-utils/core-utils";
import { DiscordApiError, toHumanReadable, toMessageUrl } from "@rsc-utils/discord-utils";
import { AttachmentBuilder, User } from "discord.js";
import { deleteMessage, isDeleted } from "../../../discord/deletedMessages.js";
import { registerReactionListener } from "../../../discord/handlers.js";
import { ReactionType, type TCommand } from "../../../discord/index.js";
import { EmojiType } from "../../model/HasEmojiCore.js";
import type { SageReaction } from "../../model/SageReaction.js";
import { includeDeleteButton } from "../../model/utils/deleteButton.js";
import { SageMessageReference } from "../../repo/SageMessageReference.js";

async function isDelete(sageReaction: SageReaction): Promise<TCommand | null> {
	// check the appropriate delete emoji
	const deleteEmoji = sageReaction.getEmoji(EmojiType.CommandDelete);
	const emoji = sageReaction.emoji;
	if (emoji.name !== deleteEmoji) {
		return null;
	}

	// we now need the message, so fetch the reaction
	const messageReaction = await sageReaction.fetchMessageReaction().catch(DiscordApiError.ignore(10008));

	// we failed to find a messageReaction, so do nothing
	if (!messageReaction) return null;

	// grab the message now that we have a valid message reaction
	const { message } = messageReaction;

	// check deletable
	if (!message.deletable) {
		return null;
	}

	// pause to see if Tupper is handling this one
	const channelReference = {
		guildId: message.guildId as Snowflake ?? undefined,
		channelId: message.channelId as Snowflake
	};
	await sageReaction.eventCache.pauseForTupper(channelReference);
	if (isDeleted(message.id as Snowflake)) {
		return null;
	}

	const userId = sageReaction.user.id;
	const dialogMessage = await SageMessageReference.read(message, { ignoreMissingFile:true });
	if (dialogMessage?.userId === userId) {
		// This covers PCs inside a game *AND* outside a game
		return { command: "CommandDelete|Add" };
	}

	const { game } = sageReaction;
	if (game) {
		// make sure the reactor is a gm or an admin
		if (!sageReaction.canAdminGame) {
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

		return { command: "CommandDelete|Add" };
	}

	return null;
}

async function doDelete(sageReaction: SageReaction): Promise<void> {
	const message = await sageReaction.fetchMessage().catch(DiscordApiError.process);

	// we can't work without a message
	if (!message) {
		return;
	}

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

	const dialogMessage = await SageMessageReference.read(message, { ignoreMissingFile:true });
	if (dialogMessage && !actor.equals(dialogMessage.userId)) {
		const poster = await sageReaction.sageCache.getOrFetchUser(dialogMessage.userId);
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