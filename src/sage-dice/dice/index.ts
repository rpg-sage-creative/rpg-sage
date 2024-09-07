import { createEmojiRegex } from "@rsc-utils/discord-utils";
import { tokenize } from "@rsc-utils/string-utils";

/** Looks for text escaped with ` characters that contain emoji (:die: or <:die:12345>) and unescapes those emoji so they render correctly. */
export function correctEscapeForEmoji(value: string): string {
	// replace any escaped spoilers with ?? to avoid revealing the value
	// value = value.replace(/\|\|.*?\|\|/g, "??");

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
