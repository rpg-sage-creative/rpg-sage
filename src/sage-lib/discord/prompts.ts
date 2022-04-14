import * as Discord from "discord.js";
import utils from "../../sage-utils";
import ActiveBot from "../sage/model/ActiveBot";
import type SageMessage from "../sage/model/SageMessage";
import { resolveToEmbeds } from "./embeds";
import type { TRenderableContentResolvable } from "./types";

const TIMEOUT_MILLI = 60 * 1000;

export type TPromptButton = { label:string; style:Discord.MessageButtonStyle; };

function createButtons(buttons: TPromptButton[]): Discord.MessageButton[] {
	return buttons.map(button => {
		const messageButton = new Discord.MessageButton();
		messageButton.setCustomId(utils.UuidUtils.generate());
		messageButton.setLabel(button.label);
		messageButton.setStyle(button.style);
		return messageButton;
	});
}

export async function discordPromptYesNo(sageMessage: SageMessage, resolvable: TRenderableContentResolvable): Promise<boolean | null> {
	const yesNo: TPromptButton[] = [{ label:"Yes", style:"SUCCESS"}, { label:"No", style:"SECONDARY" }];
	const result = await prompt(sageMessage, resolvable, yesNo);
	if (result) {
		return result === "Yes";
	}
	return null;
}

export async function prompt(sageMessage: SageMessage, resolvable: TRenderableContentResolvable, buttons: TPromptButton[]): Promise<string | null> {
	return new Promise<string | null>(async resolve => {
		const buttonRow = new Discord.MessageActionRow();
		const messageButtons = createButtons(buttons);
		buttonRow.setComponents(...messageButtons);

		// send the message
		const embeds = resolveToEmbeds(sageMessage.caches, resolvable);
		const components = [buttonRow];
		const message = sageMessage.message.channel.send({ embeds, components });

		// create timeout and handler variables to ensure access in the following functions
		let timeout: NodeJS.Timeout;
		let handler: (interaction: Discord.Interaction) => void;

		// create shared resolve function
		const _resolve = (value: string | null) => {
			resolve(value);
			messageButtons.forEach(btn => btn.setDisabled(true));
			message.then(msg => msg.edit({ embeds, components }));
			ActiveBot.active.client.off("interactionCreate", handler);
			clearTimeout(timeout);
		};

		// set timeout to remove this unique handler and resolve to null
		timeout = setTimeout(() => {
			_resolve(null);
		}, TIMEOUT_MILLI);

		// create unique handler and listen to it
		handler = (interaction: Discord.Interaction) => {
			if (interaction.isButton()) {
				const btn = messageButtons.find(_btn => interaction.customId === _btn.customId);
				if (btn) {
					interaction.deferUpdate();
					_resolve(btn.label);
				}
			}
		};
		ActiveBot.active.client.on("interactionCreate", handler);
	})
	.catch(utils.ConsoleUtils.Catchers.errorReturnNull);
}
