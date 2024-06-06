import { errorReturnEmptyArray, errorReturnNull, warnReturnNull } from "@rsc-utils/core-utils";
import { DiscordKey, type DMessage } from "@rsc-utils/discord-utils";
import { getBuffer } from "@rsc-utils/io-utils";
import { RenderableContent } from "@rsc-utils/render-utils";
import { stringOrUndefined } from "@rsc-utils/string-utils";
import { MessageAttachment } from "discord.js";
import type { GameCharacter, TDialogMessage } from "../../model/GameCharacter.js";
import type { ColorType } from "../../model/HasColorsCore.js";
import { EmojiType } from "../../model/HasEmojiCore.js";
import type { SageMessage } from "../../model/SageMessage.js";
import { DialogMessageRepository } from "../../repo/DialogMessageRepository.js";
import type { DialogType } from "../../repo/base/IdRepository.js";
import { parseDiceMatches, sendDice } from "../dice.js";
import type { ChatOptions } from "./chat/ChatOptions.js";
import { sendDialogRenderable } from "./sendDialogRenderable.js";

type DialogPostData = {
	authorName?: string;
	character: GameCharacter;
	colorType?: ColorType;
	content: string;
	embedColor?: string;
	imageUrl?: string;
	postType?: DialogType;
	title?: string;
};

function formatName(char: GameCharacter, name?: string): string {
	const template = stringOrUndefined(name) ?? char.getStat("displayName.template");
	return template?.replace(/{[^}]+}/g, match => char.getStat(match.slice(1, -1)) ?? match)
		?? char.name;
}

export async function sendDialogPost(sageMessage: SageMessage, postData: DialogPostData, { doAttachment, skipDelete }: ChatOptions): Promise<DMessage[]> {
	const character = postData?.character;
	if (!character) {
		return Promise.reject("Invalid TDialogPostData");
	}

	const webhook = true; //sageMessage.dialogType === "Webhook";
	const renderableContent = new RenderableContent();

	const authorName = formatName(character, postData.authorName);
	const title = postData.title || authorName;
	if (!webhook || title !== authorName) {
		renderableContent.setTitle(title);
	}

	const color = postData.embedColor ?? character.embedColor ?? sageMessage.toDiscordColor(postData.colorType);
	renderableContent.setColor(color);

	let content = postData.content;

	//#region dice lists
	const diceMatches = await parseDiceMatches(sageMessage, content);
	const inlineDiceMatches = diceMatches.filter(match => match.inline);
	const otherDiceMatches = diceMatches.filter(match => !match.inline);
	//#endregion

	//#region inline dice
	if (inlineDiceMatches.length > 0) {
		inlineDiceMatches.reverse(); // gotta do em in reverse order to preserve indexes
		for (const diceMatch of inlineDiceMatches) {
			const left = content.slice(0, diceMatch.index);
			const middle = diceMatch.output.map(out => out.hasSecret ? `${out.input} [die]` : out.inlineOutput).join("");
			const right = content.slice(diceMatch.index + diceMatch.match.length);
			content = left + middle + right;
		}
	}
	//#endregion

	//#region map/movement arrows
	const regex = /\[(\b(\s|nw|n|ne|w|c|e|sw|s|se))+\]/ig;
	content = content.replace(regex, match =>
		match.slice(1, -1).split(/\s/).filter(s => s).map(s => `[${s}]`).join(" ")
	);
	//#endregion

	renderableContent.append(content);

	const thumbnailUrl = postData.imageUrl ?? character.avatarUrl;
	renderableContent.setThumbnailUrl(thumbnailUrl);

	// Discord "avatarURL" is the profile pic, which I am calling the "tokenUrl"
	const avatarUrl = character.tokenUrl ?? sageMessage.bot.tokenUrl;
	const authorOptions = { username: authorName, avatarURL: avatarUrl };

	const dialogTypeOverride = postData.postType;

	//#region files
	const files: MessageAttachment[] = [];
	if (doAttachment && sageMessage.message.attachments.size) {
		for (const att of sageMessage.message.attachments.values()) {
			if (att.contentType?.match(/image/i) && att.url) {
				const buffer = await getBuffer(att.url).catch(warnReturnNull);
				if (buffer !== null) {
					files.push(new MessageAttachment(buffer, att.name ?? undefined));
				}
			}
		}
	}
	//#endregion

	const messages: DMessage[] = await sendDialogRenderable({ sageMessage, renderableContent, authorOptions, dialogTypeOverride, files, skipDelete })
		.catch(errorReturnEmptyArray);
	if (messages.length) {
		const last = messages[messages.length - 1];

		//#region dice
		const diceOutputs = otherDiceMatches.map(match => match.output).flat();
		if (diceOutputs.length) {
			const diceResults = await sendDice(sageMessage, diceOutputs);
			if (diceResults.allSecret && diceResults.hasGmChannel) {
				const emoji = sageMessage.getEmoji(EmojiType.Die);
				if (emoji) {
					await last.react(emoji).catch(errorReturnNull);
				}
			}
		}
		//#endregion

		const dialogMessage: Partial<TDialogMessage> = {
			channelDid: last.channel.isThread() ? last.channel.parent?.id : last.channel.id,
			characterId: character.id,
			gameId: sageMessage.game?.id,
			messageDid: last.id,
			serverDid: last.guild?.id,
			threadDid: last.channel.isThread() ? last.channel.id : undefined,
			timestamp: last.createdTimestamp,
			userDid: character.userDid ?? sageMessage.sageUser.did
		};
		await DialogMessageRepository.write(DiscordKey.fromMessage(last), dialogMessage as TDialogMessage);

		character.setLastMessage(dialogMessage as TDialogMessage);
		await character.save();
	}
	return messages;
}