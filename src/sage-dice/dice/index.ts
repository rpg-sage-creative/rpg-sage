import { createEmojiRegex } from "@rsc-utils/discord-utils";
import { tokenize } from "@rsc-utils/string-utils";

// export * as base from "./base";
// export * as cnc from "./cnc";
// export * as discord from "./discord";
// export * as dnd5e from "./dnd5e";
// export * as essence20 from "./essence20";
// export * as pf2e from "./pf2e";
// export * as quest from "./quest";
// export * as vtm5e from "./vtm5e";

/** Looks for text escaped with ` characters that contain emoji (:die: or <:die:12345>) and unescapes those emoji so they render correctly. */
export function correctEscapeForEmoji(value: string): string {
	// We only need to be concerned with `escaped text` substrings
	return value.replace(/`[^`]+`/gu, escapedValue => {
		// Get the emojiRegex
		const emojiRegex = createEmojiRegex();

		// Tokenize the substring so that we can iterate and toggle escaped/unescaped sections
		const tokens = tokenize(escapedValue.slice(1, -1), { emojiRegex });

		// Start with empty string, no emoji, and not escaped
		let output = "", isEmoji = false, isEscaped = false;

		tokens.forEach(token => {
			isEmoji = token.key === "emojiRegex";
			// toggle if we are escaped or not, put the tick before we add the token
			if (isEmoji === isEscaped) {
				output += "`";
				isEscaped = !isEscaped;
			}
			output += token.token;
		});

		// If we are still escaping text, we need the final tick
		if (!isEmoji) {
			output += "`";
		}

		return output;
	});
}
