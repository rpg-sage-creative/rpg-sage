import { handleDiscordErrorReturnNull, type DMessage } from "@rsc-utils/discord-utils";
import type { Optional } from "@rsc-utils/type-utils";
import { MessageActionRow, MessageButton, type ButtonInteraction, type Snowflake } from "discord.js";
import { registerInteractionListener } from "../../../discord/handlers";
import type { SageInteraction } from "../SageInteraction";

export async function addMessageDeleteButton(message: Optional<DMessage>, userId: Snowflake): Promise<boolean> {
	if (message?.editable) {
		/** @todo update all Sage "delete" icons to use custom trashcan or wastebin emoji 🗑️ instead of ❌ */
		const buttonRow = new MessageActionRow<MessageButton>().addComponents(new MessageButton({ customId:`message-delete-button-${message.id}-${userId}`, style:"SECONDARY", emoji:"❌", label:"Delete this alert.", type:"BUTTON" }));
		const edited = await message.edit({
			components: (message.components ?? []) .concat([buttonRow as any]), /** @todo figure out this cast */
			content: message.content ? message.content : undefined,
			embeds: message.embeds
		}).catch(handleDiscordErrorReturnNull);
		return edited !== null;
	}
	return false;
}

function messageDeleteButtonTester(sageInteraction: SageInteraction<ButtonInteraction>): boolean {
	if (sageInteraction.interaction.isButton()) {
		const customId = sageInteraction.interaction.customId;
		const regex = /^message-delete-button-(\d{16,})-(\d{16,})$/;
		const match = regex.exec(customId) ?? [];
		return sageInteraction.interaction.message.id === match[1]
			&& sageInteraction.user.id === match[2];
	}
	return false;
}

async function messageDeleteButtonHandler(sageInteraction: SageInteraction<ButtonInteraction>): Promise<void> {
	const message = sageInteraction.interaction.message as DMessage;
	if (message.deletable) {
		await message.delete();
	}
}

export function registerDeleteButtonHandler(): void {
	registerInteractionListener(messageDeleteButtonTester, messageDeleteButtonHandler);
}