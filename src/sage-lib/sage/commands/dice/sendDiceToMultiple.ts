import { toMessageUrl, type DMessageChannel, type DMessageTarget } from "@rsc-utils/discord-utils";
import type { Optional } from "@rsc-utils/type-utils";
import type { MessageEmbed } from "discord.js";
import { createMessageEmbed } from "../../../discord/createMessageEmbed.js";
import { sendTo } from "../../../discord/sendTo.js";
import { ColorType } from "../../model/HasColorsCore.js";
import type { SageCommand } from "../../model/SageCommand.js";
import type { FormattedDiceOutput } from "./FormattedDiceOutput.js";
import { createMentionLine } from "./createMentionLine.js";

/** Only creates the embed if content was given, returns undefined otherwise. */
function createEmbed(sageCommand: SageCommand, embedContent?: string): MessageEmbed | undefined {
	return embedContent?.trim() ? createMessageEmbed({ description:embedContent, color:sageCommand.toDiscordColor(ColorType.Dice) }) : undefined;
}

/** This function sends each dice roll to the channel as its own post. */
export async function sendDiceToMultiple(sageCommand: SageCommand, formattedOutputs: FormattedDiceOutput[], targetChannel: DMessageChannel, gmTargetChannel: Optional<DMessageTarget>): Promise<void> {
	const isSageMessage = sageCommand.isSageMessage();
	const hasSecret = formattedOutputs.filter(output => output.hasSecret).length > 0;
	const allSecret = formattedOutputs.filter(output => output.hasSecret).length === formattedOutputs.length;
	const publicMentionLine = await createMentionLine(sageCommand);
	const secretMentionLine = await createMentionLine(sageCommand, true);
	const secretReferenceLink = isSageMessage ? toMessageUrl(sageCommand.message) : ``;
	const sageCache = sageCommand.sageCache;

	let doGmMention = hasSecret && !!gmTargetChannel;
	let doMention = !allSecret;

	for (const formattedOutput of formattedOutputs) {
		const embed = createEmbed(sageCommand, formattedOutput.embedContent);
		const embeds = embed ? [embed] : [];

		// handle secret dice with a gm channel
		if (formattedOutput.hasSecret && gmTargetChannel) {
			// prepend the gm mention if we haven't done so yet
			const gmPostContent = doGmMention ? `${secretMentionLine}\n${formattedOutput.postContent}` : formattedOutput.postContent!;

			// stop us from doing gm mention again
			doGmMention = false;

			// send the gm message
			await sendTo({ target: gmTargetChannel, content: gmPostContent.trim(), embeds, sageCache }, { });

			if (!allSecret) {
				// prepend the player mention if we haven't done so yet
				const notificationContent = doMention ? `${publicMentionLine} ${secretReferenceLink}\n${formattedOutput.notificationContent}` : formattedOutput.notificationContent;

				// stop use from doing player mention again
				doMention = false;

				// send the player message
				await sendTo({ target: targetChannel, content: notificationContent.trim(), sageCache }, { });
			}

		// handle all other dice
		} else {
			// prepend the mention if we haven't done so yet
			const postContent = doMention ? `${publicMentionLine}\n${formattedOutput.postContent}` : formattedOutput.postContent!;

			// stop use from doing it again
			doMention = false;

			// send the message
			await sendTo({ target: targetChannel, content: postContent.trim(), embeds, sageCache }, { });
		}
	}
	if (allSecret && isSageMessage) {
		/** @todo if the dice came from a dialog command then the original message will be deleted and the user will not see this reaction */
		await sageCommand.reactDie();
	}
}