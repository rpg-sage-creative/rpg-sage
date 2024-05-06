import { error } from "@rsc-utils/console-utils";
import type { DMessageChannel, DMessageTarget } from "@rsc-utils/discord-utils";
import type { RenderableContentResolvable } from "@rsc-utils/render-utils";
import { randomSnowflake } from "@rsc-utils/snowflake-utils";
import { MessageActionRow, MessageButton, type Interaction, type Message, type MessageButtonStyle } from "discord.js";
import { ActiveBot } from "../sage/model/ActiveBot.js";
import type { SageCache } from "../sage/model/SageCache.js";
import type { SageCommand } from "../sage/model/SageCommand.js";
import type { SageMessage } from "../sage/model/SageMessage.js";
import { resolveToEmbeds } from "./resolvers/resolveToEmbeds.js";

const TIMEOUT_MILLI = 60 * 1000;

export type TPromptButton = { label:string; style:MessageButtonStyle; };

function createButtons(buttons: TPromptButton[]): MessageButton[] {
	return buttons.map(button => {
		const messageButton = new MessageButton();
		messageButton.setCustomId(randomSnowflake());
		messageButton.setLabel(button.label);
		messageButton.setStyle(button.style);
		return messageButton;
	});
}

type ConfirmOptions = { cancelLabel?:string; confirmLabel?:string; content:RenderableContentResolvable; };
type ConfirmResults = { confirmed:boolean; message?:Message; };
export async function confirm(sageCommand: SageCommand, options: ConfirmOptions): Promise<ConfirmResults> {
	const content = options?.content ?? "Confirm or Cancel?";
	const confirmLabel = options?.confirmLabel ?? "Confirm";
	const cancelLabel = options?.cancelLabel ?? "Cancel";
	const buttons: TPromptButton[] = [ { label:confirmLabel, style:"SUCCESS" }, { label:cancelLabel, style:"SECONDARY" } ];
	const channel = sageCommand.dChannel as DMessageChannel;
	const [result, message] = await _prompt(sageCommand.sageCache, content, buttons, channel);
	return {
		confirmed: result === confirmLabel,
		message: message ?? undefined
	};
}

export async function discordPromptYesNo(sageCommand: SageCommand, resolvable: RenderableContentResolvable): Promise<boolean | null> {
	const yesNo: TPromptButton[] = [{ label:"Yes", style:"SUCCESS"}, { label:"No", style:"SECONDARY" }];
	const result = await prompt(sageCommand, resolvable, yesNo);
	if (result) {
		return result === "Yes";
	}
	return null;
}

export async function discordPromptYesNoDeletable(sageCommand: SageCommand, resolvable: RenderableContentResolvable): Promise<[boolean | null, Message | null]> {
	const yesNo: TPromptButton[] = [{ label:"Yes", style:"SUCCESS"}, { label:"No", style:"SECONDARY" }];
	const channel = sageCommand.isSageInteraction() ? sageCommand.interaction.channel : (sageCommand as SageMessage).message.channel;
	const [result, message] = await _prompt(sageCommand.sageCache, resolvable, yesNo, channel as DMessageChannel);
	if (result) {
		return [result === "Yes", message];
	}
	return [null, message];
}

export async function prompt(sageCommand: SageCommand, resolvable: RenderableContentResolvable, buttons: TPromptButton[]): Promise<string | null> {
	const channel = sageCommand.isSageInteraction() ? sageCommand.interaction.channel : (sageCommand as SageMessage).message.channel;
	const [value] = await _prompt(sageCommand.sageCache, resolvable, buttons, channel);
	return value;
}

export async function _prompt(sageCache: SageCache, resolvable: RenderableContentResolvable, buttons: TPromptButton[], targetChannel: DMessageTarget): Promise<[string | null, Message | null]> {
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
