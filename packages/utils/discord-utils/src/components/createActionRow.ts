import { ActionRowBuilder, type MessageActionRowComponentBuilder } from "discord.js";

/** Convenience method for creating and type casting a new ActionRowBuilder. */
export function createActionRow<T extends MessageActionRowComponentBuilder>(...components: T[]): ActionRowBuilder<T> {
	return new ActionRowBuilder<T>().setComponents(...components);
}