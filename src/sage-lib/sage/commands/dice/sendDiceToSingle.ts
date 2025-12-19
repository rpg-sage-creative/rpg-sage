import { debug, isNotBlank, type Optional } from "@rsc-utils/core-utils";
import { toMessageUrl, type MessageTarget, type SupportedMessagesChannel } from "@rsc-utils/discord-utils";
import { sendTo } from "../../../discord/sendTo.js";
import { ColorType } from "../../model/HasColorsCore.js";
import type { SageCommand } from "../../model/SageCommand.js";
import type { FormattedDiceOutput } from "./FormattedDiceOutput.js";
import { createMentionLine } from "./createMentionLine.js";

/** This function sends all dice rolls to the channel in one post. */
export async function sendDiceToSingle(sageCommand: SageCommand, formattedOutputs: FormattedDiceOutput[], targetChannel: SupportedMessagesChannel, gmTargetChannel: Optional<MessageTarget>): Promise<void> {
	const isSageMessage = sageCommand.isSageMessage();
	const hasSecret = formattedOutputs.filter(output => output.hasSecret).length > 0;
	const allSecret = formattedOutputs.filter(output => output.hasSecret).length === formattedOutputs.length;
	const publicMentionLine = await createMentionLine(sageCommand);
	const secretMentionLine = await createMentionLine(sageCommand, true);
	const secretReferenceLink = isSageMessage ? toMessageUrl(sageCommand.message) : ``;
	const splitOptions = { embedColor:sageCommand.toHexColorString(ColorType.Dice) ?? undefined };

	const gmPostContents: Optional<string>[] = [];
	const gmEmbedContents: Optional<string>[] = [];
	const mainPostContents: Optional<string>[] = [];
	const mainEmbedContents: Optional<string>[] = [];

	if (hasSecret && gmTargetChannel) {
		gmPostContents.push(`${secretMentionLine} ${secretReferenceLink}`);
	}
	if (!allSecret) {
		mainPostContents.push(publicMentionLine);
	}

	for (const formattedOutput of formattedOutputs) {
		// figure out where to send results and info about secret rolls
		if (formattedOutput.hasSecret && gmTargetChannel) {
			gmPostContents.push(formattedOutput.postContent);
			gmEmbedContents.push(formattedOutput.embedContent);
			if (!allSecret) {
				mainPostContents.push(formattedOutput.notificationContent);
			}
		} else {
			mainPostContents.push(formattedOutput.postContent);
			mainEmbedContents.push(formattedOutput.embedContent);
		}
	}

	const gmPostContent = gmPostContents.filter(isNotBlank).join("\n");
	const gmEmbedContent = gmEmbedContents.filter(isNotBlank).join("\n");
	if (gmPostContent || gmEmbedContent) {
		if (gmTargetChannel) {
			await sendTo({
				sageCache: sageCommand.sageCache,
				target: gmTargetChannel,
				content: gmPostContent,
				embedContent: gmEmbedContent
			}, splitOptions);
		}else {
			debug("no gmTargetChannel!");
		}
	}

	const mainPostContent = mainPostContents.filter(isNotBlank).join("\n");
	const mainEmbedContent = mainEmbedContents.filter(isNotBlank).join("\n");
	if (mainPostContent || mainEmbedContent) {
		if (targetChannel) {
			await sendTo({
				sageCache: sageCommand.sageCache,
				target: targetChannel,
				content: mainPostContent,
				embedContent: mainEmbedContent
			}, splitOptions);
		}else {
			debug("no targetChannel!");
		}
	}

	if (allSecret && isSageMessage) {
		/** @todo if the dice came from a dialog command then the original message will be deleted and the user will not see this reaction */
		await sageCommand.reactDie();
	}
}