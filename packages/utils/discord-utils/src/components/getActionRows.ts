import type { Optional } from "@rsc-utils/core-utils";
import { ComponentType, type ActionRow, type Message, type MessageActionRowComponent } from "discord.js";
import type { SPartialMessage } from "../types/types.js";

export function getActionRows(message: Optional<Message | SPartialMessage>): ActionRow<MessageActionRowComponent>[] {
	return message?.components.filter(tlc => tlc.type === ComponentType.ActionRow) ?? [];
}