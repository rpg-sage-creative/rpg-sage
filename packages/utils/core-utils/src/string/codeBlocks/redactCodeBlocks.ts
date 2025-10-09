import { AllCodeBlocksRegExpG, type CodeBlockRegexGroups } from "../codeBlocks/AllCodeBlocksRegExp.js";

/**
 * Converts any characters within back-tick (`) quoted blocks to asterisks.
 * Ex: "a `code` block" becomes "a `****` block".
 * Ignores back-tick characters that are preceded by a slash (\).
 * Ex: " \`doesn't redact\` "
 * Matches 1, 2, or 3 back-tick characters (because Discord's Markdown supports them).
*/
export function redactCodeBlocks(content: string, redactedCharacter = "*") {
	return content.replaceAll(AllCodeBlocksRegExpG, (...args) => {
		const { ticks, content } = args[args.length - 1] as CodeBlockRegexGroups;
		return ticks + "".padEnd(content?.length, redactedCharacter) + ticks;
	});
}
