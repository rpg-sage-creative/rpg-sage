import { unwrap, type Optional } from "@rsc-utils/core-utils";
import type { Channel, MessageReference } from "discord.js";
import type { MessageOrPartial } from "../types/types.js";
import { getDiscordUrlRegex } from "./getDiscordUrlRegex.js";

type ReferenceType = "channel" | "message";

function parseString(url: string, type: ReferenceType): MessageReference | undefined {
	const regex = getDiscordUrlRegex({ type });
	const match = regex.exec(unwrap(url, "<>"));
	if (match?.groups) {
		// cast to MessageReference to allow guildId to be undefined
		let { guildId, channelId, messageId } = match.groups as unknown as MessageReference;

		// update guildId as needed
		if (guildId === "@me") {
			guildId = undefined;
		}

		return { guildId, channelId, messageId, type:0 };
	}
	return undefined;
}

function parseMessage(message: MessageOrPartial): MessageReference | undefined {
	return {
		guildId: message.guildId ?? undefined,
		channelId: message.channelId,
		messageId: message.id,
		type: 0
	};
}

function parseChannel(channel: Channel): MessageReference | undefined {
	return {
		guildId: "guildId" in channel ? channel.guildId ?? undefined : undefined,
		channelId: channel.id,
		messageId: undefined,
		type: 0
	};
}

/** Parses a discord message url into a MessageReference based on the type of url expected. */
export function parseReference(value: Optional<string>, type: ReferenceType): MessageReference | undefined;

/** Parses a discord Message or Channel into a MessageReference. */
export function parseReference(value: Optional<Channel | MessageOrPartial>): MessageReference | undefined;

export function parseReference(value: Optional<string | MessageOrPartial | Channel>, type?: ReferenceType): MessageReference | undefined {
	if (value) {
		if (typeof(value) === "string") return parseString(value, type ?? "message");
		if ("channelId" in value) return parseMessage(value);
		return parseChannel(value);
	}
	return undefined;
}