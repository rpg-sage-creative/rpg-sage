import type { Optional } from "@rsc-utils/core-utils";
import type { Message, MessageActionRowComponent } from "discord.js";
import type { SPartialMessage } from "../types/types.js";
import { getActionRows } from "./getActionRows.js";

export function findComponent<T extends MessageActionRowComponent>(message: Optional<Message | SPartialMessage>, customId: string): T | undefined {
	const actionRows = getActionRows(message);
	if (actionRows.length) {
		for (const row of actionRows) {
			for (const component of row.components) {
				if (component.customId === customId) {
					return component as T;
				}
			}
		}
	}
	return undefined;
}