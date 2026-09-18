import type { Optional } from "@rsc-utils/type-utils";
import { AllCodeBlocksRegExpG, type CodeBlockRegexGroups } from "../codeBlocks/AllCodeBlocksRegExp.js";
import type { RedactOptions } from "./RedactOptions.js";

export type RedactCodeBlocksOptions = RedactOptions & {
	/** What character to use for redacted content. When complete === true, ticks get redacted as char; using contentChar allows them to be different. */
	contentChar?: string;
};

/**
 * Converts any characters within back-tick (`) quoted blocks to asterisks.
 * Ex: "a `code` block" becomes "a `****` block".
 * Ignores back-tick characters that are preceded by a slash (\).
 * Ex: " \`doesn't redact\` "
 * Matches 1, 2, or 3 back-tick characters (because Discord's Markdown supports them).
*/
export function redactCodeBlocks(content: string): string;
export function redactCodeBlocks(content: string, redactedCharacter: string | undefined): string;
export function redactCodeBlocks(content: string, options: RedactCodeBlocksOptions): string;

export function redactCodeBlocks(content: Optional<string>): Optional<string>;
export function redactCodeBlocks(content: Optional<string>, redactedCharacter: string | undefined): Optional<string>;
export function redactCodeBlocks(content: Optional<string>, options: RedactCodeBlocksOptions): Optional<string>;

export function redactCodeBlocks(content: Optional<string>, charOrOpts?: string | RedactCodeBlocksOptions): Optional<string> {
	if (!content) return content;

	const { char = "*", complete, contentChar = char, punctuationChar = char } = typeof(charOrOpts) === "string"
		? { char:charOrOpts }
		: charOrOpts ?? {};

	return content.replaceAll(AllCodeBlocksRegExpG, (...args) => {
		const { ticks, content } = args[args.length - 1] as CodeBlockRegexGroups;
		const redactedTicks = complete ? "".padEnd(ticks.length, punctuationChar) : ticks;
		const redactedContent = "".padEnd(content.length, contentChar);
		return redactedTicks + redactedContent + redactedTicks;
	});
}
