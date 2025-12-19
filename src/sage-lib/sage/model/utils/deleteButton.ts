import { getSageId } from "@rsc-sage/env";
import { errorReturnUndefined, isNotBlank, type Optional, type Snowflake } from "@rsc-utils/core-utils";
import { DiscordApiError, toChannelMention, toMessageUrl, toUserMention } from "@rsc-utils/discord-utils";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Message, type ActionRowComponent, type ActionRowComponentData, type ActionRowData, type BaseMessageOptions, type InteractionReplyOptions, type MessageActionRowComponentBuilder, type MessageCreateOptions, type MessageEditOptions } from "discord.js";
import { getLocalizedText, type LocalizedTextKey } from "../../../../sage-lang/getLocalizedText.js";
import { deleteMessage, MessageDeleteResults } from "../../../discord/deletedMessages.js";
import { registerInteractionListener } from "../../../discord/handlers.js";
import type { SageCommand } from "../SageCommand.js";
import type { SageButtonInteraction } from "../SageInteraction.js";

type ButtonOptions = {
	customId?: string;
	style?: ButtonStyle;
	emoji?: string;
	label?: string;
};

/** Creates regex to test if the customId is a valid delete button customId. */
const CustomIdRegExp = /^rpg-sage-message-delete-button-(?<userId>\d{16,})$/;

/** Creates a delete button customId for the given userId. */
function createCustomId(userId: Snowflake): string {
	return `rpg-sage-message-delete-button-${userId}`;
}

/** Checks to see if the given customId is for the given userId. */
// function isMatchingCustomId(customId: string, userId: Snowflake): boolean {
// 	return getUserId(customId) === userId;
// }

/** Extracts the userId from a valid delete button customId. */
function getUserId(customId: string): Snowflake | undefined {
	return CustomIdRegExp.exec(customId)?.groups?.userId as Snowflake;
}

/**
 * Creates a "Delete" MessageButton.
 * The button responds only the given user or game/server admins and deletes the message the button is attached to.
 * Optionally, the customId, style, emoji, or label can be changed.
 * @deprecated use createMessageDeleteButton(sageCommand: SageCommand, options?: ButtonOptions)
 */
export function createMessageDeleteButton(userId: Snowflake, options?: ButtonOptions): ButtonBuilder;

/**
 * Creates a "Delete" MessageButton.
 * The button responds only the sageUser or game/server admins and deletes the message the button is attached to.
 * Optionally, the customId, style, emoji, or label can be changed.
 */
export function createMessageDeleteButton(sageCommand: SageCommand, options?: ButtonOptions): ButtonBuilder;

export function createMessageDeleteButton(commandOrUserId: SageCommand | Snowflake, options?: ButtonOptions): ButtonBuilder {
	const userId = typeof(commandOrUserId) === "string" ? commandOrUserId : commandOrUserId.actorId;
	const localizer = typeof(commandOrUserId) === "string" ? (key: LocalizedTextKey) => getLocalizedText(key, "en-US") : commandOrUserId.getLocalizer();

	/** @todo update all Sage "delete" icons to use custom trashcan or wastebin emoji 🗑️ instead of ❌ */
	return new ButtonBuilder()
		.setCustomId(options?.customId ?? createCustomId(userId))
		.setStyle(options?.style ?? ButtonStyle.Secondary)
		.setEmoji(isNotBlank(options?.emoji) ? options.emoji : "❌")
		.setLabel(isNotBlank(options?.label) ? options.label : localizer("DELETE_THIS_ALERT"));
}

/**
 * Creates a MessageActionRow containing one Delete button.
 * The button responds only the given user and deletes the message the button is attached to.
 */
export function createMessageDeleteButtonRow(userId: Snowflake, options?: ButtonOptions): ActionRowBuilder<ButtonBuilder> {
	return new ActionRowBuilder<ButtonBuilder>().addComponents(createMessageDeleteButton(userId, options));
}

/**
 * Creates an array of MessageActionRows with one MessageActionRow containing one Delete button.
 * The button responds only the given user and deletes the message the button is attached to.
 */
export function createMessageDeleteButtonComponents(userId: Snowflake, options?: ButtonOptions): ActionRowBuilder<ButtonBuilder>[] {
	return [createMessageDeleteButtonRow(userId, options)];
}

/** Checks all components to see if a valid delete button customId exists. */
function hasDeleteButton(message: Message | MessageEditOptions | MessageCreateOptions | InteractionReplyOptions, userId: Snowflake): boolean {
	const customId = createCustomId(userId);
	return message?.components?.some(row =>
		(row as ActionRowData<ActionRowComponent | ActionRowComponentData | MessageActionRowComponentBuilder>).components.some(componentOrBuilder => {
			const component = "toJSON" in componentOrBuilder ? componentOrBuilder.toJSON() : componentOrBuilder;
			if ("customId" in component) return component.customId === customId;
			if ("custom_id" in component) return component.custom_id === customId;
			return false;
		})
	) ?? false;
}

/** Adds a Delete button to the given message (after it is created) that responds only the given user and deletes the attached message. */
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

/** Adds a Delete button to the given options (before a message is created) that responds only the given user and deletes the attached message. */
export function includeDeleteButton<T extends BaseMessageOptions | InteractionReplyOptions>(args: T, userId: Snowflake, btnOptions?: ButtonOptions): T {
	if (hasDeleteButton(args, userId)) return args; //NOSONAR

	const components = (args.components ?? []).concat(createMessageDeleteButtonComponents(userId, btnOptions));
	const content = args.content ? args.content : undefined;
	return { ...args, components, content } as T;
}

/** Checks the interaction for the customId used for deleting messages. */
function messageDeleteButtonTester(sageInteraction: SageButtonInteraction): boolean {
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
async function messageDeleteButtonHandler(sageInteraction: SageButtonInteraction): Promise<void> {
	const localize = sageInteraction.getLocalizer();

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
			localize("MESSAGE_WAS_DELETED", channel, actor),
			message.content ? `### ${localize("CONTENT")}\n${message.content}` : "",
			...message.embeds.map((embed, index) => `### ${localize("EMBED")} #${index + 1}\n${embed.description}`)
		].filter(s => s).join("\n");
		const sendArgs = includeDeleteButton({ content }, buttonUserId);
		await buttonUser?.send(sendArgs);
	}

	// delete the message
	const result = await deleteMessage(message);
	if (result === MessageDeleteResults.NotDeletable) {
		let content = localize("UNABLE_TO_DELETE_MESSAGE_:", toMessageUrl(message));
		if (!message.channel.isDMBased()) {
			const perms = message.channel.permissionsFor(getSageId());
			if (perms) {
				if (perms.missing("ManageMessages")) {
					content += `\n- ${localize("SAGE_MISSING_S_PERM_IN_THAT_CHANNEL", "ManageMessages")}`;
				}
			}else {
				content += `\n- ${localize("SAGE_MISSING_ACCESS_TO_THAT_CHANNEL")}`;
			}
		}
		const dm = await sageInteraction.user.send({ content }).catch(errorReturnUndefined);
		if (!dm) {
			content += `\n*${localize("NOTE")}: ${localize("WE_TRIED_TO_DM_YOU")}*`;
			await sageInteraction.replyStack.whisper(content, { forceEphemeral:true });
		}
	}
}

export function registerDeleteButtonHandler(): void {
	registerInteractionListener(messageDeleteButtonTester, messageDeleteButtonHandler);
}