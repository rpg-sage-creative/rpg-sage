import { errorReturnEmptyArray, errorReturnNull, RenderableContent, warnReturnNull, type HexColorString, type Snowflake } from "@rsc-utils/core-utils";
import { getBuffer } from "@rsc-utils/io-utils";
import { AttachmentBuilder, type Message } from "discord.js";
import type { TDiceOutput } from "../../../../sage-dice/common.js";
import type { GameCharacter } from "../../model/GameCharacter.js";
import type { ColorType } from "../../model/HasColorsCore.js";
import { EmojiType } from "../../model/HasEmojiCore.js";
import type { SageMessage } from "../../model/SageMessage.js";
import { DialogDiceBehaviorType } from "../../model/User.js";
import { DialogMessageRepository } from "../../repo/DialogMessageRepository.js";
import type { DialogType } from "../../repo/base/IdRepository.js";
import { logPostCurrency } from "../admin/PostCurrency.js";
import { parseDiceMatches, sendDice, type TDiceMatch } from "../dice.js";
import { MoveDirection } from "../map/MoveDirection.js";
import type { ChatOptions } from "./chat/ChatOptions.js";
import { sendDialogRenderable } from "./sendDialogRenderable.js";

type DialogPostData = {
	authorName?: string;
	character: GameCharacter;
	colorType?: ColorType;
	content: string;
	embedColor?: HexColorString;
	imageUrl?: string;
	postType?: DialogType;
	title?: string;
};

export async function sendDialogPost(sageMessage: SageMessage, postData: DialogPostData, { doAttachment, isFirst }: ChatOptions): Promise<Message[]> {
	const character = postData?.character;
	if (!character) {
		return Promise.reject("Invalid TDialogPostData");
	}

	const webhook = true; //sageMessage.dialogType === "Webhook";
	const renderableContent = new RenderableContent();

	const authorName = character.toDisplayName(postData.authorName);
	const title = postData.title || authorName;
	if (!webhook || title !== authorName) {
		renderableContent.setTitle(title);
	}

	const color = postData.embedColor ?? character.embedColor ?? sageMessage.toHexColorString(postData.colorType);
	renderableContent.setColor(color);

	let content = postData.content;

	//#region dice lists
	const diceMatches = await parseDiceMatches(sageMessage, content);
	const reverseInline = sageMessage.sageUser.dialogDiceBehaviorType === DialogDiceBehaviorType.Inline;
	const inlineDiceMatches: TDiceMatch[] = [];
	const diceOutputs: TDiceOutput[] = [];
	diceMatches.forEach(dice => {
		const inline = reverseInline ? !dice.inline : dice.inline;
		if (inline) {
			inlineDiceMatches.push(dice);
			dice.output.forEach(out => {
				if (out.hasSecret) {
					diceOutputs.push(out);
				}
			});
		}else {
			diceOutputs.push(...dice.output);
		}
	});
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
	content = MoveDirection.replaceAll(content, sageMessage.moveDirectionOutputType);
	//#endregion

	//#region footer / sheet link
 	let dialogFooter = character.toDialogFooterLine();
 	const sheetLink = character.toSheetLink();
 	if (sheetLink) {
 		if (dialogFooter) {
 			if (!dialogFooter.includes(sheetLink.slice(5, -2))) {
 				dialogFooter += ` ${sheetLink}`;
 			}
 		}else {
 			content += ` ${sheetLink}`;
 		}
 	}
 	//#endregion

	renderableContent.append(content);
	if (dialogFooter) renderableContent.append(dialogFooter);

	const thumbnailUrl = postData.imageUrl ?? character.avatarUrl;
	renderableContent.setThumbnailUrl(thumbnailUrl);

	// Discord "avatarURL" is the profile pic, which I am calling the "tokenUrl"
	const avatarUrl = character.tokenUrl ?? sageMessage.bot.tokenUrl;
	const authorOptions = { username: authorName, avatarURL: avatarUrl };

	const dialogTypeOverride = postData.postType;

	//#region files
	const files: AttachmentBuilder[] = [];
	if (doAttachment && sageMessage.message.attachments.size) {
		for (const att of sageMessage.message.attachments.values()) {
			if (att.contentType?.match(/image/i) && att.url) {
				const buffer = await getBuffer(att.url).catch(warnReturnNull);
				if (buffer !== null) {
					files.push(new AttachmentBuilder(buffer, { name:att.name }));
				}
			}
		}
	}
	//#endregion

	const skipDelete = !isFirst;
	const skipReplyingTo = !isFirst;
	const messages = await sendDialogRenderable({ sageMessage, renderableContent, authorOptions, dialogTypeOverride, files, skipDelete, skipReplyingTo })
		.catch(errorReturnEmptyArray);
	if (messages.length) {
		await logPostCurrency(sageMessage, "dialog");
		const last = messages[messages.length - 1];

		//#region dice

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

		//#region DialogMessageRepository / lastMessage

		// save all the dialog messages, save last one
		const lastMessage = await DialogMessageRepository.write({
			characterId: character.id,
			gameId: sageMessage.game?.id as Snowflake,
			messages,
			userId: sageMessage.sageUser.did
		});

		// if we have a lastMessage, save it to the character
		if (lastMessage) {
			character.setLastMessage(lastMessage);
			await character.save();
		}

		//#endregion

	}
	return messages;
}