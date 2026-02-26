import { InteractionType, type ClientEvents, type Interaction } from "discord.js";

export type ClientEventsKey = keyof ClientEvents;

export type ClientEvent = ClientEventsKey
	| `${ClientEventsKey}<${keyof typeof InteractionType}>`
	| `${ClientEventsKey}<${keyof typeof InteractionType}>(${string})`;

/** Creates a more specific clientEvent description for logging. */
export function createClientEventLabel(clientEvent: ClientEventsKey, interaction?: Interaction): ClientEvent {
	if (interaction) {
		const type = InteractionType[interaction.type];
		const commandName = "commandName" in interaction ? interaction.commandName : undefined;
		if (commandName) {
			return `${clientEvent}<${type}>(${commandName})` as ClientEventsKey;
		}
		return `${clientEvent}<${type}>` as ClientEventsKey;
	}
	return clientEvent;
}