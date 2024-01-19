import { error } from "@rsc-utils/console-utils";
import { randomUuid } from "@rsc-utils/uuid-utils";
import { MessageActionRow, MessageButton, type Interaction, type Message, type MessageButtonStyle } from "discord.js";
import { ActiveBot } from "../sage/model/ActiveBot";
import type { SageCache } from "../sage/model/SageCache";
import type { SageInteraction } from "../sage/model/SageInteraction";
import { SageMessage } from "../sage/model/SageMessage";
import { resolveToEmbeds } from "./embeds";
import type { DUser, TChannel, TRenderableContentResolvable } from "./types";

const TIMEOUT_MILLI = 60 * 1000;

export type TPromptButton = { label:string; style:MessageButtonStyle; };

function createButtons(buttons: TPromptButton[]): MessageButton[] {
	return buttons.map(button => {
		const messageButton = new MessageButton();
		messageButton.setCustomId(randomUuid());
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

export async function discordPromptYesNoDeletable(hasSageCache: SageMessage | SageInteraction, resolvable: TRenderableContentResolvable): Promise<[boolean | null, Message | null]> {
	const yesNo: TPromptButton[] = [{ label:"Yes", style:"SUCCESS"}, { label:"No", style:"SECONDARY" }];
	const channel = hasSageCache instanceof SageMessage ? hasSageCache.message.channel : hasSageCache.interaction.channel;
	const [result, message] = await _prompt(hasSageCache.caches, resolvable, yesNo, channel as TChannel);
	if (result) {
		return [result === "Yes", message];
	}
	return [null, message];
}

export async function prompt(sageMessage: SageMessage, resolvable: TRenderableContentResolvable, buttons: TPromptButton[]): Promise<string | null> {
	const [value] = await _prompt(sageMessage.caches, resolvable, buttons, sageMessage.message.channel as TChannel);
	return value;
}

export async function _prompt(sageCache: SageCache, resolvable: TRenderableContentResolvable, buttons: TPromptButton[], targetChannel: TChannel | DUser): Promise<[string | null, Message | null]> {
	return new Promise<[string | null, Message | null]>(async resolve => {
		const buttonRow = new MessageActionRow();
		const messageButtons = createButtons(buttons);
		buttonRow.setComponents(...messageButtons);

		// send the message
		const embeds = resolveToEmbeds(sageCache, resolvable);
		const components = [buttonRow];
		const message = await targetChannel.send({ embeds, components });

		// create timeout and handler variables to ensure access in the following functions
		let timeout: NodeJS.Timeout;
		let handler: (interaction: Interaction) => void;

		// create shared resolve function
		const _resolve = (value: string | null) => {
			resolve([value, message]);
			messageButtons.forEach(btn => btn.setDisabled(true));
			message.edit({ embeds, components });
			ActiveBot.active.client.off("interactionCreate", handler);
			clearTimeout(timeout);
		};

		// set timeout to remove this unique handler and resolve to null
		timeout = setTimeout(() => {
			_resolve(null);
		}, TIMEOUT_MILLI);

		// create unique handler and listen to it
		handler = (interaction: Interaction) => {
			if (interaction.isButton() && interaction.user.id === sageCache.userDid) {
				const btn = messageButtons.find(_btn => interaction.customId === _btn.customId);
				if (btn) {
					interaction.deferUpdate();
					_resolve(btn.label);
				}
			}
		};
		ActiveBot.active.client.on("interactionCreate", handler);
	})
	.catch(reason => {
		error(reason);
		return [null, null];
	});
}
