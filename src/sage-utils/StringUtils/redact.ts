/** Converts any characters within `` blocks to asterisks. Ex: "a `code` block" becomes "a `****` block" */
export function redactCodeBlocks(content: string, redactCharacter = "*"): string {
	return content

		// reverse the string for simpler regex of escaped back-ticks
		.split("").reverse().join("")

		// replace any tick quoted blocks with redact characters
		.replace(/`.*?`(?!\\)/gi, match => `\`${match.slice(1, -1).replace(/./g, redactCharacter)}\``)

		// re-reverse the output to have the correct string; minus block quotes
		.split("").reverse().join("");
}
