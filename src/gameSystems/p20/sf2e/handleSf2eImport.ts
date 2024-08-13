import type { Optional } from "@rsc-utils/core-utils";
import { DiscordKey, type MessageOrPartial, type MessageTarget } from "@rsc-utils/discord-utils";
import { PdfCacher, type PdfJson } from "@rsc-utils/io-utils";
import { attachCharacter, postCharacter } from "../../../sage-lib/sage/commands/pathbuilder.js";
import type { SageCommand } from "../../../sage-lib/sage/model/SageCommand.js";
import { jsonToCharacter } from "./jsonToCharacter.js";

type AttachmentData = { json?:PdfJson; fileName?:string; };
async function getJsonFromAttachment(message: Optional<MessageOrPartial>): Promise<AttachmentData> {
	const attachment = message?.attachments.find(att => att.contentType === "application/pdf" || att.name?.endsWith(".pdf") === true);
	if (attachment) {
		const fileName = attachment.name;
		const json = await PdfCacher.read<PdfJson>(attachment.url);
		return { json, fileName };
	}
	return { };
}

export async function handleSf2eImport(sageCommand: SageCommand): Promise<void> {
	await sageCommand.replyStack.startThinking();

	let json: PdfJson | undefined;
	let fileName: string | undefined;

	if (sageCommand.isSageMessage()) {
		({ json, fileName } = await getJsonFromAttachment(sageCommand.message));
	}

	if (!json) {
		const value = sageCommand.args.getString("pdf") ?? "";
		const isPdfUrl = /^http.*?\.pdf$/.test(value);
		const isMessageUrl = value.startsWith("https://discord.com/channels/");

		if (isPdfUrl) {
			json = await PdfCacher.read<PdfJson>(value);
			fileName = value.split("/").pop();

		}else if (isMessageUrl) {
			const discordKey = DiscordKey.fromUrl(value);
			const message = discordKey ? await sageCommand.sageCache.fetchMessage(discordKey) : undefined;
			({ json, fileName } = await getJsonFromAttachment(message));
		}
	}

	if (!json) {
		return sageCommand.replyStack.whisper(`Failed to find pdf!`);
	}

	const character = jsonToCharacter(json);
	if (!character) {
		return sageCommand.replyStack.whisper(`Failed to import character from: ${fileName}!`);
	}

	const importing = await sageCommand.replyStack.reply(`Importing ${character.name ?? "<i>Unnamed Character</i>"} ...`, false);

	const channel = sageCommand.dChannel as MessageTarget;
	const user = channel ? undefined : await sageCommand.sageCache.discord.fetchUser(sageCommand.sageUser.did);

	const pin = sageCommand.args.getBoolean("pin") ?? false;
	const attach = sageCommand.args.getBoolean("attach") ?? false;
	if (attach) {
		await attachCharacter(sageCommand.sageCache, channel ?? user, fileName!, character, pin);

	}else {
		await postCharacter(sageCommand, channel ?? user, character, pin);
	}

	await importing?.delete();

	if (sageCommand.isSageInteraction()) {
		await sageCommand.replyStack.deleteReply();
	}

	await sageCommand.replyStack.stopThinking();
}
