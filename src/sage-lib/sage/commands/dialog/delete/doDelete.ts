import type { Snowflake } from "@rsc-utils/core-utils";
import { toHumanReadable, toMessageUrl } from "@rsc-utils/discord-utils";
import { AttachmentBuilder, User } from "discord.js";
import { deleteMessage } from "../../../../discord/deletedMessages.js";
import type { SageReaction } from "../../../model/SageReaction.js";
import { includeDeleteButton } from "../../../model/utils/deleteButton.js";
import { DialogMessageRepository } from "../../../repo/DialogMessageRepository.js";

export async function doDelete(sageReaction: SageReaction): Promise<void> {
	const message = sageReaction.messageReaction.message;

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