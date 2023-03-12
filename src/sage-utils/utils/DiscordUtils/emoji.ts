/** Used to detect one or more adjacent emoji. */
export function createEmojiRegex(): RegExp {
	return /((?:<a?)?:\w{2,}:(?:\d{16,}>)?)+/;
}

/** Used to capture the parts of a custom emoji. */
export function createCustomEmojiRegex(): RegExp {
	return /^<(a)?:(\w{2,}):(\d{16,})>$/;
}
