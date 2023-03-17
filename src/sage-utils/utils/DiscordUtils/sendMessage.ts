import { EmbedBuilder, embedLength, Message, Snowflake } from "discord.js";
import { embedsToTexts } from "./embeds";
import { handleDiscordErrorReturnNull } from "./errorHandlers";
import { canSendMessageTo } from "./permChecks";
import { canCheckPermissionsFor } from "./typeChecks";
import type { DChannel, DUser } from "./types";

type TSendToArgs = {
	botId: Snowflake;
	content?: string;
	embeds?: EmbedBuilder[];
	embedsAsContent: boolean;
	errMsg?: string;
	target: DChannel | DUser;
};
/**
 * @todo PLEASE MOVE THIS TO A SHARED LOCATION
 * Returns a Discord.Message upon success, null upon error, and undefined if Sage doesn't have permissions to send to this channel/thread.
 */
 export async function sendTo({ botId, content, embeds, embedsAsContent, errMsg, target }: TSendToArgs): Promise<Message | null | undefined> {
	const canTest = canCheckPermissionsFor(target);
	const canSend = canTest ? canSendMessageTo(botId, target) : true;
	if (canTest && !canSend) {
		/** @todo shouldn't we notify the user? */
		return Promise.resolve(undefined);
	}
	if (embedsAsContent && embeds?.length) {
		content = (content ? `${content}\n------------------\n` : "") + embedsToTexts(embeds).join("\n");
		embeds = [];
	}
	if (!content && (!embeds?.length || !embeds.find(embed => embedLength(embed.data)))) {
		console.trace("Empty Contents and Embeds!");
		return null;
	}
	return target.send({ content, embeds }).catch(error => handleDiscordErrorReturnNull(error, { errMsg, target }));
}
