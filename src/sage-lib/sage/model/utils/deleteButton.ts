import { MessageActionRow, MessageButton, type ButtonInteraction, type Snowflake } from "discord.js";
import type { Optional } from "../../../../sage-utils";
import { handleDiscordErrorReturnNull } from "../../../../sage-utils/utils/DiscordUtils/errorHandlers";
import type { DMessage } from "../../../discord";
import { registerInteractionListener } from "../../../discord/handlers";
import type SageInteraction from "../SageInteraction";

export async function addMessageDeleteButton(message: Optional<DMessage>, userId: Snowflake): Promise<boolean> {
	if (message?.editable) {
		const buttonRow = new MessageActionRow<MessageButton>().addComponents(new MessageButton({ customId:`message-delete-button-${message.id}-${userId}`, style:"SECONDARY", emoji:"❌", label:"Delete this alert." }));
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
	const customId = sageInteraction.interaction.customId;
	const regex = /^message-delete-button-(\d{16,})-(\d{16,})$/;
	const match = regex.exec(customId) ?? [];
	return sageInteraction.interaction.message.id === match[1]
		&& sageInteraction.user.id === match[2];
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