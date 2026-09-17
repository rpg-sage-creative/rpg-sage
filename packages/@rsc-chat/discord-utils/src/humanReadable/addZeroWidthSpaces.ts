export function addZeroWidthSpaces(value: string): string {
	return value
		// avoid @here and @everybody
		.replace(/@(?!\u200B)/g, `@\u200B`)
		// fix spoilers
		.replace(/(?<!\u200B)\|/g, `\u200B|`)
		;
}