import { toMessageUrl, type DMessageChannel, type DMessageTarget } from "@rsc-utils/discord-utils";
import type { Optional } from "@rsc-utils/type-utils";
import type { ColorResolvable } from "discord.js";
import { sendTo } from "../../../discord/sendTo.js";
import { ColorType } from "../../model/HasColorsCore.js";
import type { SageCommand } from "../../model/SageCommand.js";
import type { FormattedDiceOutput } from "./FormattedDiceOutput.js";
import { createMentionLine } from "./createMentionLine.js";


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

	const splitOptions = { embedColor:sageCommand.toDiscordColor(ColorType.Dice) as ColorResolvable ?? undefined };
	for (const formattedOutput of formattedOutputs) {
		// handle secret dice with a gm channel
		if (formattedOutput.hasSecret && gmTargetChannel) {
			// prepend the gm mention if we haven't done so yet
			const gmPostContent = doGmMention ? `${secretMentionLine}\n${formattedOutput.postContent}` : formattedOutput.postContent!;

			// stop us from doing gm mention again
			doGmMention = false;

			// send the gm message
			await sendTo({ target: gmTargetChannel, content: gmPostContent.trim(), embedContent:formattedOutput.embedContent, sageCache }, splitOptions);

			if (!allSecret) {
				// prepend the player mention if we haven't done so yet
				const notificationContent = doMention ? `${publicMentionLine} ${secretReferenceLink}\n${formattedOutput.notificationContent}` : formattedOutput.notificationContent;

				// stop use from doing player mention again
				doMention = false;

				// send the player message
				await sendTo({ target: targetChannel, content: notificationContent.trim(), sageCache }, splitOptions);
			}

		// handle all other dice
		} else {
			// prepend the mention if we haven't done so yet
			const postContent = doMention ? `${publicMentionLine}\n${formattedOutput.postContent}` : formattedOutput.postContent!;

			// stop use from doing it again
			doMention = false;

			// send the message
			await sendTo({ target: targetChannel, content: postContent.trim(), embedContent:formattedOutput.embedContent, sageCache }, splitOptions);
		}
	}
	if (allSecret && isSageMessage) {
		/** @todo if the dice came from a dialog command then the original message will be deleted and the user will not see this reaction */
		await sageCommand.reactDie();
	}
}