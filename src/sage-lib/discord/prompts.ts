import { EphemeralMap } from "@rsc-utils/cache-utils";
import { error, errorReturnFalse, errorReturnNull, randomSnowflake, type Snowflake } from "@rsc-utils/core-utils";
import { createActionRow } from "@rsc-utils/discord-utils";
import type { RenderableContentResolvable } from "@rsc-utils/render-utils";
import { ButtonBuilder, ButtonStyle, ComponentType, type APIButtonComponentWithCustomId, type Interaction, type Message } from "discord.js";
import { ActiveBot } from "../sage/model/ActiveBot.js";
import type { SageCommand } from "../sage/model/SageCommand.js";
import { deleteMessage } from "./deletedMessages.js";
import { resolveToContent } from "./resolvers/resolveToContent.js";
import { resolveToEmbeds } from "./resolvers/resolveToEmbeds.js";

const TIMEOUT_MILLI = 60 * 1000;

export type TPromptButton<T = any> = { label:string; style:ButtonStyle; data?:T; };

type NonLinkButtonBuilder = ButtonBuilder & { data:APIButtonComponentWithCustomId; };

function createButtons(buttons: TPromptButton[]): NonLinkButtonBuilder[] {
	return buttons.map(button => {
		const messageButton = new ButtonBuilder();
		messageButton.setCustomId(randomSnowflake());
		messageButton.setLabel(button.label);
		messageButton.setStyle(button.style);
		return messageButton as NonLinkButtonBuilder;
	});
}

type ConfirmOptions = {
	cancelLabel?:string;
	confirmLabel?:string;
	/** The content to render with the prompt. */
	content?: RenderableContentResolvable;
	/** Delete the prompt after a yes/no click */
	deleteAfter?: boolean;
};

export async function confirm(sageCommand: SageCommand, options: ConfirmOptions): Promise<boolean | null> {
	const content = options?.content ?? "Confirm or Cancel?";
	const confirmLabel = options?.confirmLabel ?? "Confirm";
	const cancelLabel = options?.cancelLabel ?? "Cancel";
	const buttons: TPromptButton[] = [ { label:confirmLabel, style:ButtonStyle.Success }, { label:cancelLabel, style:ButtonStyle.Secondary } ];
	const deleteAfter = options?.deleteAfter;
	const results = await prompt({ sageCommand, content, buttons, deleteAfter });
	return results?.value ? results.value === confirmLabel : null;
}

export async function discordPromptYesNo(sageCommand: SageCommand, resolvable: RenderableContentResolvable, deleteAfter?: boolean): Promise<boolean | null> {
	return confirm(sageCommand, { content:resolvable, confirmLabel:"Yes", cancelLabel:"No", deleteAfter }).catch(errorReturnFalse);
}

type PromptArgs = {
	buttons: TPromptButton[];
	content?: RenderableContentResolvable;
	deleteAfter?: boolean;
	embeds?: RenderableContentResolvable[];
	sageCommand: SageCommand;
};

type PromptResults = {
	/** label of the button clicked, null if a timeout occurred */
	value: string | null;
	/** data associated with the button, if any */
	data?: unknown;
};

type PromptButtonData = {
	customId: Snowflake;
	label: string;
	data?: unknown;
};
type PromptMessageSentData = {
	message?: Message;
	buttons: PromptButtonData[];
};

/** Creates and sends the prompt message. */
async function sendPromptMessage(args: PromptArgs): Promise<PromptMessageSentData | undefined> {
	const { sageCommand } = args;

	// ensure channel before going further (should never be a problem, but just in case)
	const { dChannel, sageCache } = sageCommand;
	if (!dChannel) {
		return undefined;
	}

	// format content
	const content = args.content ? resolveToContent(sageCache, args.content).join("\n") : undefined;

	// create embeds
	const embeds = args.embeds?.map(embed => resolveToEmbeds(sageCache, embed)).flat() ?? [];

	// create buttons/components
	const messageButtons = createButtons(args.buttons);
	const buttonRow = createActionRow(...messageButtons);
	const components = [buttonRow];

	// send message
	const message = await dChannel.send({ content, embeds, components }).catch(errorReturnNull);
	if (message) {
		// map button data only if successful
		const buttons = args.buttons.map(({ label, data }, index) => {
			const customId = messageButtons[index].data.custom_id as Snowflake;
			return { customId, label, data };
		});
		return { message, buttons };
	}

	return undefined;
}

/** Disables/deletes a prompt message. */
async function disablePromptMessage(message: Message, deleteInstead: boolean | undefined): Promise<void> {
	if (deleteInstead) {
		await deleteMessage(message);
	}else {
		message.components.forEach(row => {
			row.components.forEach(comp => {
				if (comp.type === ComponentType.Button) {
					ButtonBuilder.from(comp).setDisabled(true);
				}
			});
		});
		await message.edit({ content:message.content, embeds:message.embeds, components:message.components });
	}
}

/** Called by handlePrompt or when an prompt times out. */
async function resolvePrompt(messageId: Snowflake, customId?: Snowflake): Promise<void> {
	const promptMap = getPromptMap();
	const promptData = promptMap.get(messageId);
	if (promptData) {
		const clickedButton = promptData.buttons.find(btn => btn.customId === customId);
		promptData.resolve({ value:clickedButton?.label ?? null, data:clickedButton?.data });
		disablePromptMessage(promptData.message, promptData.deleteAfter);
		clearTimeout(promptData.timeout);
	}
	promptMap.delete(messageId);
}

/** Tests the interactions to see if they are for a valid prompt's button. */
async function handlePrompt(interaction: Interaction): Promise<void> {
	// we know we are only dealing with buttons
	if (!interaction.isButton()) return; //NOSONAR

	// we know we store the prompt by messageId
	const messageId = interaction.message.id as Snowflake;
	const promptMap = getPromptMap();
	if (!promptMap.has(messageId)) return; //NOSONAR

	const promptData = promptMap.get(messageId);

	// we know we link the prompt to a user
	if (promptData?.userId !== interaction.user.id) return; //NOSONAR

	const { customId } = interaction;
	const btnData = promptData.buttons.find(btn => btn.customId === customId);

	// make sure this is a valid button
	if (!btnData) return; //NOSONAR

	await interaction.deferUpdate();

	await resolvePrompt(messageId, customId as Snowflake);
}

let _handling = false;

type PromptMapData = {
	buttons: PromptButtonData[];
	deleteAfter?: boolean;
	message: Message;
	resolve: (results: PromptResults) => void;
	timeout: NodeJS.Timeout;
	userId: Snowflake;
};

let _promptMap: EphemeralMap<Snowflake, PromptMapData>;
function getPromptMap() {
	return _promptMap ?? (_promptMap = new EphemeralMap(TIMEOUT_MILLI * 1.5));
}

export async function prompt(args: PromptArgs): Promise<PromptResults | null> {
	if (!_handling) {
		ActiveBot.client.on("interactionCreate", handlePrompt);
		_handling = true;
	}

	return new Promise<PromptResults | null>(async resolve => {
		const { message, buttons = [] } = await sendPromptMessage(args) ?? { };

		// if the message fails to send, we don't need anything that follows
		if (!message) {
			return resolve(null);
		}

		const promptMap = getPromptMap();
		promptMap.set(message.id as Snowflake, {
			buttons,
			deleteAfter: args.deleteAfter,
			message,
			resolve,
			timeout: setTimeout(resolvePrompt, TIMEOUT_MILLI, message.id as Snowflake),
			userId: args.sageCommand.authorDid
		});
	})
	.catch(reason => {
		error(reason);
		return null;
	});
}
