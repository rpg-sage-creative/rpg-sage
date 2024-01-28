type Options = {
	animated?: boolean | "optional";
};

/**
 * Returns the string source of a discord emoji string.
 * Uses default options: { animated:"optional" }
 */
export function getDiscordEmojiRegexSource(): string;

/**
 * Returns the string source of a discord emoji string.
 */
export function getDiscordEmojiRegexSource(options: Options): string;

export function getDiscordEmojiRegexSource(options?: Options): string {
	// default to optional
	let a = "a?";
	if (options?.animated === true) {
		a = "a";
	}else if (options?.animated === false) {
		a = "";
	}
	return `<${a}:\\w{2,}:\\d{16,}>`;
}