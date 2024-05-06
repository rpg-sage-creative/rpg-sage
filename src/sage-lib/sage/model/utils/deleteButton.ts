import { handleDiscordErrorReturnNull, type DMessage } from "@rsc-utils/discord-utils";
import type { Optional } from "@rsc-utils/type-utils";
import { MessageActionRow, MessageButton, type ButtonInteraction, type MessageActionRowComponent, type Snowflake } from "discord.js";
import { registerInteractionListener } from "../../../discord/handlers.js";
import type { SageInteraction } from "../SageInteraction.js";

export function createMessageDeleteButton(userId: Snowflake): MessageButton {
	/** @todo update all Sage "delete" icons to use custom trashcan or wastebin emoji 🗑️ instead of ❌ */
	return new MessageButton({
		customId: `rpg-sage-message-delete-button-${userId}`,
		style: "SECONDARY",
		emoji: "❌",
		label: "Delete this alert.",
		type: "BUTTON"
	});
}

/**
 * Creates a MessageActionRow containing one Delete button.
 * The button responds only the given user and deletes the message the button is attached to.
 */
export function createMessageDeleteButtonRow(userId: Snowflake): MessageActionRow<MessageActionRowComponent> {
	return new MessageActionRow<MessageButton>().addComponents(createMessageDeleteButton(userId));
}

/**
 * Creates an array of MessageActionRows that with one MessageActionRow containing one Delete button.
 * The button responds only the given user and deletes the message the button is attached to.
 */
export function createMessageDeleteButtonComponents(userId: Snowflake): MessageActionRow<MessageActionRowComponent>[] {
	return [createMessageDeleteButtonRow(userId)];
}

/** Adds a Delete button to the given message that responds only the given user and deletes the attached message. */
export async function addMessageDeleteButton(message: Optional<DMessage>, userId: Snowflake): Promise<boolean> {
	if (message?.editable) {
		const components = (message.components ?? []).concat(createMessageDeleteButtonComponents(userId));
		const content = message.content ? message.content : undefined;
		const embeds = message.embeds;
		const files = [...message.attachments.values()];
		const edited = await message.edit({ components, content, embeds, files }).catch(handleDiscordErrorReturnNull);
		return edited !== null;
	}
	return false;
}

/** Checks the interaction for the customId used for deleting messages. */
function messageDeleteButtonTester(sageInteraction: SageInteraction<ButtonInteraction>): boolean {
	if (sageInteraction.interaction.isButton()) {
		const customId = sageInteraction.interaction.customId;
		const regex = /^rpg-sage-message-delete-button-(\d{16,})$/;
		const [_, userId] = regex.exec(customId) ?? [];
		if (userId) {
			return sageInteraction.user.id === userId;
		}
	}
	return false;
}

/** Handles the interaction used for deleting messages. */
async function messageDeleteButtonHandler(sageInteraction: SageInteraction<ButtonInteraction>): Promise<void> {
	const message = sageInteraction.interaction.message as DMessage;
	if (message.deletable) {
		await message.delete();
	}
}

export function registerDeleteButtonHandler(): void {
	registerInteractionListener(messageDeleteButtonTester, messageDeleteButtonHandler);
}