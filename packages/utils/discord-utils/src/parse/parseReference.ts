import type { Optional } from "@rsc-utils/core-utils";
import { unwrap } from "@rsc-utils/string-utils";
import type { MessageReference } from "discord.js";
import { createDiscordUrlRegex } from "./createDiscordUrlRegex.js";

type ReferenceType = "channel" | "message";

/** Parses a discord message url into a MessageReference. */
export function parseReference(url: Optional<string>, type: ReferenceType): MessageReference | undefined {
	if (url) {
		const regex = createDiscordUrlRegex(type);
		const match = regex.exec(unwrap(url, "<>"));
		if (match?.groups) {
			// cast to MessageReference to allow guildId to be undefined
			let { guildId, channelId, messageId } = match.groups as unknown as MessageReference;

			// update guildId as needed
			if (guildId === "@me") {
				guildId = undefined;
			}

			return { guildId, channelId, messageId };
		}
	}
	return undefined;
}