import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, Interaction, Message } from "discord.js";
import utils, { UUID } from "../../sage-utils";
import type { DMessageTarget } from "../../sage-utils/utils/DiscordUtils";
import { resolveToEmbeds } from "../../sage-utils/utils/DiscordUtils/embeds";
import type { TRenderableContentResolvable } from "../../sage-utils/utils/RenderUtils/RenderableContent";
import ActiveBot from "../sage/model/ActiveBot";
import type SageCache from "../sage/model/SageCache";
import type SageInteraction from "../sage/model/SageInteraction";
import type SageMessage from "../sage/model/SageMessage";

const TIMEOUT_MILLI = 60 * 1000;

export type TPromptButton = { label:string; style:ButtonStyle; };

function createButtons(buttons: TPromptButton[]): Map<UUID, ButtonBuilder> {
	const map = new Map<UUID, ButtonBuilder>();
	buttons.forEach(button => {
		const uuid = utils.UuidUtils.generate();
		const buttonBuilder = new ButtonBuilder();
		buttonBuilder.setCustomId(uuid);
		buttonBuilder.setLabel(button.label);
		buttonBuilder.setStyle(button.style);
		map.set(uuid, buttonBuilder);
	});
	return map;
}

export async function discordPromptYesNo(sageMessage: SageMessage, resolvable: TRenderableContentResolvable): Promise<boolean | null> {
	const yesNo: TPromptButton[] = [{ label:"Yes", style:ButtonStyle.Success }, { label:"No", style:ButtonStyle.Secondary }];
	const result = await prompt(sageMessage, resolvable, yesNo);
	if (result) {
		return result === "Yes";
	}
	return null;
}

export async function discordPromptYesNoDeletable(hasSageCache: SageMessage | SageInteraction, resolvable: TRenderableContentResolvable): Promise<[boolean | null, Message | null]> {
	const yesNo: TPromptButton[] = [{ label:"Yes", style:ButtonStyle.Success}, { label:"No", style:ButtonStyle.Secondary }];
	const channel = hasSageCache.dChannel;
	if (channel && channel.type !== ChannelType.GuildForum) {
		const [result, message] = await _prompt(hasSageCache.sageCache, resolvable, yesNo, channel);
		if (result) {
			return [result === "Yes", message];
		}
		return [null, message];
	}
	return [null, null];
}

export async function prompt(sageMessage: SageMessage, resolvable: TRenderableContentResolvable, buttons: TPromptButton[]): Promise<string | null> {
	const [value] = await _prompt(sageMessage.sageCache, resolvable, buttons, sageMessage.message.channel);
	return value;
}

export async function _prompt(sageCache: SageCache, resolvable: TRenderableContentResolvable, buttons: TPromptButton[], targetChannel: DMessageTarget): Promise<[string | null, Message | null]> {
	return new Promise<[string | null, Message | null]>(async resolve => {
		const buttonRow = new ActionRowBuilder<ButtonBuilder>();
		const messageButtons = createButtons(buttons);
		buttonRow.setComponents(...messageButtons.values());

		// send the message
		const embeds = resolveToEmbeds(resolvable, sageCache.getFormatter());
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
			if (interaction.isButton() && interaction.user.id === sageCache.actor.did) {
				const btn = messageButtons.get(interaction.customId);
				if (btn) {
					interaction.deferUpdate();
					_resolve(btn.data.label!);
				}
			}
		};
		ActiveBot.active.client.on("interactionCreate", handler);
	})
	.catch(reason => {
		console.error(reason);
		return [null, null];
	});
}
