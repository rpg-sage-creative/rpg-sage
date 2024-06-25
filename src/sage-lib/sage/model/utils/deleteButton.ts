import type { Optional, Snowflake } from "@rsc-utils/core-utils";
import { DiscordApiError, toChannelMention, toUserMention } from "@rsc-utils/discord-utils";
import { isNotBlank } from "@rsc-utils/string-utils";
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, Message, type ActionRowData, type BaseMessageOptions, type ButtonComponentData, type InteractionReplyOptions, type MessageCreateOptions, type MessageEditOptions } from "discord.js";
import { deleteMessage } from "../../../discord/deletedMessages.js";
import { registerInteractionListener } from "../../../discord/handlers.js";
import type { SageInteraction } from "../SageInteraction.js";

type ButtonOptions = { style?:ButtonStyle; emoji?:string; label?:string; };

function getCustomIdRegex(): RegExp {
	return /^rpg-sage-message-delete-button-(?<userId>\d{16,})$/;
}

function createCustomId(userId: Snowflake): string {
	return `rpg-sage-message-delete-button-${userId}`;
}

function isMatchingCustomId(customId: string, userId: Snowflake): boolean {
	return getUserId(customId) === userId;
}

function getUserId(customId: string): Snowflake | undefined {
	return getCustomIdRegex().exec(customId)?.groups?.userId as Snowflake;
}

export function createMessageDeleteButton(userId: Snowflake, options?: ButtonOptions): ButtonBuilder {

	/** @todo update all Sage "delete" icons to use custom trashcan or wastebin emoji 🗑️ instead of ❌ */
	return new ButtonBuilder()
		.setCustomId(createCustomId(userId))
		.setStyle(options?.style ?? ButtonStyle.Secondary)
		.setEmoji(isNotBlank(options?.emoji) ? options.emoji : "❌")
		.setLabel(isNotBlank(options?.label) ? options.label : "Delete this alert.");
}

/**
 * Creates a MessageActionRow containing one Delete button.
 * The button responds only the given user and deletes the message the button is attached to.
 */
export function createMessageDeleteButtonRow(userId: Snowflake, options?: ButtonOptions): ActionRowBuilder<ButtonBuilder> {
	return new ActionRowBuilder<ButtonBuilder>().addComponents(createMessageDeleteButton(userId, options));
}

/**
 * Creates an array of MessageActionRows that with one MessageActionRow containing one Delete button.
 * The button responds only the given user and deletes the message the button is attached to.
 */
export function createMessageDeleteButtonComponents(userId: Snowflake, options?: ButtonOptions): ActionRowBuilder<ButtonBuilder>[] {
	return [createMessageDeleteButtonRow(userId, options)];
}

function hasDeleteButton(message: Message | MessageEditOptions | MessageCreateOptions | InteractionReplyOptions, userId: Snowflake): boolean {
	return message?.components?.some(row =>
		(row as ActionRowData<ButtonComponentData>).components.some(btn =>
			"customId" in btn && isMatchingCustomId(btn.customId ?? "", userId)
		)
	) ?? false;
}

/** Adds a Delete button to the given message that responds only the given user and deletes the attached message. */
export async function addMessageDeleteButton(message: Optional<Message>, userId: Snowflake, options?: ButtonOptions): Promise<boolean> {
	if (message?.editable && !hasDeleteButton(message, userId)) {
		const components = (message.components ?? []).concat(createMessageDeleteButtonComponents(userId, options) as any);
		const content = message.content ? message.content : undefined;
		const embeds = message.embeds;
		const files = [...message.attachments.values()];
		const edited = await message.edit({ components, content, embeds, files }).catch(DiscordApiError.process);
		return edited !== null;
	}
	return false;
}

export function includeDeleteButton<T extends BaseMessageOptions | InteractionReplyOptions>(args: T, userId: Snowflake, btnOptions?: ButtonOptions): T {
	if (hasDeleteButton(args, userId)) return args; //NOSONAR

	const components = (args.components ?? []).concat(createMessageDeleteButtonComponents(userId, btnOptions));
	const content = args.content ? args.content : undefined;
	return { ...args, components, content } as T;
}

/** Checks the interaction for the customId used for deleting messages. */
function messageDeleteButtonTester(sageInteraction: SageInteraction<ButtonInteraction>): boolean {
	if (sageInteraction.interaction.isButton()) {
		const customId = sageInteraction.interaction.customId;
		const buttonUserId = getUserId(customId);
		if (buttonUserId) {
			// always let the button's user delete it
			const actorId = sageInteraction.user.id;
			if (buttonUserId === actorId) {
				return true;
			}

			// let's let admin/gm types clean up channels
			return sageInteraction.game
				? sageInteraction.canAdminGame
				: sageInteraction.canAdminServer;
		}
	}
	return false;
}

/** Handles the interaction used for deleting messages. */
async function messageDeleteButtonHandler(sageInteraction: SageInteraction<ButtonInteraction>): Promise<void> {
	const customId = sageInteraction.interaction.customId;
	const actorId = sageInteraction.user.id as Snowflake;
	const buttonUserId = getUserId(customId)!;

	const message = sageInteraction.interaction.message;

	// if this isn't the user, then let's send the user a DM to let them know
	if (actorId !== buttonUserId) {
		const channel = toChannelMention(sageInteraction.interaction.channelId as Snowflake);
		const actor = toUserMention(actorId);
		const buttonUser = await sageInteraction.discord.fetchUser(buttonUserId);
		const content = [
			`A message from RPG Sage to you was deleted in ${channel} by ${actor}.`,
			message.content ? `### Content\n${message.content}` : "",
			...message.embeds.map((embed, index) => `### Embed #${index + 1}\n${embed.description}`)
		].filter(s => s).join("\n");
		const sendArgs = includeDeleteButton({ content }, buttonUserId);
		await buttonUser?.send(sendArgs);
	}

	// delete the message
	await deleteMessage(message);
}

export function registerDeleteButtonHandler(): void {
	registerInteractionListener(messageDeleteButtonTester, messageDeleteButtonHandler);
}