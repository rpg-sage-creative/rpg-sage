import type { Optional } from "@rsc-utils/core-utils";
import type { Channel, DiscordAPIError, Interaction, Message, PartialMessage, User } from "discord.js";
import type { DiscordApiError } from "../../DiscordApiError.js";

export function isMessage<T extends Message | PartialMessage>(value: Optional<Channel | Interaction | T | User | DiscordAPIError | DiscordApiError>): value is T {
	return value ? "author" in value : false;
}