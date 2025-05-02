import { getText } from "@rsc-utils/io-utils";
import { type Attachment } from "discord.js";
import { deleteMessage } from "../../../discord/deletedMessages.js";
import { registerMessageListener } from "../../../discord/handlers.js";
import type { TCommandAndArgsAndData } from "../../../discord/index.js";
import { discordPromptYesNo } from "../../../discord/prompts.js";
import type { SageMessage } from "../../model/SageMessage.js";
import { GameMap } from "./GameMap.js";
import { type TGameMapCore } from "./GameMapBase.js";
import { gameMapImporter, validateMapCore, type TParsedGameMapCore } from "./gameMapImporter.js";
import { renderMap } from "./renderMap.js";

function getValidUrl(attachment: Attachment): string | null {
	const regex = /map\.txt$/i;
	if (regex.test(attachment.url.split(/[\?\#]/)[0])) {
		return attachment.url;
	}
	if (regex.test(attachment.proxyURL.split(/[\?\#]/)[0])) {
		return attachment.proxyURL;
	}
	if (attachment.name && regex.test(attachment.name)) {
		return attachment.name;
	}
	return null;
}

async function mapImportTester(sageMessage: SageMessage): Promise<TCommandAndArgsAndData<TParsedGameMapCore> | null> {
	// not doing maps in DMs
	if (!sageMessage.sageCache.discord.guild) return null;

	const attachments = sageMessage.message.attachments;
	if (!attachments.size) {
		return null;
	}

	for (const [_id, attachment] of attachments) {
		const validUrl = getValidUrl(attachment);
		if (validUrl) {
			const raw = await getText(validUrl);
			const parsedCore = gameMapImporter(raw);
			if (parsedCore) {
				return {
					data: parsedCore
				};
			}
		}
	}
	return null;
}

async function mapImportHandler(sageMessage: SageMessage, mapCore: TGameMapCore | TParsedGameMapCore): Promise<void> {
	const boolImport = await discordPromptYesNo(sageMessage, `Try to import map: ${mapCore.name}?`, true);
	if (boolImport) {
		const channel = sageMessage.message.channel;
		const pwConfiguring = await channel.send(`Importing and configuring: ${mapCore.name} ... ${sageMessage.replyStack.spinnerEmoji}`);

		const validatedCore = await validateMapCore(mapCore as TParsedGameMapCore, sageMessage.message.guild!);
		const invalidUsers = validatedCore.invalidUsers ?? [];
		const invalidImages = validatedCore.invalidImages ?? [];
		if (invalidUsers.length || invalidImages.length) {
			const warning = `### Warning\nThe map cannot be loaded for the following reasons ...`;
			const invalidUserText = invalidUsers.length ? `\n### Invalid Users\nThe following users could not be found:\n> ${invalidUsers.join("\n> ")}` : ``;
			const invalidImageText = invalidImages.length ? `\n### Invalid Images\nThe following images could not be loaded:\n> ${invalidImages.map(url => `<${url}>`).join("\n> ")}` : ``;
			await channel.send(warning + invalidUserText + invalidImageText);

		}else {
			if (!mapCore.userId) {
				mapCore.userId = sageMessage.sageUser.did;
			}
			const success = await renderMap(channel, new GameMap(mapCore as TGameMapCore, mapCore.userId));
			if (!success) {
				await channel.send(`Sorry, something went wrong importing the map.`);
			}
		}

		deleteMessage(pwConfiguring);
	}
}

export function registerMapImport(): void {
	registerMessageListener(mapImportTester, mapImportHandler);
}