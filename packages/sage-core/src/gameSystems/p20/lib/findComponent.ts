import { findComponent as _findComponent } from "@rsc-utils/discord-utils";
import type { Message, MessageActionRowComponent } from "discord.js";
import type { SageCommand } from "../../../sage-lib/sage/model/SageCommand.js";

export type MessagesOrSageCommand = SageCommand | Message | (SageCommand | Message)[];

/** Fetches the message. */
export async function fetchMessage(arg: SageCommand | Message): Promise<Message | undefined> {
	if ("isSageMessage" in arg) {
		return arg.fetchMessage();
	}
	if (arg.partial) {
		return arg.fetch();
	}
	return arg;
}

/** Finds the component for the given customId. */
export async function findComponent<T extends MessageActionRowComponent>(input: MessagesOrSageCommand, customId: string): Promise<T | undefined> {
	const array = Array.isArray(input) ? input : [input];
	for (const item of array) {
		const message = await fetchMessage(item);
		const component = _findComponent(message, customId);
		if (component) {
			return component as T;
		}
	}
	return undefined;
}