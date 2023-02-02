import { createDiscordEmojiRegex } from "../../sage-utils/utils/StringUtils";

export * as base from "./base";
export * as discord from "./discord";
export * as pf2e from "./pf2e";
export * as quest from "./quest";

/** Looks for text escaped with ` characters that contain emoji (:die: or <:die:12345>) and unescapes those emoji so they render correctly. */
export function correctEscapeForEmoji(value: string): string {
	return value.replace(/`[^`]+`/g, escapedValue =>
		escapedValue.replace(createDiscordEmojiRegex(true), emoji => `\`${emoji}\``)
	);
}
